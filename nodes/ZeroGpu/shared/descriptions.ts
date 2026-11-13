import type { INodeProperties } from 'n8n-workflow';
import type { Operation } from './operations';

type Show = { resource: string[]; operation: Operation[] };

const show = (resource: string, operation: Operation[]): { show: Show } => ({
	show: { resource: [resource], operation },
});

export function modelField(
	resource: string,
	operation: Operation,
	defaultModel: string,
): INodeProperties {
	return {
		displayName: 'Model Name or ID',
		name: 'model',
		type: 'options',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getModels',
			loadOptionsDependsOn: ['operation'],
			allowArbitraryValues: true,
		},
		default: defaultModel,
		description:
			'The ZeroGPU model to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: show(resource, [operation]),
	};
}

export function textField(
	resource: string,
	operation: Operation[],
	description: string,
): INodeProperties {
	return {
		displayName: 'Text',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		description,
		displayOptions: show(resource, operation),
	};
}

export function labelsField(
	resource: string,
	operation: Operation[],
	description: string,
	defaultLabels = '',
): INodeProperties {
	return {
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		required: true,
		default: defaultLabels,
		placeholder: 'e.g. positive, negative, neutral',
		description: `${description}, separated by commas`,
		displayOptions: show(resource, operation),
	};
}

export function schemaField(
	resource: string,
	operation: Operation,
	description: string,
	example: string,
): INodeProperties {
	return {
		displayName: 'Schema',
		name: 'schema',
		type: 'json',
		required: true,
		default: '{}',
		description,
		hint: `For example: ${example}`,
		displayOptions: show(resource, [operation]),
	};
}

export function thresholdOptions(resource: string, operation: Operation[]): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(resource, operation),
		options: [
			{
				displayName: 'Threshold',
				name: 'threshold',
				type: 'number',
				default: 0.3,
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				description: 'Minimum confidence, from 0 to 1, for a result to be returned',
			},
		],
	};
}
