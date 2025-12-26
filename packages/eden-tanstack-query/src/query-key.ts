import type { EdenQueryKey, HTTPMethod } from './types'

export function buildQueryKey<TInput, TMethod extends HTTPMethod>(
  paths: string[],
  input: TInput,
  method: TMethod,
  prefix?: string | string[]
): EdenQueryKey<TInput, TMethod> {
  if (prefix) {
    return typeof prefix === 'string'
      ? [prefix, ...paths, input, method] as const
      : [...prefix, ...paths, input, method] as const
  }
  return [...paths, input, method] as const
}
