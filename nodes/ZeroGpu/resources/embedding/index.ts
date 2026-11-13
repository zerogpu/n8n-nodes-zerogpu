import type { INodeProperties } from 'n8n-workflow';
import { modelField, textField } from '../../shared/descriptions';
import { embeddingsRouting } from '../../shared/routing';

const resource = 'embedding';

export const embeddingDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Embed Text',
				value: 'embedText',
				action: 'Embed text',
				description: 'Turn text into a vector for semantic search, clustering and deduplication',
				routing: embeddingsRouting,
			},
		],
		default: 'embedText',
	},
	modelField(resource, 'embedText', 'all-minilm-l6-v2'),
	textField(resource, ['embedText'], 'The text to embed'),
];
