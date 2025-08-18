# Public Landing Page RFC

## Objective
Create a compelling public landing page with hero section, feature highlights, and dynamic countdown feeds to showcase the viral nature of the countdown application.

## User Stories
- As a first-time visitor, I want to immediately understand what the app does and see active countdowns
- As a content creator, I want to see examples of successful countdowns to inspire my own
- As a social media user, I want to easily share interesting countdowns I discover
- As a mobile user, I want the landing page to work perfectly on my device

## Design Vision

### Hero Section
- **Headline**: "Create Viral Countdowns That Get Shared"
- **Subheadline**: "Build anticipation, drive engagement, and create moments that matter"
- **Primary CTA**: Large "Create Countdown" button
- **Secondary CTA**: "Browse Examples" link
- **Visual**: Animated countdown timer showcasing key features

### Feature Highlights
1. **Easy Creation** - "Create in 60 seconds"
2. **Social Ready** - "Built for sharing"
3. **No Signup** - "Get started instantly"
4. **Mobile First** - "Perfect on any device"

### Dynamic Feeds
- **New Countdowns**: Recently created (last 24 hours)
- **Ending Soon**: Expiring within next 24 hours
- **Just Finished**: Completed in last 6 hours

## Component Architecture

### Page Structure
```
LandingPage.vue
├── HeroSection.vue
├── FeatureGrid.vue
├── CountdownFeeds.vue
│   ├── FeedSection.vue (x3)
│   └── CountdownCard.vue
├── CreateCallToAction.vue
└── Footer.vue
```

### Data Flow
1. **Initial Load**: Fetch all three feeds simultaneously
2. **Real-time Updates**: WebSocket or polling for live countdown updates
3. **Infinite Scroll**: Load more items for each feed section
4. **Client-side Filtering**: Filter by category, duration, etc.

## Implementation Plan

### Backend API Endpoints

#### Feed Endpoints
```typescript
// Get new countdowns (last 24h)
GET /api/feeds/new?limit=12&offset=0

// Get ending soon (next 24h)
GET /api/feeds/ending-soon?limit=12&offset=0

// Get recently finished (last 6h)
GET /api/feeds/finished?limit=12&offset=0

// Get featured/trending countdowns
GET /api/feeds/featured?limit=6
```

#### Response Format
```typescript
interface FeedResponse {
  countdowns: CountdownSummary[];
  hasMore: boolean;
  total: number;
}

interface CountdownSummary {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  expiresAt: string;
  timeRemaining?: number; // seconds, null if finished
  category?: string;
  shareCount?: number;
  viewCount?: number;
}
```

### Frontend Components

#### HeroSection.vue
```typescript
interface HeroSection {
  // Animated countdown demo
  demoCountdown: {
    title: string;
    timeRemaining: number;
    animate: boolean;
  };
  
  // CTA tracking
  onCreateClick(): void;
  onBrowseClick(): void;
}
```

#### CountdownFeeds.vue
```typescript
interface CountdownFeeds {
  feeds: {
    new: FeedData;
    endingSoon: FeedData;
    finished: FeedData;
  };
  
  // Infinite scroll
  loadMore(feedType: string): Promise<void>;
  
  // Real-time updates
  setupLiveUpdates(): void;
}

interface FeedData {
  items: CountdownSummary[];
  loading: boolean;
  hasMore: boolean;
  error?: string;
}
```

#### CountdownCard.vue
```typescript
interface CountdownCard {
  countdown: CountdownSummary;
  showTimeRemaining: boolean;
  showShareButton: boolean;
  
  // Actions
  onView(): void;
  onShare(): void;
}
```

### Responsive Design

#### Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns)

#### Hero Section Responsive
- **Mobile**: Stacked layout, larger text
- **Tablet**: Side-by-side with adjusted spacing
- **Desktop**: Full-width with background animation

#### Feed Layout
- **Mobile**: Vertical cards, full width
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid with sidebar

## Visual Design

### Color Palette
- **Primary**: #6366f1 (Modern purple)
- **Secondary**: #ec4899 (Vibrant pink)
- **Accent**: #f59e0b (Warning orange for urgency)
- **Neutral**: #1f2937 (Dark text)
- **Background**: #f8fafc (Light gray)

### Typography
- **Headlines**: Inter Bold, 2.5rem (mobile) to 4rem (desktop)
- **Body**: Inter Regular, 1rem
- **Countdown Numbers**: JetBrains Mono, large and bold
- **Cards**: Clear hierarchy with consistent spacing

### Animations
- **Hero Countdown**: Live ticking animation
- **Card Hover**: Subtle lift and shadow
- **Load States**: Skeleton screens
- **Transitions**: Smooth 200ms ease-out

## Data Management

### State Structure
```typescript
interface LandingPageState {
  hero: {
    demoCountdown: CountdownDemo;
    isVisible: boolean;
  };
  
  feeds: {
    new: FeedState;
    endingSoon: FeedState;
    finished: FeedState;
    featured: FeedState;
  };
  
  ui: {
    selectedFeed: string;
    isLoading: boolean;
    error?: string;
  };
}
```

### Caching Strategy
- **Feed Data**: 5-minute cache with refresh indicator
- **Images**: Browser cache with CDN integration
- **Real-time Updates**: WebSocket with fallback to polling

## Performance Optimizations

### Initial Load
- **Critical CSS**: Inline above-the-fold styles
- **Image Optimization**: WebP with fallbacks, lazy loading
- **Bundle Splitting**: Separate chunk for landing page
- **Preloading**: Key resources and initial feed data

### Runtime Performance
- **Virtual Scrolling**: For large feed lists
- **Image Lazy Loading**: Intersection Observer
- **Debounced Scroll**: Throttle infinite scroll triggers
- **Component Caching**: Cache countdown calculations

## SEO Optimization

### Meta Tags
```html
<title>Create Viral Countdowns - Share Moments That Matter</title>
<meta name="description" content="Build anticipation with shareable countdowns. No signup required. Perfect for launches, events, and social engagement.">
<meta property="og:title" content="Create Viral Countdowns">
<meta property="og:description" content="Build anticipation with shareable countdowns">
<meta property="og:image" content="/og-image.jpg">
```

### Structured Data
- **Organization**: Company information
- **WebApplication**: App details and features
- **ItemList**: Featured countdowns

### Performance Metrics
- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**: Green scores
- **First Contentful Paint**: < 1.5s

## Testability

### Unit Tests
- **Component Rendering**: All components render correctly
- **Data Formatting**: Time remaining calculations
- **User Interactions**: Button clicks, scroll events
- **State Management**: Feed loading and updates

### Integration Tests
- **API Integration**: Feed endpoints return correct data
- **Real-time Updates**: WebSocket connections
- **Navigation**: Route transitions
- **Error Handling**: Network failures

### E2E Tests
- **User Journey**: First visit to countdown creation
- **Feed Interaction**: Browse and view countdowns
- **Responsive Design**: Test across device sizes
- **Performance**: Page load and interaction timing

## Acceptance Criteria

### Functional Requirements
- [ ] Hero section with compelling value proposition
- [ ] Three dynamic feeds (new, ending soon, finished)
- [ ] Responsive design works on all devices
- [ ] Real-time countdown updates
- [ ] Infinite scroll for feed pagination
- [ ] Share functionality for countdowns
- [ ] Fast loading (< 3s initial load)

### Visual Requirements
- [ ] Professional, modern design
- [ ] Consistent color scheme and typography
- [ ] Smooth animations and transitions
- [ ] Clear visual hierarchy
- [ ] Accessible design (WCAG 2.1 AA)

### Performance Requirements
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Smooth 60fps animations
- [ ] Efficient memory usage

## Analytics & Tracking

### Key Metrics
- **Page Views**: Total landing page visits
- **Conversion Rate**: Visitors who create countdowns
- **Engagement Time**: Time spent on page
- **Feed Interactions**: Clicks on countdown cards
- **Share Actions**: Social sharing events

### Event Tracking
```typescript
// Hero interactions
trackEvent('hero_cta_clicked', { button: 'create' | 'browse' });

// Feed interactions
trackEvent('countdown_viewed', { 
  countdownId: string,
  feedType: 'new' | 'ending-soon' | 'finished',
  position: number 
});

// Sharing
trackEvent('countdown_shared', { 
  countdownId: string,
  platform: 'twitter' | 'facebook' | 'copy-link' 
});
```

## Future Enhancements

### Advanced Features
- **Personalization**: Recommended countdowns based on interest
- **Categories**: Filter by event type, industry, etc.
- **Search**: Find specific countdowns or topics
- **Trending**: Algorithm-based trending countdowns

### Social Features
- **Comments**: User reactions to countdowns
- **Voting**: Upvote interesting countdowns
- **Collections**: User-curated countdown lists
- **Following**: Subscribe to creators

### Monetization Ready
- **Sponsored Countdowns**: Featured placement
- **Premium Features**: Advanced customization
- **Analytics Dashboard**: Creator insights
- **API Access**: Developer program