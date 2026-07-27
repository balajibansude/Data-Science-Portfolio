---
name: Orval generated hook import patterns
description: Correct import paths and UseQueryOptions quirks for Orval v8 generated React Query hooks
---

## Import paths
Generated types are re-exported from the package root. Always import from the package, never the internal path:
- CORRECT: `import type { User } from "@workspace/api-client-react"`
- WRONG: `import type { User } from "@workspace/api-client-react/src/generated/api.schemas"`

## UseQueryOptions requires queryKey in React Query v5
Orval v8 generates hooks typed as `options?: { query?: UseQueryOptions<...> }`. In React Query v5, `UseQueryOptions` requires `queryKey`. This means passing `{ query: { enabled: true } }` causes a TS error.

**Fixes:**
1. For hooks with required id params (`useGetDocument(id)`, `useGetConversation(id)`, `useGetDocumentChunks(id)`): generated code already adds `enabled: id !== null && id !== undefined`. Just omit the options entirely.
2. For hooks where `enabled` is truly needed (e.g. `useSearchDocuments`): cast as any: `{ query: { enabled: !!q } as any }`
3. For simple options like `retry: false` on `useGetMe`: just omit them; defaults work fine.
