import { describe, it, expect } from 'bun:test'
import { EdenFetchError } from '@elysiajs/eden'
import { createEdenQuery } from '../src/index'
import { createQueryOptions } from '../src/query-options'

describe('queryOptions', () => {
  it('adds query helpers with stable keys', () => {
    const eden = createEdenQuery<any>('http://localhost:8080')
    const options = (eden as any).users.get.queryOptions()

    expect(options.queryKey).toEqual(['users', undefined, 'get'])
    expect((eden as any).users.get.queryKey()).toEqual(options.queryKey)
    expect((eden as any).users.get.queryFilter()).toEqual({
      queryKey: ['users', undefined, 'get'],
      exact: true
    })
  })

  it('throws EdenFetchError when configured', async () => {
    const treatyCall = async () =>
      ({
        data: null,
        error: { status: 401, value: 'Unauthorized' },
        response: new Response('Unauthorized', { status: 401 }),
        status: 401,
        headers: {}
      }) as any

    const queryOptions = createQueryOptions(treatyCall, ['users'], 'get', {
      throwOnError: true
    })

    const options = queryOptions()
    await expect(options.queryFn({} as any)).rejects.toBeInstanceOf(EdenFetchError)
  })

  it('returns payload data on success', async () => {
    const treatyCall = async () =>
      ({
        data: { users: ['a'] },
        error: null,
        response: new Response(JSON.stringify({ users: ['a'] }), { status: 200 }),
        status: 200,
        headers: {}
      }) as any

    const queryOptions = createQueryOptions(treatyCall, ['users'], 'get', {
      throwOnError: true
    })

    const options = queryOptions()
    await expect(options.queryFn({} as any)).resolves.toEqual({ users: ['a'] })
  })
})
