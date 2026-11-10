# n8n community node

## Overview
This is a project containing code for an n8n community node. n8n is a workflow
automation platform where users build workflows with nodes, which are the
building block of a workflow. Nodes can perform a range of actions, such as
starting a workflow (called a "trigger node"), fetching and sending data, or
processing and manipulating it. Besides that there are credentials - entities
that store sensitive information on how to connect to external services and
APIs. A node can require some credentials to be used. Community nodes are a way
for anyone to create such nodes and add them to be used in n8n. All community
nodes are named in a format: `n8n-nodes-<n>` or `@org/n8n-nodes-<n>`.
Community nodes can also be submitted for approval to be used on n8n Cloud
version. In that case there are rules that the node needs to follow in order to
be approved

## Important notes
- Follow the **rules and guidelines in this document and the linked docs
  below** over any code examples.
- All code blocks in these docs are **illustrative and incomplete**.
  They **MUST NOT** be copied verbatim or assumed to be the final desired code.
- Replace example names like `Example`, `Wordpress`, `wordpressApi`, etc.
  with names that match the **actual service / node** you are building.
- When in doubt, **generalize from the patterns**, don't replicate the exact
  structure, fields, or values from the examples.
- Produce the **full implementation** needed for the current project
  (nodes, credentials, tests, etc.), not just fragments similar to examples.
- If an example omits parts (e.g. types, operations, properties), **infer and
  implement the missing parts** based on the real requirements / API docs.
- Never output `Wordpress`-specific code unless the project is actually about
  WordPress.

## ZeroGPU
This package is the official n8n integration for ZeroGPU, a compute-efficient
inference provider that runs small and nano language models on an edge network.
Check https://docs.zerogpu.ai/llms.txt for the current docs index before adding
a node.

### API
- Base URL: `https://api.zerogpu.ai/v1`. It is OpenAI-compatible
- Auth: `x-api-key: <key>` or `Authorization: Bearer <key>` on inference
  endpoints. The Batch and Files APIs accept `x-api-key` only
- Inference endpoints (all POST): `/responses`, `/chat/completions`,
  `/moderations`, `/systemone`, `/embeddings`, `/audio/transcriptions`,
  `/audio/speech`
- Batch and Files: `/files`, `/batches`
- `GET /v1/models` is public, so it can't validate an API key

### Adding a node
- Name it `nodes/ZeroGpu<Thing>/ZeroGpu<Thing>.node.ts`, with class
  `ZeroGpu<Thing>`, `name: 'zeroGpu<Thing>'` and display name `ZeroGPU <Thing>`.
  Acronyms are camelCased, like n8n's `openAiApi`
- Reuse the `zeroGpuApi` credential instead of adding another one
- Reuse the icons in `icons/`
- Register the node in `n8n.nodes` in `package.json`
- `nodes/ZeroGpu` is a placeholder, needed because n8n refuses to install a
  package with no nodes. Remove it when the first real node lands, including its
  `package.json` entry and the "early release" status in `README.md`
- For a chat model node, add `"@n8n/ai-node-sdk": "*"` to `peerDependencies` and
  `"aiNodeSdkVersion": 1` to the `n8n` section (lint requires both together).
  Start from the CLI template in
  `node_modules/@n8n/node-cli/dist/template/templates/programmatic/ai/model-openai-compatible`

### Releasing
Follow n8n's documented process:
https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/
- Don't change `version` in feature PRs. Merge work to `main`, then release
- Run `GITHUB_TOKEN=$(gh auth token) npm run release` on an up-to-date `main`.
  It runs lint and build, asks for the version bump, writes `CHANGELOG.md`,
  commits, tags, pushes directly to `main` and creates the GitHub release. Don't
  add branch protection that blocks those pushes
- Don't edit `CHANGELOG.md` by hand. Each release regenerates the whole file
  from git tags and PR titles, so write PR titles for users
- The pushed tag triggers `.github/workflows/publish.yml`, which publishes with
  provenance through npm trusted publishing. No npm token or npm login is
  involved. n8n only verifies community nodes published that way (required since
  May 1 2026), so never publish a release version from a laptop;
  `prepublishOnly` (`n8n-node prerelease`) blocks that unless `RELEASE_MODE=true`
- `publish.yml` is n8n's starter workflow from `n8n-io/n8n-nodes-starter`. The
  only change is `environment: prod`. Keep it in sync with the starter
- Keep the workflow filename `publish.yml` and the GitHub environment `prod`,
  because the trusted publisher on npm is pinned to both
- Keep `publishConfig.access: public`. npm refuses provenance on a new scoped
  package without it
- `0.0.0-stage` and `0.1.0-bootstrap.0` were published by hand on 2026-11-06 only
  so the package existed and a trusted publisher could be attached. Both are
  deprecated and have no provenance or git tag. Don't tag them and don't repeat
  that for any other version

## Project structure
There are two main folders in this project:
- `nodes` contains all of the nodes in a package (there can be more than 1).
  The code for each node usually lives in its own folder
- `credentials` contains all of the credentials in a package. Usually it's just
  a single file for every credential
So it looks something like this:
.
├── nodes/
│   └── Example/
│       ├── Example.node.ts
│       └── ...
├── credentials/
│   └── Example.credentials.ts
├── package.json
└── ...
It's important to note that `package.json` has a special field `n8n` that have
information about nodes and credentials in a package:
```json
{
  "name": "n8n-nodes-example",
  "version": "1.0.0",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
        "dist/credentials/Example.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Example/Example.node.js"
    ]
  }
}
```
`nodes` and `credentials` keys contain paths to transpiled JS files in a `dist`
folder for the nodes and credentials respectively. If you add/remove/rename
nodes and/or credentials, you need to make sure to update `n8n.nodes` and
`n8n.credentials` keys in `package.json` accordingly. Initial files in the
project _may_ contain example nodes and/or credentials that need to be
**removed or renamed** once you start making an actual node.

## Key guidelines
- Use the `n8n-node` CLI tool **whenever possible** for building, dev mode,
  linting, etc.
- **Always** address any lint/typecheck errors/warnings, unless there is a
  **very specific reason** to ignore/disable it
- Make sure to use **proper types whenever possible**
- If you are updating the npm package version, make sure to **update
  CHANGELOG.md** in the root of the repository
- Read `.agents/workflow.md` for more info

## Context-specific docs
Load these before working on the relevant area:

| Working on...                        | Read first                                                          |
|--------------------------------------|---------------------------------------------------------------------|
| Any node file in `nodes/`            | `.agents/nodes.md` and `.agents/properties.md`                      |
| A declarative-style node             | above + `.agents/nodes-declarative.md`                              |
| A programmatic-style node            | above + `.agents/nodes-programmatic.md`                             |
| Files in `credentials/`              | `.agents/credentials.md`                                            |
| Adding a new version to a node       | `.agents/versioning.md`                                             |
| Starting a new task or planning      | `.agents/workflow.md`                                               |

## Additional resources
If you need any extra information, here are links to n8n's official docs
regarding building community nodes:
- https://docs.n8n.io/integrations/community-nodes/build-community-nodes/
- https://docs.n8n.io/integrations/creating-nodes/overview/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines/
