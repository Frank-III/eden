import { treaty } from '@elysiajs/eden/treaty2'
import { extendProxy } from './proxy'
import type { EdenQueryConfig, EdenQueryify, Treaty } from './types'
import type { Elysia } from 'elysia'

export function createEdenQuery<
  App extends Elysia<any, any, any, any, any, any, any>
>(
  domain: string,
  options?: EdenQueryConfig & { treaty?: Treaty.Config }
): EdenQueryify<Treaty.Create<App>> {
  const treatyInstance = treaty<App>(domain, options?.treaty)
  
  return extendProxy(
    treatyInstance,
    [],
    { 
      throwOnError: options?.throwOnError ?? true,
      queryKeyPrefix: options?.queryKeyPrefix 
    }
  )
}

export type * from './types'
export { treaty } from '@elysiajs/eden/treaty2'
