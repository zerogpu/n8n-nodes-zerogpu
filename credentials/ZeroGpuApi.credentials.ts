import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class ZeroGpuApi implements ICredentialType {
	name = 'zeroGpuApi';

	displayName = 'ZeroGPU API';

	documentationUrl = 'https://docs.zerogpu.ai/docs/quickstart';

	icon: Icon = { light: 'file:../icons/zerogpu.svg', dark: 'file:../icons/zerogpu.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your ZeroGPU API key, from the API Keys page of the ZeroGPU dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	// GET /v1/models is public and would accept any key, so check against an endpoint that needs auth.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.zerogpu.ai/v1',
			url: '/files',
			method: 'GET',
		},
	};
}
