import type { Treaty } from '@elysiajs/eden/treaty2'
import { EdenFetchError } from '@elysiajs/eden'
import type {
  EdenThrowOnErrorContext,
  EdenQueryKey,
  EdenQueryConfig,
  EdenMutationOptions,
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

export function createMutationOptions<
  TInput,
  TResponse extends Record<number, unknown>,
  TOptions = unknown,
  TMethod extends HTTPMethod = HTTPMethod
>(
  treatyCall: (
    input: TInput,
    options?: TOptions
  ) => Promise<Treaty.TreatyResponse<TResponse>>,
  paths: string[],
  method: TMethod,
  globalConfig: EdenQueryConfig
): <TContext = unknown>(
  options?: EdenMutationOptions<
    EdenData<TResponse>,
    EdenFetchError | Error,
    TInput,
    TContext,
    EdenOverrides<NonNullable<TOptions>>
  >
) => EdenMutationOptions<
  EdenData<TResponse>,
  EdenFetchError | Error,
  TInput,
  TContext,
  EdenOverrides<NonNullable<TOptions>>
> & {
  mutationKey: EdenQueryKey<undefined, TMethod>
  mutationFn: (variables: TInput) => Promise<EdenData<TResponse>>
} {
  return <TContext = unknown>(
    options?: EdenMutationOptions<
      EdenData<TResponse>,
      EdenFetchError | Error,
      TInput,
      TContext,
      EdenOverrides<NonNullable<TOptions>>
    >
  ) => {
    const eden = options?.eden as EdenOverrides<NonNullable<TOptions>> | undefined
    const mutationKey = buildQueryKey(
      paths,
      undefined,
      method,
      globalConfig.queryKeyPrefix
    )
    const { eden: _eden, ...tanstackOptions } = options ?? {}

    return {
      ...tanstackOptions,
      mutationKey,
      mutationFn: async (variables: TInput) => {
        const result = await treatyCall(variables, eden as TOptions)

        if (result.error) {
          const error = toEdenFetchError(result.error, result.status)
          ;(error as any).queryKey = mutationKey
          ;(error as any).method = method
          ;(error as any).path = paths
          ;(error as any).input = variables
          ;(error as any).response = (result as any).response
          ;(error as any).headers = (result as any).headers

          if (
            shouldThrowOnError(globalConfig, {
              queryKey: mutationKey,
              status: result.status,
              method,
              path: paths,
              input: variables
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
