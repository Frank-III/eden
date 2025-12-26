import type { EdenQueryConfig, EdenQueryify, HTTPMethod } from './types'
import { createQueryOptions } from './query-options'
import { createMutationOptions } from './mutation-options'
import { createQueryKeyGetter, createQueryFilter } from './query-key-helpers'

const HTTP_METHODS: HTTPMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

export function extendProxy<T extends object>(
  proxy: T,
  paths: string[],
  config: EdenQueryConfig
): EdenQueryify<T> {
  return new Proxy(proxy, {
    get(target, prop) {
      if (typeof prop === 'symbol') return (target as any)[prop]

      const value = (target as any)[prop]

      if (typeof value === 'function' && HTTP_METHODS.includes(prop as HTTPMethod)) {
        const httpMethod = prop as HTTPMethod
        const callable = (...args: any[]) => (value as any)(...args)

        return Object.assign(callable, {
          ...(httpMethod === 'get' || httpMethod === 'head' ? {
            queryOptions: createQueryOptions(
              callable,
              paths,
              httpMethod,
              config
            ),
            queryKey: createQueryKeyGetter(paths, httpMethod, config.queryKeyPrefix),
            queryFilter: createQueryFilter(paths, httpMethod, config.queryKeyPrefix)
          } : {}),
          ...(httpMethod === 'post' || httpMethod === 'put' || 
              httpMethod === 'patch' || httpMethod === 'delete' ? {
            mutationOptions: createMutationOptions(
              callable,
              paths,
              httpMethod,
              config
            )
          } : {})
        })
      }

      if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        return extendProxy(value, [...paths, prop as string], config)
      }

      return value
    }
  }) as EdenQueryify<T>
}
