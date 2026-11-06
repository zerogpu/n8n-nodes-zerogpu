import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

// Placeholder: n8n refuses to install a package with no nodes. Remove it once the first real node lands.
export class ZeroGpu implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ZeroGPU',
		name: 'zeroGpu',
		icon: { light: 'file:../../icons/zerogpu.svg', dark: 'file:../../icons/zerogpu.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'No operations yet',
		description: 'Compute-efficient inference with small and nano language models',
		defaults: {
			name: 'ZeroGPU',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					'This early release has no ZeroGPU operations yet. Input items pass through unchanged.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return [this.getInputData()];
	}
}
