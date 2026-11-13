import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { supplyModel } from '@n8n/ai-node-sdk';
import { fetchModels, OCR_MODEL_ID, type ZeroGpuModel } from '../shared/models';

const BASE_URL = 'https://api.zerogpu.ai/v1';

const CHAT_TASKS = ['Text Generation', 'Summarization'];

type ModelOptions = {
	maxTokens?: number;
	reasoningEffort?: string;
	temperature?: number;
};

// `chat: null` marks a model that can't chat. Until the model list reports `chat`, the text
// generation task groups stand in, minus the models in them that reject chat requests.
function isChatModel({ chat, taskDisplayName, taskType, modelId }: ZeroGpuModel): boolean {
	if (chat !== undefined) return chat !== null;

	return (
		CHAT_TASKS.includes(taskDisplayName ?? '') &&
		taskType !== 'moderation' &&
		modelId !== OCR_MODEL_ID
	);
}

// Some models accept these settings but silently ignore them, so they must fail here instead.
async function assertSettingsSupported(
	context: ISupplyDataFunctions,
	model: string,
	options: ModelOptions,
	itemIndex: number,
): Promise<void> {
	let models: ZeroGpuModel[];
	try {
		models = await fetchModels(context);
	} catch {
		// An outage of the model list must not stop a running workflow.
		return;
	}

	const capabilities = models.find(({ modelId }) => modelId === model)?.chat;
	if (!capabilities) return;

	const unsupported: string[] = [];
	if (options.maxTokens !== undefined && capabilities.maxTokens === false) {
		unsupported.push('Maximum Tokens');
	}
	if (options.reasoningEffort !== undefined && capabilities.reasoningEffort === false) {
		unsupported.push('Reasoning Effort');
	}

	if (unsupported.length > 0) {
		throw new NodeOperationError(
			context.getNode(),
			`${model} doesn't support ${unsupported.join(' or ')}. Remove it from Options or choose another model.`,
			{ itemIndex },
		);
	}
}

export class ZeroGpuChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ZeroGPU Chat Model',
		name: 'zeroGpuChatModel',
		icon: { light: 'file:../../icons/zerogpu.svg', dark: 'file:../../icons/zerogpu.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["model"]}}',
		description: 'Use ZeroGPU small and nano language models in AI workflows',
		defaults: {
			name: 'ZeroGPU Chat Model',
		},
		codex: {
			categories: ['assistant'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [{ url: 'https://github.com/zerogpu/n8n-nodes-zerogpu#readme' }],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
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
				default: 'deepseek-v4.1-flash',
				description:
					'The model which will generate the completion. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Maximum Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 1024,
						typeOptions: { minValue: 1 },
						description: 'The maximum number of tokens to generate in the response',
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoningEffort',
						type: 'options',
						default: 'medium',
						options: [
							{ name: 'Extra High', value: 'xhigh' },
							{ name: 'High', value: 'high' },
							{ name: 'Low', value: 'low' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Minimal', value: 'minimal' },
							{ name: 'None', value: 'none' },
						],
						description: 'How much the model reasons before it answers',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						type: 'number',
						default: 0.7,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const models = await fetchModels(this);

				return models
					.filter(isChatModel)
					.map(({ modelId, modelDisplayName, pricing, chat }) => ({
						name:
							chat?.tools === false ? `${modelDisplayName} (no tool calling)` : modelDisplayName,
						value: modelId,
						description: pricing?.description,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const model = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as ModelOptions;

		if (options.maxTokens !== undefined || options.reasoningEffort !== undefined) {
			await assertSettingsSupported(this, model, options, itemIndex);
		}

		const credentials = await this.getCredentials('zeroGpuApi');

		return supplyModel(this, {
			type: 'openai',
			baseUrl: BASE_URL,
			apiKey: credentials.apiKey as string,
			model,
			temperature: options.temperature,
			maxTokens: options.maxTokens,
			// The SDK's `reasoning` option only reaches the API for models named gpt-5* or o<digit>.
			additionalParams: options.reasoningEffort
				? { reasoning_effort: options.reasoningEffort }
				: undefined,
		});
	}
}
