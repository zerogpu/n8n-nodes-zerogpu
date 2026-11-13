import type { INodeProperties } from 'n8n-workflow';
import { modelField } from '../../shared/descriptions';
import { chatCompletionsRouting } from '../../shared/routing';

const resource = 'document';

export const documentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Extract Text',
				value: 'extractText',
				action: 'Extract text from a document',
				description: 'Read a PDF, scan or image at a URL and return its text as Markdown',
				routing: chatCompletionsRouting,
			},
		],
		default: 'extractText',
	},
	modelField(resource, 'extractText', 'unlimited-ocr'),
	{
		displayName: 'Document URL',
		name: 'documentUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://example.com/invoice.pdf',
		description: 'Public URL of the PDF, scanned document or image to read. Billed per page.',
		displayOptions: { show: { resource: [resource], operation: ['extractText'] } },
	},
];
