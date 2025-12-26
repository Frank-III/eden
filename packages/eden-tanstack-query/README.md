# eden-tanstack-query

A TanStack Query integration for [Eden Treaty](https://eden.ts), the type-safe client for [Elysia](https://elysiajs.com).

## Features

- 🔗 **Type-safe** - Full TypeScript inference from Elysia server types
- ⚡ **Framework-agnostic** - Works with React Query, Svelte Query, Solid Query, Vue Query
- 🎯 **queryOptions** - Reusable, type-safe query configurations
- 🔄 **mutationOptions** - Type-safe mutation configurations
- 🔑 **Query keys** - Auto-generated, type-safe query keys for cache operations
- ⚠️ **Error handling** - Configurable error throwing
- 🛠️ **Eden integration** - Seamlessly integrates with existing Treaty clients

## Installation

```bash
bun add eden-tanstack-query @tanstack/query-core
```

## Basic Usage

### Setup

```typescript
import { treaty } from '@elysiajs/eden/treaty2'
import { createEdenQuery } from 'eden-tanstack-query'
import { useQuery } from '@tanstack/svelte-query'

// Your Elysia app type
type App = {
  users: {
    get: {
      query: { page?: number }
      response: { users: User[] }
    }
    post: {
      body: { name: string, email: string }
      response: { user: User }
    }
  }
}

// Create Eden Query client
const eden = createEdenQuery<App>('http://localhost:8080')
```

### Queries

```typescript
// Basic query (auto-generated query key)
const query = useQuery(eden.users.get.queryOptions())

// Query with parameters
const query = useQuery(
  eden.users.get.queryOptions({ query: { page: 1 } })
)

// Access the data
query.data?.users  // Fully typed from your Elysia response
```

### Mutations

```typescript
import { useMutation } from '@tanstack/svelte-query'

// Basic mutation
const mutation = useMutation(eden.users.post.mutationOptions())

// Using the mutation
mutation.mutate({ name: 'John', email: 'john@example.com' })

// Access the response
mutation.data?.user  // Fully typed
```

### Query Keys

```typescript
// Get type-safe query keys for cache operations
const usersKey = eden.users.get.queryKey()

// Invalidate queries
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: usersKey })

// Get query data type-safely
const data = queryClient.getQueryData(eden.users.get.queryKey())
```

## Error Handling

### Throw on Error (Default for most apps)

```typescript
const eden = createEdenQuery<App>('http://localhost:8080', {
  throwOnError: true
})

useQuery(eden.users.get.queryOptions(undefined, {
  onError: (error: EdenFetchError) => {
    // error.status and error.value are available
    // extra context is attached: error.queryKey, error.method, error.path, error.input
    if (error.status === 401) {
      router.push('/login')
    }
  }
}))
```

### Conditional Throwing

```typescript
const eden = createEdenQuery<App>('http://localhost:8080', {
  throwOnError: (queryKey, status) => {
    // Don't throw on 404 (not found)
    if (status === 404) return false
    // Throw on server errors
    if (status >= 500) return true
    return false
  }
})
```

### Known Limitation: `onSuccess` Data Type

When using `throwOnError: true`, errors are thrown before reaching `onSuccess`. However, TypeScript cannot narrow the data type at compile-time since `throwOnError` is a runtime configuration. This means the `data` parameter in `onSuccess` may still include error union types from your response schema.

**Workaround**: Use the `vars` parameter instead of `data` when you only need input values (e.g., for cache invalidation):

```typescript
useMutation(eden.users.post.mutationOptions({
  onSuccess: (_, vars) => {
    // Use vars instead of data for invalidation
    queryClient.invalidateQueries({
      queryKey: eden.users({ id: vars.userId }).get.queryKey()
    })
  }
}))
```

## Advanced Usage

### Custom Eden Treaty Options

```typescript
const eden = createEdenQuery<App>('http://localhost:8080', {
  treaty: {
    headers: { authorization: 'Bearer token' },
    fetch: customFetch
  }
})

useQuery(eden.users.get.queryOptions(
  { query: { page: 1 } },
  {
    eden: {
      headers: { 'X-Custom': 'value' }
    },
    staleTime: 5000
  }
))
```

### Query Key Prefix

```typescript
const eden = createEdenQuery<App>('http://localhost:8080', {
  queryKeyPrefix: 'my-api'
})

// Keys will be prefixed: ['my-api', 'users', 'get']
```

### Using with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const query = useQuery(eden.users.get.queryOptions())
const mutation = useMutation(eden.users.post.mutationOptions())
const queryClient = useQueryClient()
```

### Using with Solid Query

```typescript
import { createQuery, createMutation } from '@tanstack/solid-query'

const query = createQuery(() => eden.users.get.queryOptions())
const mutation = createMutation(() => eden.users.post.mutationOptions())
```

### Using with Vue Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const query = useQuery(eden.users.get.queryOptions())
const mutation = useMutation(eden.users.post.mutationOptions())
const queryClient = useQueryClient()
```

## Query Key Structure

Query keys are auto-generated from your API paths:

```typescript
// Simple path
eden.users.get.queryKey()
// → ['users', 'get']

// Path with parameters
eden.users({ id: '123' }).get.queryKey()
// → ['users', { id: '123' }, 'get']

// Nested paths
 eden.users.posts({ userId: '123' }).get.queryKey()
// → ['users', 'posts', { userId: '123' }, 'get']
```

## Type Safety

All types are fully inferred from your Elysia server:

- ✅ Query data type (from success responses)
- ✅ Error type (from EdenFetchError or Treaty response)
- ✅ Input validation (query params, body)
- ✅ Query keys (type-safe, auto-generated)
- ✅ Framework-agnostic (works with all TanStack Query variants)

## License

MIT
