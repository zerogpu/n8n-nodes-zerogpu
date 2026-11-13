import type { INodeProperties } from 'n8n-workflow';
import { modelField, textField } from '../../shared/descriptions';
import { chatCompletionsRouting } from '../../shared/routing';

const resource = 'summarization';

export const summarizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Summarize Text',
				value: 'summarize',
				action: 'Summarize text',
				description: 'Condense text into a short summary',
				routing: chatCompletionsRouting,
			},
		],
		default: 'summarize',
	},
	modelField(resource, 'summarize', 'llama-3.1-8b-instruct-fast'),
	textField(resource, ['summarize'], 'The text to summarize'),
];
