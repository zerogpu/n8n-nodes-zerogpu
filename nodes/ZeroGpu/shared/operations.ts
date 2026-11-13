import { OCR_MODEL_ID, type ZeroGpuModel } from '../../shared/models';

// Audio operations send and receive files, so they're built in `audio.ts` rather than `routing.ts`.
export type AudioOperation = 'generateSpeech' | 'transcribe' | 'translate';

export type Operation =
	| AudioOperation
	| 'classifyByLabels'
	| 'classifyBySchema'
	| 'classifyDomain'
	| 'classifyIab'
	| 'detectPii'
	| 'embedText'
	| 'extractEntities'
	| 'extractJson'
	| 'extractText'
	| 'moderate'
	| 'redactPii'
	| 'summarize';

const hasUsecase =
	(usecase: string) =>
	({ modelUsecases }: ZeroGpuModel): boolean =>
		Boolean(modelUsecases && usecase in modelUsecases);

// Which models in the ZeroGPU model list each operation can call, by the fields the list reports.
export const MODEL_FILTERS: Record<Operation, (model: ZeroGpuModel) => boolean> = {
	classifyByLabels: ({ taskType }) => taskType === 'classification',
	classifyBySchema: hasUsecase('classification'),
	classifyDomain: ({ taskType }) => taskType === 'iab_classify_domain',
	classifyIab: ({ taskType }) => taskType === 'iab_classify',
	detectPii: hasUsecase('ner'),
	embedText: ({ taskType }) => taskType === 'embedding',
	extractEntities: hasUsecase('ner'),
	extractJson: hasUsecase('json'),
	extractText: ({ modelId }) => modelId === OCR_MODEL_ID,
	generateSpeech: ({ taskType }) => taskType === 'speech',
	moderate: ({ taskType }) => taskType === 'moderation',
	redactPii: hasUsecase('ner'),
	summarize: ({ taskDisplayName }) => taskDisplayName === 'Summarization',
	transcribe: ({ taskType }) => taskType === 'transcription',
	translate: ({ taskType }) => taskType === 'transcription',
};
