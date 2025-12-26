import type {
  InfiniteQueryObserverOptions,
  MutationOptions,
  QueryFilters,
  QueryFunctionContext,
  QueryKey,
  QueryObserverOptions
} from '@tanstack/query-core'
import type { EdenFetchError } from '@elysiajs/eden'
import type { Treaty } from '@elysiajs/eden/treaty2'

export type { Treaty } from '@elysiajs/eden/treaty2'

export type HTTPMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'

export interface EdenThrowOnErrorContext {
  queryKey: readonly unknown[]
  status: number
  method: HTTPMethod
  path: string[]
  input: unknown
}

export type EdenThrowOnError =
  | ((queryKey: readonly unknown[], status: number) => boolean)
  | ((context: EdenThrowOnErrorContext) => boolean)

export interface EdenQueryConfig {
  throwOnError?: boolean | EdenThrowOnError
  queryKeyPrefix?: string | string[]
}

export interface EdenOptions<TEden = unknown> {
  eden?: TEden
}

export type EdenQueryKey<
  TInput = unknown,
  TMethod extends HTTPMethod = HTTPMethod
> = readonly [...string[], TInput, TMethod]

export type EdenQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TEden = unknown
> = Omit<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryKey' | 'queryFn'
> &
  EdenOptions<TEden>

export type EdenMutationOptions<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
  TEden = unknown
> = Omit<MutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> &
  EdenOptions<TEden>

export type EdenInfiniteQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TEden = unknown
> = Omit<
  InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey' | 'queryFn'
> &
  EdenOptions<TEden>

type EdenPartial<T> = T extends object ? Partial<T> : never
type AwaitedReturn<T> = T extends (...args: any[]) => infer R ? Awaited<R> : never
type FirstArg<T> = T extends (arg1: infer A, ...args: any[]) => any ? A : never
type SecondArg<T> = T extends (arg1: any, arg2: infer B, ...args: any[]) => any ? B : never
type EdenData<T> = Extract<AwaitedReturn<T>, { error: null }> extends { data: infer D } ? D : never

export type EdenQueryMethod<
  TMethod extends Extract<HTTPMethod, 'get' | 'head'>,
  TCall extends (...args: any[]) => Promise<any>
> = TCall & {
  queryKey: (input?: FirstArg<TCall>) => EdenQueryKey<FirstArg<TCall>, TMethod>
  queryFilter: (input?: FirstArg<TCall>) => QueryFilters<EdenQueryKey<FirstArg<TCall>, TMethod>>
  queryOptions: (
    input?: FirstArg<TCall>,
    options?: EdenQueryOptions<
      EdenData<TCall>,
      EdenFetchError | Error,
      EdenData<TCall>,
      EdenQueryKey<FirstArg<TCall>, TMethod>,
      EdenPartial<NonNullable<FirstArg<TCall>>>
    >
  ) => EdenQueryOptions<
    EdenData<TCall>,
    EdenFetchError | Error,
    EdenData<TCall>,
    EdenQueryKey<FirstArg<TCall>, TMethod>,
    EdenPartial<NonNullable<FirstArg<TCall>>>
  > & {
    queryKey: EdenQueryKey<FirstArg<TCall>, TMethod>
    queryFn: (context: QueryFunctionContext<EdenQueryKey<FirstArg<TCall>, TMethod>>) => Promise<EdenData<TCall>>
  }
}

export type EdenMutationMethod<
  TMethod extends Extract<HTTPMethod, 'post' | 'put' | 'patch' | 'delete'>,
  TCall extends (...args: any[]) => Promise<any>
> = TCall & {
  mutationOptions: (
    options?: EdenMutationOptions<
      EdenData<TCall>,
      EdenFetchError | Error,
      FirstArg<TCall>,
      unknown,
      EdenPartial<NonNullable<SecondArg<TCall>>>
    >
  ) => EdenMutationOptions<
    EdenData<TCall>,
    EdenFetchError | Error,
    FirstArg<TCall>,
    unknown,
    EdenPartial<NonNullable<SecondArg<TCall>>>
  > & {
    mutationKey: EdenQueryKey<undefined, TMethod>
    mutationFn: (variables: FirstArg<TCall>) => Promise<EdenData<TCall>>
  }
}

export type EdenQueryify<T> =
  (T extends (...args: infer A) => infer R ? (...args: A) => EdenQueryify<R> : unknown) &
    (T extends object ? { [K in keyof T]: EdenQueryifyValue<K, T[K]> } : unknown)

type EdenQueryifyValue<K, V> = K extends 'get' | 'head'
  ? V extends (...args: any[]) => Promise<any>
    ? EdenQueryMethod<Extract<K, 'get' | 'head'>, V>
    : V
  : K extends 'post' | 'put' | 'patch' | 'delete'
    ? V extends (...args: any[]) => Promise<any>
      ? EdenMutationMethod<Extract<K, 'post' | 'put' | 'patch' | 'delete'>, V>
      : V
    : EdenQueryify<V>
