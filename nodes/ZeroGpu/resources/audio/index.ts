import type { INodeProperties } from 'n8n-workflow';
import { speechRouting, transcriptionsRouting, translationsRouting } from '../../shared/audio';
import { modelField, textField } from '../../shared/descriptions';
import type { AudioOperation } from '../../shared/operations';

const resource = 'audio';

const show = (operation: AudioOperation[]) => ({
	show: { resource: [resource], operation },
});

function transcriptOptions(operation: 'transcribe' | 'translate'): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation]),
		options: [
			...(operation === 'transcribe'
				? [
						{
							displayName: 'Language',
							name: 'language',
							type: 'string' as const,
							default: '',
							placeholder: 'e.g. en',
							description:
								'The language spoken, as an ISO-639-1 code like en. Detected automatically when empty.',
						},
					]
				: []),
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Text to guide spelling and style, such as names or jargon',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				default: 'json',
				options: [
					{ name: 'JSON', value: 'json', description: 'The transcript under text' },
					{ name: 'SRT', value: 'srt', description: 'SRT subtitles under text' },
					{ name: 'Text', value: 'text', description: 'The plain transcript under text' },
					{
						name: 'Verbose JSON',
						value: 'verbose_json',
						description: 'The transcript with its language, duration and timed segments',
					},
					{ name: 'VTT', value: 'vtt', description: 'WebVTT subtitles under text' },
				],
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				description: 'Sampling temperature, from 0 to 1',
			},
		],
	};
}

export const audioDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Generate Speech',
				value: 'generateSpeech',
				action: 'Generate speech from text',
				description: 'Turn English text into spoken audio, in the built-in voice or a cloned one',
				routing: speechRouting,
			},
			{
				name: 'Transcribe Audio',
				value: 'transcribe',
				action: 'Transcribe audio into text',
				description: 'Turn speech in an audio file into text',
				routing: transcriptionsRouting,
			},
			{
				name: 'Translate Audio',
				value: 'translate',
				action: 'Translate audio',
				description: 'Turn speech in any language into English text',
				routing: translationsRouting,
			},
		],
		default: 'generateSpeech',
	},
	modelField(resource, 'generateSpeech', 'chatterbox-nano'),
	modelField(resource, 'transcribe', 'whisper-tiny'),
	modelField(resource, 'translate', 'whisper-tiny'),
	textField(
		resource,
		['generateSpeech'],
		'The English text to speak, up to 2,000 characters. Tags like [laugh] or [cough] add cues.',
	),
	{
		displayName: 'Input Data Field Name',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		hint: 'The name of the input binary field containing the audio file',
		description:
			'Up to 25 MB and 10 minutes, in one of these formats: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav or webm',
		displayOptions: show(['transcribe', 'translate']),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['generateSpeech']),
		options: [
			{
				displayName: 'Put Output in Field',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				hint: 'The name of the output binary field to put the audio in',
			},
			{
				displayName: 'Repetition Penalty',
				name: 'repetitionPenalty',
				type: 'number',
				default: 1.2,
				typeOptions: { minValue: 1, maxValue: 4, numberPrecision: 2 },
				description: 'Penalty on repeated speech tokens, from 1 to 4',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				default: 'mp3',
				options: [
					{ name: 'AAC', value: 'aac' },
					{ name: 'FLAC', value: 'flac' },
					{ name: 'MP3', value: 'mp3' },
					{ name: 'Opus', value: 'opus' },
					{ name: 'PCM', value: 'pcm', description: 'Raw 16-bit little-endian mono at 24 kHz' },
					{ name: 'WAV', value: 'wav' },
				],
				description: 'The format of the audio',
			},
			{
				displayName: 'Seed',
				name: 'seed',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 4294967295 },
				description:
					'Pins sampling so the same request gives the same audio, on a best-effort basis',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.8,
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				description: 'Sampling temperature, from 0 to 2',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 1000,
				typeOptions: { minValue: 0, maxValue: 10000 },
				description: 'Samples from only this many of the most likely tokens, from 0 to 10,000',
			},
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 0.95,
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				description: 'Nucleus sampling, from 0 to 1',
			},
			{
				displayName: 'Voice Sample Field',
				name: 'voiceSampleField',
				type: 'string',
				default: '',
				placeholder: 'e.g. voice',
				hint: 'The name of the input binary field containing a clip of the voice to clone',
				description:
					'A 6 to 30 second clip, up to 10 MB, in one of these formats: mp3, m4a, wav, flac, ogg, webm or mp4. Overrides the built-in voice.',
			},
		],
	},
	transcriptOptions('transcribe'),
	transcriptOptions('translate'),
];
