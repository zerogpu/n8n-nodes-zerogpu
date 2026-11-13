import type { INodeProperties } from 'n8n-workflow';
import {
	labelsField,
	modelField,
	schemaField,
	textField,
	thresholdOptions,
} from '../../shared/descriptions';
import { chatCompletionsRouting } from '../../shared/routing';

const resource = 'classification';

export const classificationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Classify by Labels',
				value: 'classifyByLabels',
				action: 'Classify text by labels',
				description: 'Score text against labels you choose, with no training',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Classify by Schema',
				value: 'classifyBySchema',
				action: 'Classify text by schema',
				description: 'Pick one label for each category in a schema',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Classify Domain',
				value: 'classifyDomain',
				action: 'Classify a website by its domain',
				description: 'Map a domain name to IAB categories, audiences and topics',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Classify IAB Category',
				value: 'classifyIab',
				action: 'Classify text into IAB categories',
				description: 'Map text to the IAB content and audience taxonomies',
				routing: chatCompletionsRouting,
			},
		],
		default: 'classifyByLabels',
	},
	modelField(resource, 'classifyByLabels', 'deberta-v3-small'),
	modelField(resource, 'classifyBySchema', 'gliner2.5-base-v1'),
	modelField(resource, 'classifyDomain', 'zlm-v1-iab-domain-classifier'),
	modelField(resource, 'classifyIab', 'zlm-v1-iab-classify-edge'),
	textField(
		resource,
		['classifyByLabels', 'classifyBySchema', 'classifyIab'],
		'The text to classify',
	),
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. espn.com',
		description: 'The domain name of the website to classify',
		displayOptions: { show: { resource: [resource], operation: ['classifyDomain'] } },
	},
	labelsField(resource, ['classifyByLabels'], 'The labels to score the text against'),
	schemaField(
		resource,
		'classifyBySchema',
		'JSON object that maps each category to the labels to choose from',
		'{"sentiment": ["positive", "negative", "neutral"], "topic": ["billing", "support"]}',
	),
	thresholdOptions(resource, ['classifyBySchema']),
];
