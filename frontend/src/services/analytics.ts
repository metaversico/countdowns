// Analytics service for tracking user events
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: string
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  
  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date().toISOString()
    }
    
    this.events.push(analyticsEvent)
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('📊 Analytics:', analyticsEvent)
    }
    
    // In production, you would send this to your analytics service
    // Example: sendToAnalytics(analyticsEvent)
  }
  
  // Specific tracking methods for the spec requirements
  countdownCreated(countdownId: string, theme?: string) {
    this.track('countdown_created', {
      countdown_id: countdownId,
      theme: theme || 'unknown'
    })
  }
  
  countdownShared(countdownId: string, channel: string) {
    this.track('countdown_shared', {
      countdown_id: countdownId,
      channel
    })
  }
  
  countdownViewed(countdownId: string, isCreator: boolean = false) {
    this.track('countdown_viewed', {
      countdown_id: countdownId,
      is_creator: isCreator
    })
  }
  
  linkCopied(countdownId: string) {
    this.track('countdown_shared', {
      countdown_id: countdownId,
      channel: 'copy_link'
    })
  }
  
  // Get all tracked events (for debugging)
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }
  
  // Clear events (for testing)
  clearEvents() {
    this.events = []
  }
}

// Export a singleton instance
export const analytics = new AnalyticsService()

// Export the class for testing
export { AnalyticsService }