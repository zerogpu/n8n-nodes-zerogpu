import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodePropertyRouting,
} from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';
import type { Operation } from './operations';

const SUMMARY_PROMPT =
	"Summarize the user's text faithfully and concisely. Reply with the summary only.";

type Message = { role: 'system' | 'user'; content: string | IDataObject[] };

function fail(context: IExecuteSingleFunctions, message: string, description?: string): never {
	throw new NodeOperationError(context.getNode(), message, {
		itemIndex: context.getItemIndex(),
		description,
	});
}

function getRequiredString(context: IExecuteSingleFunctions, name: string, label: string): string {
	const value = String(context.getNodeParameter(name) ?? '');
	if (value.trim() === '') fail(context, `Enter the ${label}`);
	return value;
}

function getLabels(context: IExecuteSingleFunctions): string[] {
	const labels = String(context.getNodeParameter('labels') ?? '')
		.split(',')
		.map((label) => label.trim())
		.filter((label) => label !== '');
	if (labels.length === 0) fail(context, 'Enter at least one label, separated by commas');
	return labels;
}

function getSchema(context: IExecuteSingleFunctions, example: string): IDataObject {
	const shape = `Schema must be a JSON object that maps each name to a list of strings, like ${example}`;
	const value = context.getNodeParameter('schema');

	let schema: unknown = value;
	if (typeof value === 'string') {
		try {
			schema = jsonParse(value);
		} catch {
			fail(context, 'Schema is not valid JSON', shape);
		}
	}

	const isValid =
		typeof schema === 'object' &&
		schema !== null &&
		!Array.isArray(schema) &&
		Object.keys(schema).length > 0 &&
		Object.values(schema).every(
			(items) =>
				Array.isArray(items) &&
				items.length > 0 &&
				items.every((item) => typeof item === 'string' && item.trim() !== ''),
		);
	if (!isValid) fail(context, shape);

	return schema as IDataObject;
}

// Values an AI agent fills in skip the limits set on the field, so they're checked here too.
function getThreshold(context: IExecuteSingleFunctions): IDataObject {
	const { threshold } = context.getNodeParameter('options', {}) as { threshold?: number };
	if (threshold === undefined) return {};
	if (typeof threshold !== 'number' || !(threshold >= 0 && threshold <= 1)) {
		fail(context, 'Threshold must be a number from 0 to 1');
	}
	return { threshold };
}

function chatBody(model: string, messages: Message[], metadata?: IDataObject): IDataObject {
	return metadata ? { model, messages, metadata } : { model, messages };
}

function buildBody(context: IExecuteSingleFunctions, operation: Operation): IDataObject {
	const model = getRequiredString(context, 'model', 'Model');
	const user = (content: string): Message => ({ role: 'user', content });
	const text = () => user(getRequiredString(context, 'text', 'Text'));

	switch (operation) {
		case 'classifyByLabels':
			return chatBody(model, [
				{ role: 'system', content: `[${getLabels(context).join(',')}]` },
				text(),
			]);
		case 'classifyBySchema':
			return chatBody(model, [text()], {
				usecase: 'classification',
				schema: getSchema(context, '{"sentiment": ["positive", "negative"]}'),
				...getThreshold(context),
			});
		case 'classifyDomain':
			return chatBody(model, [user(getRequiredString(context, 'domain', 'Domain'))]);
		case 'classifyIab':
			return chatBody(model, [text()]);
		case 'detectPii':
		case 'extractEntities':
		case 'redactPii':
			return chatBody(model, [text()], {
				usecase: 'ner',
				labels: getLabels(context),
				...getThreshold(context),
			});
		case 'extractJson':
			return chatBody(model, [text()], {
				usecase: 'json',
				schema: getSchema(context, '{"contact": ["name::str::Full name"]}'),
			});
		case 'extractText': {
			const url = getRequiredString(context, 'documentUrl', 'Document URL').trim();
			const filename = url.split(/[?#]/)[0].split('/').pop() || 'document';
			return chatBody(model, [
				{ role: 'user', content: [{ type: 'file', file: { filename, file_data: url } }] },
			]);
		}
		case 'embedText':
		case 'moderate':
			return { model, input: getRequiredString(context, 'text', 'Text') };
		case 'summarize':
			return chatBody(model, [{ role: 'system', content: SUMMARY_PROMPT }, text()]);
	}
}

export async function buildRequestBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = buildBody(this, this.getNodeParameter('operation') as Operation);
	return requestOptions;
}

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Entities come back as values grouped by label, without positions, so every occurrence is replaced.
function redact(text: string, entities: IDataObject): string {
	return Object.entries(entities)
		.flatMap(([label, values]) =>
			(values as unknown[])
				.filter((value): value is string => typeof value === 'string' && value !== '')
				.map((value) => ({
					value,
					tag: `[${label.trim().toUpperCase().replace(/\s+/g, '_')}]`,
				})),
		)
		.sort((a, b) => b.value.length - a.value.length)
		.reduce((result, { value, tag }) => result.split(value).join(tag), text);
}

export async function parseResult(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation') as Operation;
	const body = response.body as { choices?: Array<{ message?: { content?: unknown } }> };
	const content = body?.choices?.[0]?.message?.content;
	if (typeof content !== 'string') {
		fail(this, 'ZeroGPU returned no result', JSON.stringify(response.body));
	}

	if (operation === 'summarize') return [{ json: { summary: content } }];
	if (operation === 'extractText') return [{ json: { markdown: content } }];

	let result: unknown;
	try {
		result = jsonParse(content);
	} catch {
		fail(this, "ZeroGPU returned a result that isn't JSON", content);
	}
	if (!isObject(result)) fail(this, "ZeroGPU returned a result that isn't a JSON object", content);

	if (operation === 'redactPii') {
		const { entities } = result;
		if (!isObject(entities) || !Object.values(entities).every(Array.isArray)) {
			fail(this, 'ZeroGPU returned entities in an unexpected shape', content);
		}
		const text = this.getNodeParameter('text') as string;
		return [{ json: { text: redact(text, entities), entities } }];
	}

	return [{ json: result }];
}

export const chatCompletionsRouting: INodePropertyRouting = {
	request: { method: 'POST', url: '/chat/completions' },
	send: { preSend: [buildRequestBody] },
	output: { postReceive: [parseResult] },
};

export const embeddingsRouting: INodePropertyRouting = {
	request: { method: 'POST', url: '/embeddings' },
	send: { preSend: [buildRequestBody] },
};

export const moderationsRouting: INodePropertyRouting = {
	request: { method: 'POST', url: '/moderations' },
	send: { preSend: [buildRequestBody] },
};
