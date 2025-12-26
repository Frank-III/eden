import { describe, it, expect } from 'bun:test'
import { EdenFetchError } from '@elysiajs/eden'
import { createEdenQuery } from '../src/index'
import { createMutationOptions } from '../src/mutation-options'

describe('mutationOptions', () => {
  it('adds mutation helpers with stable keys', () => {
    const eden = createEdenQuery<any>('http://localhost:8080')
    const options = (eden as any).users.post.mutationOptions()

    expect(options.mutationKey).toEqual(['users', undefined, 'post'])
    expect(typeof options.mutationFn).toBe('function')
    expect('eden' in options).toBe(false)
  })

  it('throws EdenFetchError when configured', async () => {
    const treatyCall = async () =>
      ({
        data: null,
        error: { status: 400, value: 'Bad Request' },
        response: new Response('Bad Request', { status: 400 }),
        status: 400,
        headers: {}
      }) as any

    const mutationOptions = createMutationOptions(treatyCall, ['users'], 'post', {
      throwOnError: true
    })

    const options = mutationOptions()
    await expect(options.mutationFn({})).rejects.toBeInstanceOf(EdenFetchError)
  })

  it('returns payload data on success', async () => {
    const treatyCall = async () =>
      ({
        data: { userId: '1' },
        error: null,
        response: new Response(JSON.stringify({ userId: '1' }), { status: 200 }),
        status: 200,
        headers: {}
      }) as any

    const mutationOptions = createMutationOptions(treatyCall, ['users'], 'post', {
      throwOnError: true
    })

    const options = mutationOptions()
    await expect(options.mutationFn({})).resolves.toEqual({ userId: '1' })
  })
})
