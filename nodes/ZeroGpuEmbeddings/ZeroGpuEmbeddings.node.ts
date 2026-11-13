import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	JsonObject,
	SupplyData,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { fetchModels } from '../shared/models';

const EMBEDDINGS_URL = 'https://api.zerogpu.ai/v1/embeddings';

// The embeddings endpoint accepts at most 256 inputs per request.
const BATCH_SIZE = 256;

const isVector = (value: unknown): value is number[] =>
	Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'number');

async function requestEmbeddings(
	context: ISupplyDataFunctions,
	model: string,
	input: string[],
): Promise<number[][]> {
	let response: { data?: Array<{ index?: unknown; embedding?: unknown } | null> };
	try {
		response = await context.helpers.httpRequestWithAuthentication.call(context, 'zeroGpuApi', {
			method: 'POST',
			url: EMBEDDINGS_URL,
			body: { model, input },
			json: true,
		});
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}

	// Each vector carries the position of its input, so it's placed by that rather than by order.
	const vectors: Array<number[] | undefined> = input.map(() => undefined);
	const data = response?.data;
	if (Array.isArray(data) && data.length === input.length) {
		for (const item of data) {
			if (typeof item?.index === 'number' && item.index in vectors && isVector(item.embedding)) {
				vectors[item.index] = item.embedding;
			}
		}
	}
	if (!vectors.every(isVector)) {
		throw new NodeOperationError(
			context.getNode(),
			'ZeroGPU returned embeddings in an unexpected shape',
		);
	}

	return vectors;
}

// Shows each call's input and output on this node in the editor, as n8n's own embeddings nodes do.
async function logged<T extends number[] | number[][]>(
	context: ISupplyDataFunctions,
	input: IDataObject,
	run: () => Promise<T>,
): Promise<T> {
	const { index } = context.addInputData(NodeConnectionTypes.AiEmbedding, [[{ json: input }]]);
	try {
		const response = await run();
		context.addOutputData(NodeConnectionTypes.AiEmbedding, index, [[{ json: { response } }]]);
		return response;
	} catch (error) {
		const failure =
			error instanceof NodeApiError || error instanceof NodeOperationError
				? error
				: new NodeOperationError(context.getNode(), error as Error);
		context.addOutputData(NodeConnectionTypes.AiEmbedding, index, failure);
		throw failure;
	}
}

export class ZeroGpuEmbeddings implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ZeroGPU Embeddings',
		name: 'zeroGpuEmbeddings',
		icon: { light: 'file:../../icons/zerogpu.svg', dark: 'file:../../icons/zerogpu.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["model"]}}',
		description: 'Use ZeroGPU embedding models in vector stores and RAG workflows',
		defaults: {
			name: 'ZeroGPU Embeddings',
		},
		codex: {
			categories: ['assistant'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [{ url: 'https://github.com/zerogpu/n8n-nodes-zerogpu#readme' }],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiEmbedding],
		outputNames: ['Embeddings'],
		credentials: [
			{
				name: 'zeroGpuApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getModels',
					allowArbitraryValues: true,
				},
				default: 'all-minilm-l6-v2',
				description:
					'The embedding model to use. Switching to a model with a different vector size means re-indexing. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const models = await fetchModels(this);

				return models
					.filter(({ taskType }) => taskType === 'embedding')
					.map(({ modelId, pricing }) => ({
						name: modelId,
						value: modelId,
						description: pricing?.description,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const model = String(this.getNodeParameter('model', itemIndex) ?? '').trim();
		if (model === '') {
			throw new NodeOperationError(this.getNode(), 'Enter the Model', { itemIndex });
		}

		// Vector stores only call these two methods, so they're all the embeddings object needs.
		const embeddings = {
			embedDocuments: async (documents: unknown): Promise<number[][]> => {
				if (!Array.isArray(documents)) {
					throw new NodeOperationError(this.getNode(), 'Documents must be an array', {
						description: 'Expected an array of strings to embed.',
					});
				}
				const invalid = documents.findIndex((doc) => typeof doc !== 'string' || doc === '');
				if (invalid !== -1) {
					throw new NodeOperationError(this.getNode(), `Invalid document at index ${invalid}`, {
						description: `Document at index ${invalid} is empty or isn't text. All documents must be non-empty strings.`,
					});
				}

				return await logged(this, { documents }, async () => {
					const vectors: number[][] = [];
					for (let start = 0; start < documents.length; start += BATCH_SIZE) {
						const batch = (documents as string[]).slice(start, start + BATCH_SIZE);
						vectors.push(...(await requestEmbeddings(this, model, batch)));
					}
					return vectors;
				});
			},

			embedQuery: async (query: unknown): Promise<number[]> => {
				if (typeof query !== 'string' || query === '') {
					throw new NodeOperationError(this.getNode(), 'Cannot embed empty or undefined text', {
						description:
							'The text to embed is empty or undefined. This can happen when an expression evaluates to nothing, or an AI agent calls a tool without the text.',
					});
				}

				return await logged(
					this,
					{ query },
					async () => (await requestEmbeddings(this, model, [query]))[0],
				);
			},
		};

		return { response: embeddings };
	}
}
