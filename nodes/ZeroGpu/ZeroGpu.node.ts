import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { getModels } from './loadOptions/getModels';
import { classificationDescription } from './resources/classification';
import { documentDescription } from './resources/document';
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
			'Classify, extract, redact, moderate and summarize text, and read documents, with ZeroGPU models',
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
					{ name: 'Classification', value: 'classification' },
					{ name: 'Document', value: 'document' },
					{ name: 'Extraction', value: 'extraction' },
					{ name: 'Moderation', value: 'moderation' },
					{ name: 'Summarization', value: 'summarization' },
				],
				default: 'classification',
			},
			...classificationDescription,
			...documentDescription,
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
