# @zerogpu/n8n-nodes-zerogpu

Official [ZeroGPU](https://zerogpu.ai) community node package for [n8n](https://n8n.io/).

> **Status: early release.** This package sets up the ZeroGPU integration for n8n, but it has no ZeroGPU operations yet. The ZeroGPU node shows a notice and passes input items through unchanged, and it doesn't call the ZeroGPU API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[About ZeroGPU](#about-zerogpu)  
[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  
[License](#license)

## About ZeroGPU

ZeroGPU is a compute-efficient inference provider built for apps and agents. We run purpose-built small and nano language models across an edge network for the high-volume, purpose-specific tasks that apps and agent loops fire constantly — and deliver them at roughly 10x lower latency and 50%+ lower cost than running the same work through a frontier model.

We maintain a growing catalog of specialized small and nano language models across Adtech, agentic tasks, security, classification, extraction, summarization, moderation, intent extraction, routing, and document parsing. Each model is tuned for its job, so you get frontier-level results on the tasks that never needed a frontier model. Frontier models for reasoning, ZeroGPU for everything repeatable around it.

It’s auto-scaling with zero GPU infrastructure — no GPUs to provision and no clusters to manage. The edge-powered network of distributed compute is what lets us deliver this speed and cost, but you never touch it. You just plug in, point a workload at us, and you’re live.

Edge network. Specialized models. Zero GPU infrastructure.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, and use this package name:

```
@zerogpu/n8n-nodes-zerogpu
```

## Operations

None yet. Model and inference operations will arrive in later releases.

## Credentials

The package includes a **ZeroGPU API** credential, ready for future nodes:

1. Log in to the [ZeroGPU dashboard](https://platform.zerogpu.ai/dashboard).
2. Copy a key from the **API Keys** page.
3. In n8n, create a **ZeroGPU API** credential and paste the key.

n8n checks the key when you save the credential. The check doesn't run any inference.

## Compatibility

Built against `n8n-workflow` 2.x. A minimum n8n version hasn't been established yet.

## Resources

- [ZeroGPU documentation](https://docs.zerogpu.ai/)
- [ZeroGPU quickstart](https://docs.zerogpu.ai/docs/quickstart)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
