import { describe, it, expect, beforeEach } from 'vitest'
import { AnalyticsService } from '../analytics'

describe('AnalyticsService', () => {
  let analytics: AnalyticsService

  beforeEach(() => {
    analytics = new AnalyticsService()
  })

  it('tracks countdown creation events', () => {
    analytics.countdownCreated('test-id', 'glamorous')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      event: 'countdown_created',
      properties: {
        countdown_id: 'test-id',
        theme: 'glamorous'
      }
    })
  })

  it('tracks countdown sharing events', () => {
    analytics.countdownShared('test-id', 'twitter')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      event: 'countdown_shared',
      properties: {
        countdown_id: 'test-id',
        channel: 'twitter'
      }
    })
  })

  it('tracks countdown view events', () => {
    analytics.countdownViewed('test-id', false)
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      event: 'countdown_viewed',
      properties: {
        countdown_id: 'test-id',
        is_creator: false
      }
    })
  })

  it('tracks link copy events', () => {
    analytics.linkCopied('test-id')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      event: 'countdown_shared',
      properties: {
        countdown_id: 'test-id',
        channel: 'copy_link'
      }
    })
  })

  it('adds timestamps to events', () => {
    analytics.track('test_event')
    
    const events = analytics.getEvents()
    expect(events[0]).toHaveProperty('timestamp')
    expect(typeof events[0].timestamp).toBe('string')
  })

  it('can clear events', () => {
    analytics.track('test_event')
    expect(analytics.getEvents()).toHaveLength(1)
    
    analytics.clearEvents()
    expect(analytics.getEvents()).toHaveLength(0)
  })
})