import { describe, it, expect } from 'bun:test'
import { createEdenQuery } from '../src/index'

describe('Integration', () => {
  it('should create Eden query client', () => {
    const eden = createEdenQuery<any>('http://localhost:8080')
    
    expect(eden).toBeDefined()
    expect(typeof eden).toBe('function')
  })

  it('should accept configuration options', () => {
    const eden = createEdenQuery<any>('http://localhost:8080', {
      throwOnError: true,
      queryKeyPrefix: 'api'
    })
    
    expect(eden).toBeDefined()
  })
})
