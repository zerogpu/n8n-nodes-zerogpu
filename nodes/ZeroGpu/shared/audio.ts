import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodePropertyRouting,
	JsonObject,
} from 'n8n-workflow';
import { jsonParse, NodeApiError } from 'n8n-workflow';
import { fail, getRequiredString } from './routing';

export const SPEECH_FORMATS = ['aac', 'flac', 'mp3', 'opus', 'pcm', 'wav'];
export const TRANSCRIPT_FORMATS = ['json', 'srt', 'text', 'verbose_json', 'vtt'];

type NumberOption = {
	name: string;
	field: string;
	label: string;
	min: number;
	max: number;
	integer?: boolean;
};

const SPEECH_NUMBERS: NumberOption[] = [
	{ name: 'seed', field: 'seed', label: 'Seed', min: 0, max: 4294967295, integer: true },
	{ name: 'temperature', field: 'temperature', label: 'Temperature', min: 0, max: 2 },
	{ name: 'topP', field: 'top_p', label: 'Top P', min: 0, max: 1 },
	{ name: 'topK', field: 'top_k', label: 'Top K', min: 0, max: 10000, integer: true },
	{
		name: 'repetitionPenalty',
		field: 'repetition_penalty',
		label: 'Repetition Penalty',
		min: 1,
		max: 4,
	},
];

const TRANSCRIPT_NUMBERS: NumberOption[] = [
	{ name: 'temperature', field: 'temperature', label: 'Temperature', min: 0, max: 1 },
];

const getOptions = (context: IExecuteSingleFunctions): IDataObject =>
	context.getNodeParameter('options', {}) as IDataObject;

// Values an AI agent fills in skip the limits set on the field, so they're checked here too.
function getNumbers(
	context: IExecuteSingleFunctions,
	options: IDataObject,
	numbers: NumberOption[],
): IDataObject {
	const fields: IDataObject = {};
	for (const { name, field, label, min, max, integer } of numbers) {
		const value = options[name];
		if (value === undefined) continue;
		if (
			typeof value !== 'number' ||
			!(value >= min && value <= max) ||
			(integer && !Number.isInteger(value))
		) {
			fail(
				context,
				`${label} must be ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}`,
			);
		}
		fields[field] = value;
	}
	return fields;
}

function getFormat(
	context: IExecuteSingleFunctions,
	options: IDataObject,
	formats: string[],
): IDataObject {
	const value = options.responseFormat;
	if (value === undefined) return {};
	if (typeof value !== 'string' || !formats.includes(value)) {
		fail(context, `Response Format must be one of ${formats.join(', ')}`);
	}
	return { response_format: value };
}

function getText(options: IDataObject, name: string): string {
	return typeof options[name] === 'string' ? (options[name] as string).trim() : '';
}

async function getFile(
	context: IExecuteSingleFunctions,
	field: string,
): Promise<{ blob: Blob; fileName: string }> {
	const { fileName, mimeType } = context.helpers.assertBinaryData(field);
	const buffer = await context.helpers.getBinaryDataBuffer(field);
	return {
		blob: new Blob([new Uint8Array(buffer)], { type: mimeType }),
		fileName: fileName ?? 'audio',
	};
}

// The node's default JSON content type is dropped so the multipart boundary gets set.
function sendForm(requestOptions: IHttpRequestOptions, fields: IDataObject): FormData {
	const form = new FormData();
	for (const [name, value] of Object.entries(fields)) form.append(name, String(value));

	const headers = { ...requestOptions.headers };
	for (const name of Object.keys(headers)) {
		if (name.toLowerCase() === 'content-type') delete headers[name];
	}
	requestOptions.headers = headers;
	requestOptions.body = form;
	return form;
}

// Without a voice clip the request is JSON. A clip can only be sent as multipart.
export async function buildSpeechRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const options = getOptions(this);
	const fields: IDataObject = {
		model: getRequiredString(this, 'model', 'Model'),
		input: getRequiredString(this, 'text', 'Text'),
		...getFormat(this, options, SPEECH_FORMATS),
		...getNumbers(this, options, SPEECH_NUMBERS),
	};

	const voiceSampleField = getText(options, 'voiceSampleField');
	if (voiceSampleField === '') {
		requestOptions.body = fields;
		return requestOptions;
	}

	const { blob, fileName } = await getFile(this, voiceSampleField);
	sendForm(requestOptions, fields).append('voice_sample', blob, fileName);
	return requestOptions;
}

export async function buildTranscriptionRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const options = getOptions(this);
	const language = getText(options, 'language');
	const prompt = getText(options, 'prompt');
	const fields: IDataObject = {
		model: getRequiredString(this, 'model', 'Model'),
		// Translations always produce English, so that endpoint takes no language.
		...(language && this.getNodeParameter('operation') === 'transcribe' ? { language } : {}),
		...(prompt ? { prompt } : {}),
		...getFormat(this, options, TRANSCRIPT_FORMATS),
		...getNumbers(this, options, TRANSCRIPT_NUMBERS),
	};

	const field = getRequiredString(this, 'binaryPropertyName', 'Input Data Field Name').trim();
	const { blob, fileName } = await getFile(this, field);
	sendForm(requestOptions, fields).append('file', blob, fileName);
	return requestOptions;
}

function isObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Speech is read as bytes, so an error body arrives as bytes too and is decoded here.
function throwApiError(context: IExecuteSingleFunctions, response: IN8nHttpFullResponse): never {
	const text = Buffer.from(response.body as Buffer).toString('utf8');
	const parsed: unknown = jsonParse(text, { fallbackValue: {} });
	const error = isObject(parsed) && isObject(parsed.error) ? parsed.error : {};
	const description = typeof error.message === 'string' ? error.message : text;

	throw new NodeApiError(context.getNode(), (isObject(parsed) ? parsed : {}) as JsonObject, {
		httpCode: String(response.statusCode),
		description,
		itemIndex: context.getItemIndex(),
	});
}

export async function toSpeechBinary(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (response.statusCode >= 400) throwApiError(this, response);

	const options = getOptions(this);
	const format = getText(options, 'responseFormat') || 'mp3';
	const outputField = getText(options, 'binaryPropertyOutput') || 'data';
	const mimeType = String(response.headers['content-type'] ?? '')
		.split(';')[0]
		.trim();

	const binary = await this.helpers.prepareBinaryData(
		Buffer.from(response.body as Buffer),
		`speech.${format}`,
		mimeType || undefined,
	);
	const duration = Number(response.headers['x-audio-duration-seconds']);

	return [
		{
			json: Number.isFinite(duration) ? { durationSeconds: duration } : {},
			binary: { [outputField]: binary },
		},
	];
}

// The text, srt and vtt formats come back as plain text, so they're put under `text`.
export async function parseTranscript(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const { body } = response;
	if (isObject(body)) return [{ json: body }];
	if (body === undefined || body === null || body === '')
		fail(this, 'ZeroGPU returned no transcript');
	return [{ json: { text: String(body) } }];
}

export const speechRouting: INodePropertyRouting = {
	request: {
		method: 'POST',
		url: '/audio/speech',
		headers: { Accept: '*/*' },
		encoding: 'arraybuffer',
		ignoreHttpStatusErrors: true,
	},
	send: { preSend: [buildSpeechRequest] },
	output: { postReceive: [toSpeechBinary] },
};

const transcriptRouting = (url: string): INodePropertyRouting => ({
	request: { method: 'POST', url, headers: { Accept: '*/*' } },
	send: { preSend: [buildTranscriptionRequest] },
	output: { postReceive: [parseTranscript] },
});

export const transcriptionsRouting = transcriptRouting('/audio/transcriptions');
export const translationsRouting = transcriptRouting('/audio/translations');
