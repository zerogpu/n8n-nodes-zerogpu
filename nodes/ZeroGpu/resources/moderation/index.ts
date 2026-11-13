import type { INodeProperties } from 'n8n-workflow';
import { modelField, textField } from '../../shared/descriptions';
import { moderationsRouting } from '../../shared/routing';

const resource = 'moderation';

export const moderationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Moderate Text',
				value: 'moderate',
				action: 'Moderate text',
				description: 'Check text for harassment, hate, violence and other unsafe content',
				routing: moderationsRouting,
			},
		],
		default: 'moderate',
	},
	modelField(resource, 'moderate', 'zlm-v1-moderation-edge'),
	textField(resource, ['moderate'], 'The text to check'),
];
