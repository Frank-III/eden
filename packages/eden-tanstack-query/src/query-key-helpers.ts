import type { QueryFilters } from '@tanstack/query-core'
import type { EdenQueryKey, HTTPMethod } from './types'
import { buildQueryKey } from './query-key'

export function createQueryKeyGetter<TInput = unknown, TMethod extends HTTPMethod = HTTPMethod>(
  paths: string[],
  method: TMethod,
  prefix?: string | string[]
) {
  return (input?: TInput) => buildQueryKey(paths, input as TInput, method, prefix)
}

export function createQueryFilter<TInput = unknown, TMethod extends HTTPMethod = HTTPMethod>(
  paths: string[],
  method: TMethod,
  prefix?: string | string[]
) {
  return (input?: TInput): QueryFilters<EdenQueryKey<TInput, TMethod>> => ({
    queryKey: buildQueryKey(paths, input as TInput, method, prefix),
    exact: true
  })
}
