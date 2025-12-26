import type { Treaty } from '@elysiajs/eden/treaty2'
import { EdenFetchError } from '@elysiajs/eden'
import type {
  EdenThrowOnErrorContext,
  EdenQueryKey,
  EdenQueryConfig,
  EdenQueryOptions,
  HTTPMethod
} from './types'
import { buildQueryKey } from './query-key'

type EdenOverrides<T> = T extends object ? Partial<T> : never
type EdenData<TResponse extends Record<number, unknown>> =
  Extract<Treaty.TreatyResponse<TResponse>, { error: null }> extends { data: infer D }
    ? D
    : never

function shouldThrowOnError(
  config: EdenQueryConfig,
  context: EdenThrowOnErrorContext
): boolean {
  if (typeof config.throwOnError === 'boolean') return config.throwOnError
  if (typeof config.throwOnError === 'function') {
    const fn = config.throwOnError as unknown as
      | ((queryKey: readonly unknown[], status: number) => boolean)
      | ((context: EdenThrowOnErrorContext) => boolean)

    return fn.length >= 2
      ? (fn as (queryKey: readonly unknown[], status: number) => boolean)(
          context.queryKey,
          context.status
        )
      : (fn as (context: EdenThrowOnErrorContext) => boolean)(context)
  }
  return true
}

function toEdenFetchError(error: unknown, status: number): EdenFetchError {
  if (error instanceof EdenFetchError) return error

  if (error && typeof error === 'object' && 'value' in error) {
    return new EdenFetchError(status, (error as any).value)
  }

  return new EdenFetchError(status, error)
}

export function createQueryOptions<
  TInput,
  TResponse extends Record<number, unknown>,
  TMethod extends HTTPMethod
>(
  treatyCall: (input?: TInput) => Promise<Treaty.TreatyResponse<TResponse>>,
  paths: string[],
  method: TMethod,
  globalConfig: EdenQueryConfig
): (
  input?: TInput,
  options?: EdenQueryOptions<
    EdenData<TResponse>,
    EdenFetchError | Error,
    EdenData<TResponse>,
    EdenQueryKey<TInput, TMethod>,
    EdenOverrides<NonNullable<TInput>>
  >
) => EdenQueryOptions<
  EdenData<TResponse>,
  EdenFetchError | Error,
  EdenData<TResponse>,
  EdenQueryKey<TInput, TMethod>,
  EdenOverrides<NonNullable<TInput>>
> & {
  queryKey: EdenQueryKey<TInput, TMethod>
  queryFn: (context: unknown) => Promise<EdenData<TResponse>>
} {
  return (
    input?: TInput,
    options?: EdenQueryOptions<
      EdenData<TResponse>,
      EdenFetchError | Error,
      EdenData<TResponse>,
      EdenQueryKey<TInput, TMethod>,
      EdenOverrides<NonNullable<TInput>>
    >
  ) => {
    const eden = options?.eden as EdenOverrides<NonNullable<TInput>> | undefined
    const finalInput =
      input === undefined && eden === undefined
        ? (undefined as unknown as TInput)
        : ({ ...(input as any), ...(eden as any) } as TInput)

    const queryKey = buildQueryKey(paths, finalInput, method, globalConfig.queryKeyPrefix)
    const { eden: _eden, ...tanstackOptions } = options ?? {}

    return {
      ...tanstackOptions,
      queryKey,
      queryFn: async (_context) => {
        const result = await treatyCall(finalInput)

        if (result.error) {
          const error = toEdenFetchError(result.error, result.status)
          ;(error as any).queryKey = queryKey
          ;(error as any).method = method
          ;(error as any).path = paths
          ;(error as any).input = finalInput
          ;(error as any).response = (result as any).response
          ;(error as any).headers = (result as any).headers

          if (
            shouldThrowOnError(globalConfig, {
              queryKey,
              status: result.status,
              method,
              path: paths,
              input: finalInput
            })
          ) {
            throw error
          }

          return null as any
        }

        return result.data as EdenData<TResponse>
      }
    }
  }
}
