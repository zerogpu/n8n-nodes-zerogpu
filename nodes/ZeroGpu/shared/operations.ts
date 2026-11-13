import { OCR_MODEL_ID, type ZeroGpuModel } from '../../shared/models';

export type Operation =
	| 'classifyByLabels'
	| 'classifyBySchema'
	| 'classifyDomain'
	| 'classifyIab'
	| 'detectPii'
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
	extractEntities: hasUsecase('ner'),
	extractJson: hasUsecase('json'),
	extractText: ({ modelId }) => modelId === OCR_MODEL_ID,
	moderate: ({ taskType }) => taskType === 'moderation',
	redactPii: hasUsecase('ner'),
	summarize: ({ taskDisplayName }) => taskDisplayName === 'Summarization',
};
