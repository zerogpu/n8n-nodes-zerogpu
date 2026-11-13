import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchModels } from '../../shared/models';
import { MODEL_FILTERS, type Operation } from '../shared/operations';

export async function getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const operation = this.getCurrentNodeParameter('operation') as Operation;
	const fits = MODEL_FILTERS[operation];
	if (!fits) return [];

	const models = await fetchModels(this);

	return models
		.filter(fits)
		.map(({ modelId, pricing }) => ({
			name: modelId,
			value: modelId,
			description: pricing?.description,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}
