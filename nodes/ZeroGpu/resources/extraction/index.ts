import type { INodeProperties } from 'n8n-workflow';
import {
	labelsField,
	modelField,
	schemaField,
	textField,
	thresholdOptions,
} from '../../shared/descriptions';
import { chatCompletionsRouting } from '../../shared/routing';

const resource = 'extraction';

const PII_LABELS =
	'person, email, phone number, address, date of birth, credit card number, social security number, ip address';

export const extractionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Detect PII',
				value: 'detectPii',
				action: 'Detect PII in text',
				description: 'Find personal data in text, grouped by type',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Extract Entities',
				value: 'extractEntities',
				action: 'Extract entities from text',
				description: 'Find people, places, products or any entity types you name',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Extract JSON',
				value: 'extractJson',
				action: 'Extract JSON from text',
				description: 'Pull the fields in a schema out of text into JSON',
				routing: chatCompletionsRouting,
			},
			{
				name: 'Redact PII',
				value: 'redactPii',
				action: 'Redact PII from text',
				description: 'Replace personal data in text with tags like [EMAIL]',
				routing: chatCompletionsRouting,
			},
		],
		default: 'detectPii',
	},
	modelField(resource, 'detectPii', 'gliner2.5-base-v1'),
	modelField(resource, 'extractEntities', 'gliner2.5-base-v1'),
	modelField(resource, 'extractJson', 'gliner2.5-base-v1'),
	modelField(resource, 'redactPii', 'gliner2.5-base-v1'),
	textField(
		resource,
		['detectPii', 'extractEntities', 'extractJson', 'redactPii'],
		'The text to extract from',
	),
	labelsField(
		resource,
		['detectPii', 'redactPii'],
		'The types of personal data to find',
		PII_LABELS,
	),
	labelsField(resource, ['extractEntities'], 'The entity types to find, like person or company'),
	schemaField(
		resource,
		'extractJson',
		'JSON object that maps each group to its fields, written as name::type::description',
		'{"contact": ["name::str::Full name", "email::str::Email address"]}',
	),
	thresholdOptions(resource, ['detectPii', 'extractEntities', 'redactPii']),
];
