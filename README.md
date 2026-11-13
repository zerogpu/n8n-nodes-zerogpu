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

The package has three nodes:

- **ZeroGPU** runs ZeroGPU's task models on text, documents and audio. Use it as a step in any workflow, or attach it to an AI Agent as **ZeroGPU Tool**.
- **ZeroGPU Chat Model** connects ZeroGPU's language models to n8n's AI nodes, such as AI Agent and Basic LLM Chain.
- **ZeroGPU Embeddings** connects ZeroGPU's embedding models to n8n's vector stores, for semantic search and RAG.

The **ZeroGPU** node has these operations:

| Resource       | Operation             | Returns                                                                         | Default model                  |
| -------------- | --------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| Audio          | Generate Speech       | Spoken audio of the text, as a binary file                                      | `chatterbox-nano`              |
|                | Transcribe Audio      | The text of the speech in an audio file                                         | `whisper-tiny`                 |
|                | Translate Audio       | The speech in an audio file, as English text                                    | `whisper-tiny`                 |
| Classification | Classify by Labels    | A score for each label                                                          | `deberta-v3-small`             |
|                | Classify by Schema    | One label for each category                                                     | `gliner2.5-base-v1`            |
|                | Classify Domain       | IAB categories, audiences and topics for a domain name                          | `zlm-v1-iab-domain-classifier` |
|                | Classify IAB Category | IAB content and audience categories                                             | `zlm-v1-iab-classify-edge`     |
| Document       | Extract Text          | The document's text as Markdown                                                 | `unlimited-ocr`                |
| Embedding      | Embed Text            | A vector for the text, in OpenAI's embeddings format                            | `all-minilm-l6-v2`             |
| Extraction     | Detect PII            | The personal data found, grouped by type                                        | `gliner2.5-base-v1`            |
|                | Extract Entities      | The entities found, grouped by type                                             | `gliner2.5-base-v1`            |
|                | Extract JSON          | The fields in your schema, filled in from the text                              | `gliner2.5-base-v1`            |
|                | Redact PII            | The text with personal data replaced by tags like `[EMAIL]`, and what was found | `gliner2.5-base-v1`            |
| Moderation     | Moderate Text         | Whether the text is flagged, with a score for each safety category              | `zlm-v1-moderation-edge`       |
| Summarization  | Summarize Text        | A short summary                                                                 | `llama-3.1-8b-instruct-fast`   |

## Credentials

The package includes a **ZeroGPU API** credential, which every node in the package uses to call ZeroGPU:

1. Log in to the [ZeroGPU dashboard](https://platform.zerogpu.ai/dashboard).
2. Copy a key from the **API Keys** page.
3. In n8n, create a **ZeroGPU API** credential and paste the key.

n8n checks the key when you save the credential. The check doesn't run any inference.

## Usage

### ZeroGPU

1. Add a **ZeroGPU** node to your workflow and select your **ZeroGPU API** credential.
2. Choose a **Resource** and an **Operation**.
3. Choose a model. The list shows the ZeroGPU models that can run the operation and comes from ZeroGPU, so it stays current as models are added. To use a model that isn't listed, switch **Model** to an expression and enter its ID.

Some fields take a particular format:

- **Labels**: separate the labels with commas, like `positive, negative, neutral`. A label can't contain a comma. **Detect PII** and **Redact PII** start with common types of personal data. Edit the list to find other types.
- **Schema** for **Classify by Schema**: a JSON object that maps each category to the labels to choose from, like `{"sentiment": ["positive", "negative", "neutral"], "topic": ["billing", "support"]}`.
- **Schema** for **Extract JSON**: a JSON object that maps each group to its fields, written as `name::type::description`, like `{"contact": ["name::str::Full name", "email::str::Email address"]}`.
- **Threshold**, under **Options**: the minimum confidence, from 0 to 1, for a label or entity to be returned. Lower it to find more.
- **Document URL**: the public URL of a PDF, scanned document or image. ZeroGPU bills **Extract Text** per page.
- **Input Data Field Name** for **Transcribe Audio** and **Translate Audio**: the binary field that holds the audio file, `data` by default, like the output of a **Read/Write Files from Disk** or **HTTP Request** node. The file can be up to 25 MB and 10 minutes long, in flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav or webm.
- **Text** for **Generate Speech**: English text up to 2,000 characters. Tags like `[laugh]` or `[cough]` add cues.
- **Voice Sample Field**, under **Options** for **Generate Speech**: the binary field that holds a 6 to 30 second clip of the voice to clone, up to 10 MB. Leave it empty to use the built-in voice.

**Redact PII** replaces every place each value it finds appears, so a name mentioned three times is replaced three times. It only finds the types listed in **Labels**.

**Generate Speech** puts the audio in the `data` binary field, or the field set in **Put Output in Field**, and returns its length in seconds as `durationSeconds`. ZeroGPU bills audio per minute. `whisper-tiny` and `chatterbox-nano` round up to the next whole minute, with a one-minute minimum, and `chatterbox` rounds up to the next second.

### ZeroGPU Tool

Attach the **ZeroGPU** node to an AI Agent so the agent can call it:

1. In an **AI Agent** node, click **+** under **Tool**, search for **ZeroGPU** and choose **ZeroGPU Tool**.
2. Select your credential, then choose a **Resource** and an **Operation**. Each tool runs one operation, so add a tool for each operation the agent should use.
3. For each field the agent should fill in, such as **Text**, click **Let the model define this parameter** next to it. Leave fields like **Model** and **Labels** fixed if the agent shouldn't change them.

n8n describes the tool to the agent based on its operation. To write the description yourself, set **Tool Description** to **Set Manually**.

The **Audio** operations read or write binary files, which an agent can't pass to a tool, so use them as regular workflow steps instead.

### ZeroGPU Chat Model

1. Add an **AI Agent** or **Basic LLM Chain** node to your workflow.
2. Connect a **ZeroGPU Chat Model** node to its **Chat Model** input and select your **ZeroGPU API** credential.
3. Choose a model. The list shows ZeroGPU's text generation and summarization models and comes from ZeroGPU, so it stays current as models are added. To use a model that isn't listed, switch **Model** to an expression and enter its ID. Model IDs are case-sensitive.

Each setting under **Options** is sent only if you add it:

| Option               | What it does                                       |
| -------------------- | -------------------------------------------------- |
| Maximum Tokens       | Limits the length of the response.                 |
| Reasoning Effort     | Sets how much the model reasons before it answers. |
| Sampling Temperature | Controls how random the response is.               |

Some models have limits:

- Some models can't use AI Agent tools or return schema-validated JSON, and stop with `Tool calling is not supported for model`. Models labelled **no tool calling** are among them. Use them in a Basic LLM Chain, or choose another model for an agent with tools.
- If you set **Maximum Tokens** or **Reasoning Effort** on a model that doesn't support it, the node stops with an error. A few models accept a setting and ignore it instead: **Reasoning Effort** on `gpt-4.1-mini` and `llama-3.1-8b-instruct-fast`, and **Maximum Tokens** on `zlm-v1-tool-decisions`.
- `gpt-6-luna` only accepts its default temperature, so leave **Sampling Temperature** unset.

### ZeroGPU Embeddings

1. Add a vector store node, such as **In-Memory Vector Store**, **Pinecone Vector Store** or **Supabase Vector Store**.
2. Connect a **ZeroGPU Embeddings** node to its **Embedding** input and select your **ZeroGPU API** credential.
3. Choose a model. The list shows ZeroGPU's embedding models and comes from ZeroGPU, so it stays current as models are added.

Use the same model to insert documents and to search them. `all-minilm-l6-v2` and `bge-small-en-v1.5` both return 384-dimensional vectors, so create your vector index with 384 dimensions. Switching to a model with a different vector size means inserting your documents again.

`all-minilm-l6-v2` reads up to 256 tokens of each text and `bge-small-en-v1.5` up to 512, so split long documents into chunks that fit, for example with a **Recursive Character Text Splitter**. ZeroGPU embeds up to 256 texts per request, and the node splits larger batches for you.

To get vectors in a regular workflow instead, use the **Embed Text** operation of the **ZeroGPU** node. The vector is at `data[0].embedding` in its output.

### Errors

If n8n shows a general error in any node, open its details to see ZeroGPU's message:

| Message                                                                                                   | What to do                                                                                                         |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Invalid credentials`                                                                                     | Check the API key in your **ZeroGPU API** credential.                                                              |
| `Model not found`                                                                                         | Check the model ID, including its capitalization.                                                                  |
| `Tool calling is not supported for model`                                                                 | Choose another model, or use a Basic LLM Chain.                                                                    |
| `doesn't support Maximum Tokens`, `doesn't support Reasoning Effort` or `Unsupported parameter`           | Remove that setting under **Options**, or choose another model.                                                    |
| `Upstream inference failed`                                                                               | ZeroGPU couldn't run the model this time. Run the node again, or turn on **Retry On Fail** in the node's settings. |
| `Model is not loaded`                                                                                     | The model is starting up. Run the node again in a moment, or turn on **Retry On Fail** in the node's settings.     |
| `Model not supported` or `Unsupported usecase`                                                            | Choose a model from the list for the operation.                                                                    |
| `Enter the …`, `Enter at least one label`, `Schema must be a JSON object…` or `… must be a number from …` | Fix the field named in the message.                                                                                |
| `The item has no binary field`                                                                            | Make **Input Data Field Name** or **Voice Sample Field** match a binary field from the previous node.              |
| `exceeds the 2000 character limit`                                                                        | Split the text and generate speech for each part.                                                                  |
| `file_too_large`, `audio_too_long`, `voice_sample_too_large` or `voice_sample_too_long`                   | Use audio up to 25 MB and 10 minutes long, and a voice clip up to 10 MB and 30 seconds long.                       |
| `voice_conditioning_failed`                                                                               | ZeroGPU couldn't clone the voice from the clip. Try another clip of 6 to 30 seconds.                               |
| `Invalid document at index` or `Cannot embed empty or undefined text`                                     | A text sent to **ZeroGPU Embeddings** was empty. Check the data loader or expression that supplies it.             |

## Compatibility

Built against `n8n-workflow` 2.x. A minimum n8n version hasn't been established yet.

## Resources

- [ZeroGPU documentation](https://docs.zerogpu.ai/)
- [ZeroGPU quickstart](https://docs.zerogpu.ai/docs/quickstart)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
