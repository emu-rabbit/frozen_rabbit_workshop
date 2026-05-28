import { describe, expect, it } from 'vitest'
import { getWorkbenchItemCountBucket } from './analytics'

describe('getWorkbenchItemCountBucket', () => {
  it('groups workbench item type counts into GA-friendly buckets', () => {
    expect(getWorkbenchItemCountBucket(1)).toBe('1')
    expect(getWorkbenchItemCountBucket(2)).toBe('2~3')
    expect(getWorkbenchItemCountBucket(3)).toBe('2~3')
    expect(getWorkbenchItemCountBucket(4)).toBe('4~5')
    expect(getWorkbenchItemCountBucket(5)).toBe('4~5')
    expect(getWorkbenchItemCountBucket(6)).toBe('6~10')
    expect(getWorkbenchItemCountBucket(10)).toBe('6~10')
    expect(getWorkbenchItemCountBucket(11)).toBe('10~20')
    expect(getWorkbenchItemCountBucket(20)).toBe('10~20')
    expect(getWorkbenchItemCountBucket(21)).toBe('20+')
  })
})
