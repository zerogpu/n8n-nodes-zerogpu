import type { ILoadOptionsFunctions, ISupplyDataFunctions } from 'n8n-workflow';

export const MODELS_URL = 'https://api-dashboard.zerogpu.ai/api/models';

// No field in the model list marks this model as OCR, so it's matched by ID.
export const OCR_MODEL_ID = 'unlimited-ocr';

export type ZeroGpuModel = {
	modelId: string;
	modelDisplayName: string;
	taskDisplayName?: string | null;
	taskType?: string | null;
	modelUsecases?: Record<string, unknown> | null;
	pricing?: { description?: string } | null;
	chat?: { tools: boolean; maxTokens: boolean; reasoningEffort: boolean } | null;
};

// The model list is public, so this sends no credentials and the API key stays on api.zerogpu.ai.
export async function fetchModels(
	context: ILoadOptionsFunctions | ISupplyDataFunctions,
): Promise<ZeroGpuModel[]> {
	const response = (await context.helpers.httpRequest({
		method: 'GET',
		url: MODELS_URL,
		json: true,
	})) as { models?: ZeroGpuModel[] };

	return response.models ?? [];
}
