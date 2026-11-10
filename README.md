# @zerogpu/n8n-nodes-zerogpu

Official [ZeroGPU](https://zerogpu.ai) community node package for [n8n](https://n8n.io/).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[About ZeroGPU](#about-zerogpu)  
[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Usage](#usage)  
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

**ZeroGPU Chat Model** connects ZeroGPU's language models to n8n's AI nodes, such as AI Agent and Basic LLM Chain. More ZeroGPU models and operations will arrive in later releases.

## Credentials

The package includes a **ZeroGPU API** credential, which the ZeroGPU Chat Model node uses to call ZeroGPU:

1. Log in to the [ZeroGPU dashboard](https://platform.zerogpu.ai/dashboard).
2. Copy a key from the **API Keys** page.
3. In n8n, create a **ZeroGPU API** credential and paste the key.

n8n checks the key when you save the credential. The check doesn't run any inference.

## Usage

1. Add an **AI Agent** or **Basic LLM Chain** node to your workflow.
2. Connect a **ZeroGPU Chat Model** node to its **Chat Model** input and select your **ZeroGPU API** credential.
3. Choose a model. The list comes from ZeroGPU, so it stays current as models are added. To use a model that isn't listed, switch **Model** to an expression and enter its ID. Model IDs are case-sensitive.

Each setting under **Options** is sent only if you add it:

| Option               | What it does                                       |
| -------------------- | -------------------------------------------------- |
| Maximum Tokens       | Limits the length of the response.                 |
| Reasoning Effort     | Sets how much the model reasons before it answers. |
| Sampling Temperature | Controls how random the response is.               |

Some models have limits:

- Models labelled **no tool calling** can't use AI Agent tools or return schema-validated JSON. Use them in a Basic LLM Chain, or choose another model for an agent with tools.
- If you set **Maximum Tokens** or **Reasoning Effort** on a model that doesn't support it, the node stops with an error.
- `gpt-6-luna` only accepts its default temperature, so leave **Sampling Temperature** unset.

If n8n shows a general error, open its details to see ZeroGPU's message:

| Message                                                                | What to do                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Invalid credentials`                                                  | Check the API key in your **ZeroGPU API** credential.           |
| `Model not found`                                                      | Check the model ID, including its capitalization.               |
| `Tool calling is not supported for model`                              | Choose a model that isn't labelled **no tool calling**.         |
| `doesn't support Maximum Tokens` or `doesn't support Reasoning Effort` | Remove that setting under **Options**, or choose another model. |

## Compatibility

Built against `n8n-workflow` 2.x. A minimum n8n version hasn't been established yet.

## Resources

- [ZeroGPU documentation](https://docs.zerogpu.ai/)
- [ZeroGPU quickstart](https://docs.zerogpu.ai/docs/quickstart)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
