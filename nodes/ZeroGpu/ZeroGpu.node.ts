import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { getModels } from './loadOptions/getModels';
import { audioDescription } from './resources/audio';
import { classificationDescription } from './resources/classification';
import { documentDescription } from './resources/document';
import { embeddingDescription } from './resources/embedding';
import { extractionDescription } from './resources/extraction';
import { moderationDescription } from './resources/moderation';
import { summarizationDescription } from './resources/summarization';

export class ZeroGpu implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ZeroGPU',
		name: 'zeroGpu',
		icon: { light: 'file:../../icons/zerogpu.svg', dark: 'file:../../icons/zerogpu.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Classify, extract, redact, moderate, summarize and embed text, read documents, and generate or transcribe speech with ZeroGPU models',
		defaults: {
			name: 'ZeroGPU',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'zeroGpuApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.zerogpu.ai/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Audio', value: 'audio' },
					{ name: 'Classification', value: 'classification' },
					{ name: 'Document', value: 'document' },
					{ name: 'Embedding', value: 'embedding' },
					{ name: 'Extraction', value: 'extraction' },
					{ name: 'Moderation', value: 'moderation' },
					{ name: 'Summarization', value: 'summarization' },
				],
				default: 'classification',
			},
			...audioDescription,
			...classificationDescription,
			...documentDescription,
			...embeddingDescription,
			...extractionDescription,
			...moderationDescription,
			...summarizationDescription,
		],
	};

	methods = {
		loadOptions: {
			getModels,
		},
	};
}
