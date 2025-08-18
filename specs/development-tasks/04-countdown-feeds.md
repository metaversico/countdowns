# Countdown Feeds Implementation RFC

## Objective
Implement dynamic countdown feeds (new, ending soon, finished) to showcase active countdowns and drive viral engagement on the public landing page.

## User Stories
- As a visitor, I want to see recently created countdowns to discover interesting content
- As a user, I want to see countdowns ending soon to create urgency and engagement
- As a content creator, I want to see what countdowns perform well to inspire my own
- As a mobile user, I want feeds that load quickly and scroll smoothly

## Feed Categories

### 1. New Countdowns
- **Criteria**: Created within last 24 hours
- **Sort Order**: Most recent first
- **Purpose**: Showcase fresh content and inspire creation

### 2. Ending Soon
- **Criteria**: Expiring within next 24 hours
- **Sort Order**: Soonest expiration first
- **Purpose**: Create urgency and drive immediate engagement

### 3. Recently Finished
- **Criteria**: Expired within last 6 hours
- **Sort Order**: Most recent expiration first
- **Purpose**: Show completed countdowns and outcomes

### 4. Featured/Trending (Future)
- **Criteria**: High engagement, view count, or manual curation
- **Sort Order**: Engagement score or manual priority
- **Purpose**: Highlight viral or high-quality content

## Data Architecture

### Database Schema Extensions
```typescript
interface CountdownMetrics {
  id: string; // countdown ID
  viewCount: number;
  shareCount: number;
  clickCount: number;
  lastViewed: Date;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

interface CountdownWithMetrics extends Countdown {
  metrics: CountdownMetrics;
  timeRemaining?: number; // calculated field
  status: 'active' | 'expired' | 'draft';
}
```

### KV Storage Structure
```typescript
// Primary countdown storage
["countdowns", countdownId] -> Countdown

// Metrics storage
["metrics", countdownId] -> CountdownMetrics

// Feed indexes for efficient queries
["feeds", "new", timestamp, countdownId] -> null
["feeds", "ending_soon", expirationTimestamp, countdownId] -> null
["feeds", "finished", completionTimestamp, countdownId] -> null

// Optional: Category indexes
["categories", category, timestamp, countdownId] -> null
```

## API Design

### Feed Endpoints
```typescript
// Base feed endpoint structure
GET /api/feeds/{feedType}?limit=12&offset=0&category=all

// Specific implementations
GET /api/feeds/new?limit=12&offset=0
GET /api/feeds/ending-soon?limit=12&offset=0  
GET /api/feeds/finished?limit=12&offset=0
GET /api/feeds/featured?limit=6&offset=0
```

### Response Format
```typescript
interface FeedResponse {
  data: CountdownSummary[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  metadata: {
    feedType: string;
    generatedAt: string;
    cacheExpires?: string;
  };
}

interface CountdownSummary {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
  timeRemaining?: number; // seconds, null if finished
  status: 'active' | 'expired';
  
  // Optional metadata
  category?: string;
  tags?: string[];
  
  // Engagement metrics (public subset)
  metrics?: {
    viewCount: number;
    shareCount: number;
  };
  
  // Creator info (if available)
  creator?: {
    name?: string;
    avatar?: string;
  };
}
```

## Backend Implementation

### Feed Service
```typescript
// backend/services/feedService.ts
export class FeedService {
  constructor(private kv: Deno.Kv) {}
  
  async getNewCountdowns(limit: number, offset: number): Promise<FeedResponse> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    return this.getFeedByTimeRange('new', cutoffTime, Date.now(), limit, offset);
  }
  
  async getEndingSoon(limit: number, offset: number): Promise<FeedResponse> {
    const now = Date.now();
    const endTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
    return this.getFeedByTimeRange('ending_soon', now, endTime, limit, offset);
  }
  
  async getRecentlyFinished(limit: number, offset: number): Promise<FeedResponse> {
    const cutoffTime = Date.now() - (6 * 60 * 60 * 1000); // 6 hours ago
    return this.getFeedByTimeRange('finished', cutoffTime, Date.now(), limit, offset);
  }
  
  private async getFeedByTimeRange(
    feedType: string,
    startTime: number,
    endTime: number,
    limit: number,
    offset: number
  ): Promise<FeedResponse> {
    // Implementation using KV range queries
  }
  
  async updateCountdownMetrics(countdownId: string, action: 'view' | 'share' | 'click'): Promise<void> {
    // Increment appropriate metric counters
  }
}
```

### Feed Routes
```typescript
// backend/routes/feeds.ts
import { Hono } from 'hono';
import { FeedService } from '../services/feedService.ts';

const app = new Hono();
const feedService = new FeedService(kv);

app.get('/new', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '12'), 50);
  const offset = parseInt(c.req.query('offset') || '0');
  
  const feed = await feedService.getNewCountdowns(limit, offset);
  
  // Cache for 5 minutes
  c.header('Cache-Control', 'public, max-age=300');
  return c.json(feed);
});

app.get('/ending-soon', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '12'), 50);
  const offset = parseInt(c.req.query('offset') || '0');
  
  const feed = await feedService.getEndingSoon(limit, offset);
  
  // Cache for 1 minute (more dynamic)
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(feed);
});

app.get('/finished', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '12'), 50);
  const offset = parseInt(c.req.query('offset') || '0');
  
  const feed = await feedService.getRecentlyFinished(limit, offset);
  
  // Cache for 10 minutes (historical data)
  c.header('Cache-Control', 'public, max-age=600');
  return c.json(feed);
});

export default app;
```

### Index Management
```typescript
// backend/services/indexService.ts
export class IndexService {
  constructor(private kv: Deno.Kv) {}
  
  async addToNewFeed(countdown: Countdown): Promise<void> {
    const key = ["feeds", "new", countdown.createdAt.getTime(), countdown.id];
    await this.kv.set(key, null, { expireIn: 24 * 60 * 60 * 1000 }); // 24h TTL
  }
  
  async addToEndingSoonFeed(countdown: Countdown): Promise<void> {
    const key = ["feeds", "ending_soon", countdown.expiresAt.getTime(), countdown.id];
    await this.kv.set(key, null, { expireIn: 24 * 60 * 60 * 1000 }); // 24h TTL
  }
  
  async addToFinishedFeed(countdown: Countdown): Promise<void> {
    const key = ["feeds", "finished", Date.now(), countdown.id];
    await this.kv.set(key, null, { expireIn: 6 * 60 * 60 * 1000 }); // 6h TTL
  }
  
  async cleanupExpiredIndexes(): Promise<void> {
    // Background job to clean up expired index entries
  }
}
```

## Frontend Implementation

### Feed Components

#### FeedContainer.vue
```typescript
<template>
  <div class="feed-container">
    <div class="feed-tabs">
      <button 
        v-for="feed in feeds" 
        :key="feed.key"
        :class="{ active: activeFeed === feed.key }"
        @click="setActiveFeed(feed.key)"
      >
        {{ feed.label }}
        <span class="count">{{ feed.count }}</span>
      </button>
    </div>
    
    <FeedList 
      :feed-type="activeFeed"
      :items="currentFeed.items"
      :loading="currentFeed.loading"
      :has-more="currentFeed.hasMore"
      @load-more="loadMore"
      @item-click="trackClick"
    />
  </div>
</template>

<script setup lang="ts">
interface FeedState {
  items: CountdownSummary[];
  loading: boolean;
  hasMore: boolean;
  error?: string;
  lastFetch?: Date;
}

const feeds = ref({
  new: { key: 'new', label: 'New', ...createEmptyFeed() },
  'ending-soon': { key: 'ending-soon', label: 'Ending Soon', ...createEmptyFeed() },
  finished: { key: 'finished', label: 'Just Finished', ...createEmptyFeed() }
});

const activeFeed = ref('new');
const feedService = new FeedService();

async function loadFeed(feedType: string, reset = false) {
  const feed = feeds.value[feedType];
  if (!feed) return;
  
  feed.loading = true;
  
  try {
    const offset = reset ? 0 : feed.items.length;
    const response = await feedService.getFeed(feedType, { limit: 12, offset });
    
    if (reset) {
      feed.items = response.data;
    } else {
      feed.items.push(...response.data);
    }
    
    feed.hasMore = response.pagination.hasMore;
    feed.lastFetch = new Date();
  } catch (error) {
    feed.error = error.message;
  } finally {
    feed.loading = false;
  }
}
</script>
```

#### CountdownCard.vue
```typescript
<template>
  <article class="countdown-card" @click="handleClick">
    <div class="card-image" v-if="countdown.imageUrl">
      <img 
        :src="countdown.imageUrl" 
        :alt="countdown.title"
        loading="lazy"
      />
    </div>
    
    <div class="card-content">
      <h3 class="card-title">{{ countdown.title }}</h3>
      <p class="card-description">{{ truncatedDescription }}</p>
      
      <div class="card-meta">
        <CountdownTimer 
          :expires-at="countdown.expiresAt"
          :status="countdown.status"
          compact
        />
        
        <div class="card-metrics" v-if="countdown.metrics">
          <span class="views">{{ formatCount(countdown.metrics.viewCount) }} views</span>
          <span class="shares">{{ formatCount(countdown.metrics.shareCount) }} shares</span>
        </div>
      </div>
    </div>
    
    <div class="card-actions">
      <button @click.stop="shareCountdown" class="share-btn">
        <ShareIcon />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  countdown: CountdownSummary;
  showMetrics?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showMetrics: true
});

const emit = defineEmits<{
  click: [countdown: CountdownSummary];
  share: [countdown: CountdownSummary];
}>();

function handleClick() {
  emit('click', props.countdown);
  // Track view event
  trackEvent('countdown_viewed', {
    countdownId: props.countdown.id,
    source: 'feed'
  });
}

function shareCountdown() {
  emit('share', props.countdown);
  // Track share event
  trackEvent('countdown_shared', {
    countdownId: props.countdown.id,
    source: 'feed'
  });
}
</script>
```

### Feed Service
```typescript
// frontend/src/services/feedService.ts
export class FeedService {
  private baseUrl = '/api/feeds';
  
  async getFeed(feedType: string, options: FeedOptions = {}): Promise<FeedResponse> {
    const { limit = 12, offset = 0, category } = options;
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(category && { category })
    });
    
    const response = await fetch(`${this.baseUrl}/${feedType}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${feedType} feed`);
    }
    
    return response.json();
  }
  
  async trackView(countdownId: string): Promise<void> {
    await fetch(`/api/countdowns/${countdownId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' })
    });
  }
  
  async trackShare(countdownId: string, platform?: string): Promise<void> {
    await fetch(`/api/countdowns/${countdownId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', platform })
    });
  }
}

interface FeedOptions {
  limit?: number;
  offset?: number;
  category?: string;
}
```

## Performance Optimizations

### Caching Strategy
```typescript
// Multi-level caching
interface CacheConfig {
  levels: {
    memory: { ttl: 60 }; // 1 minute in-memory
    kv: { ttl: 300 }; // 5 minutes in KV
    http: { ttl: 300 }; // 5 minutes browser cache
  };
}

// Cache keys
const cacheKeys = {
  newFeed: (limit: number, offset: number) => `feed:new:${limit}:${offset}`,
  endingSoon: (limit: number, offset: number) => `feed:ending:${limit}:${offset}`,
  finished: (limit: number, offset: number) => `feed:finished:${limit}:${offset}`
};
```

### Database Optimizations
- **Index-based queries**: Use KV range queries for efficient pagination
- **Batch operations**: Fetch multiple countdowns in single operation
- **Selective fields**: Only fetch required fields for summaries
- **Background indexing**: Update indexes asynchronously

### Frontend Optimizations
- **Virtual scrolling**: Handle large feed lists efficiently
- **Image lazy loading**: Load images only when visible
- **Prefetching**: Preload next page data
- **Component memoization**: Cache expensive computations

## Real-time Updates

### WebSocket Integration
```typescript
// Real-time feed updates
interface FeedUpdate {
  type: 'countdown_created' | 'countdown_expired' | 'countdown_updated';
  feedTypes: string[]; // Which feeds to update
  countdown: CountdownSummary;
}

// Client-side update handling
function handleFeedUpdate(update: FeedUpdate) {
  update.feedTypes.forEach(feedType => {
    const feed = feeds.value[feedType];
    if (!feed) return;
    
    switch (update.type) {
      case 'countdown_created':
        if (feedType === 'new') {
          feed.items.unshift(update.countdown);
          feed.items = feed.items.slice(0, 50); // Limit size
        }
        break;
        
      case 'countdown_expired':
        if (feedType === 'finished') {
          feed.items.unshift(update.countdown);
        }
        // Remove from ending-soon if present
        if (feedType === 'ending-soon') {
          feed.items = feed.items.filter(item => item.id !== update.countdown.id);
        }
        break;
    }
  });
}
```

## Analytics & Metrics

### Tracking Events
```typescript
// Key metrics to track
interface FeedAnalytics {
  feedViews: { feedType: string; count: number };
  itemClicks: { feedType: string; countdownId: string; position: number };
  scrollDepth: { feedType: string; maxPosition: number };
  loadTime: { feedType: string; duration: number };
}

// Implementation
function trackFeedView(feedType: string) {
  analytics.track('feed_viewed', { feedType });
}

function trackItemClick(feedType: string, countdownId: string, position: number) {
  analytics.track('feed_item_clicked', { feedType, countdownId, position });
}
```

## Testing Strategy

### Unit Tests
- **Feed service logic**: Correct data fetching and pagination
- **Component rendering**: Proper display of countdown cards
- **Time calculations**: Accurate time remaining computation
- **Error handling**: Network failures and empty states

### Integration Tests
- **API endpoints**: Correct response format and data
- **Real-time updates**: WebSocket message handling
- **Caching behavior**: Cache hits and invalidation
- **Database queries**: Efficient index usage

### Performance Tests
- **Load testing**: High concurrent feed requests
- **Memory usage**: Large feed lists and scrolling
- **Network efficiency**: Optimal payload sizes
- **Cache effectiveness**: Hit rates and response times

## Acceptance Criteria

### Functional Requirements
- [ ] Three feed types working (new, ending soon, finished)
- [ ] Pagination with 12 items per page
- [ ] Real-time updates for feed changes
- [ ] Accurate time remaining calculations
- [ ] Click tracking and basic analytics
- [ ] Responsive design across devices

### Performance Requirements
- [ ] Feed load time < 500ms (95th percentile)
- [ ] Smooth scrolling on mobile devices
- [ ] Efficient memory usage for long sessions
- [ ] Effective caching (> 80% hit rate)

### User Experience Requirements
- [ ] Clear visual hierarchy in feed cards
- [ ] Intuitive feed switching
- [ ] Loading states and error handling
- [ ] Share functionality working
- [ ] Accessible design (WCAG 2.1 AA)

## Future Enhancements

### Advanced Filtering
- **Categories**: Filter by event type, industry
- **Time ranges**: Custom time windows
- **Geographic**: Location-based filtering
- **Trending**: Algorithm-based trending feed

### Social Features
- **Reactions**: Like, comment on countdowns
- **Following**: Subscribe to creators
- **Collections**: User-curated feed lists
- **Recommendations**: Personalized suggestions

### Monetization Features
- **Sponsored content**: Promoted countdowns
- **Premium placement**: Featured positions
- **Analytics dashboard**: Creator insights
- **API access**: Third-party integrations