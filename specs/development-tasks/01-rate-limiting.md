# Rate Limiting Implementation RFC

## Objective
Implement rate limiting to prevent spam and abuse by limiting countdown creation to **10 countdowns per 3 minutes** per client as specified in the README.md requirements.

## User Stories
- As a system administrator, I want to prevent spam and abuse by limiting countdown creation frequency
- As a legitimate user, I want to create countdowns without being unnecessarily restricted
- As a developer, I want clear feedback when rate limits are exceeded

## Design Decisions

### Rate Limiting Strategy
- **Algorithm**: Token bucket with sliding window
- **Storage**: Deno KV for persistence across server restarts
- **Granularity**: IP address based (client identification)
- **Limits**: 10 countdowns per 3-minute window

### Implementation Approach
1. **Middleware**: Hono middleware for countdown creation endpoints
2. **Key Structure**: `rate_limit:${ip_address}:${window_timestamp}`
3. **Window Size**: 3 minutes (180 seconds)
4. **Cleanup**: Automatic expiration of old rate limit records

### Error Response Format
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 countdowns per 3 minutes. Try again in X seconds.",
  "retryAfter": 120,
  "limit": 10,
  "window": 180
}
```

## Data Flow

### Request Processing
1. Extract client IP from request headers
2. Calculate current 3-minute window timestamp
3. Check existing countdown count for this IP/window
4. If under limit (< 10), increment counter and proceed
5. If over limit, return 429 Too Many Requests

### Storage Schema
```typescript
interface RateLimitRecord {
  ip: string;
  window: number; // Unix timestamp of 3-minute window start
  count: number;
  firstRequest: number; // Timestamp of first request in window
  lastRequest: number; // Timestamp of most recent request
}
```

### KV Storage Keys
- Pattern: `["rate_limit", ip, window]`
- TTL: 180 seconds (automatic cleanup)

## Implementation Plan

### Backend Changes
1. **Create rate limiting middleware** (`backend/middleware/rateLimit.ts`)
   - Token bucket implementation
   - IP extraction utility
   - Deno KV integration
   
2. **Update countdown routes** (`backend/routes/countdowns.ts`)
   - Apply rate limiting middleware to POST endpoints
   - Handle rate limit exceeded responses

3. **Add configuration** (`backend/config.ts`)
   - Rate limit settings (configurable via environment)
   - Window size and request limits

### Frontend Changes
1. **Error handling** (`frontend/src/services/countdowns.ts`)
   - Handle 429 responses
   - Parse retry-after headers
   
2. **User feedback** (`frontend/src/components/CountdownForm.vue`)
   - Display rate limit messages
   - Show countdown timer for retry-after period
   - Disable form during rate limit period

## Testability

### Unit Tests
- **Rate limit middleware logic**
  - Test counter increment
  - Test window expiration
  - Test limit enforcement
  
- **IP extraction utility**
  - Test various header configurations
  - Test IPv4/IPv6 handling
  - Test proxy headers (X-Forwarded-For)

### Integration Tests
- **API endpoint protection**
  - Create 10 countdowns successfully
  - Verify 11th request is rejected
  - Test window reset after 3 minutes
  
- **Concurrent requests**
  - Multiple simultaneous requests
  - Race condition handling

### End-to-End Tests
- **User workflow**
  - Create countdowns until limit
  - Verify error message display
  - Wait for window reset
  - Verify functionality restored

## Acceptance Criteria

### Functional Requirements
- [ ] Maximum 10 countdown creations per 3-minute window
- [ ] Rate limits are per-client (IP address)
- [ ] Clear error messages when limit exceeded
- [ ] Automatic window reset after 3 minutes
- [ ] Rate limit state survives server restarts

### Non-Functional Requirements
- [ ] Response time impact < 10ms per request
- [ ] Memory usage scales linearly with active IPs
- [ ] Automatic cleanup of expired rate limit records
- [ ] Configurable limits via environment variables

### Edge Cases
- [ ] Handle IPv6 addresses correctly
- [ ] Support proxy headers (X-Forwarded-For)
- [ ] Graceful degradation if KV unavailable
- [ ] Handle clock skew in distributed environments

## Configuration

### Environment Variables
```bash
RATE_LIMIT_WINDOW=180          # 3 minutes in seconds
RATE_LIMIT_MAX_REQUESTS=10     # Maximum requests per window
RATE_LIMIT_ENABLED=true        # Enable/disable rate limiting
RATE_LIMIT_TRUST_PROXY=false   # Trust X-Forwarded-For headers
```

### Development Override
```bash
# For development/testing
RATE_LIMIT_WINDOW=60           # 1 minute for faster testing
RATE_LIMIT_MAX_REQUESTS=3      # Lower limit for testing
```

## Security Considerations

### Attack Mitigation
- **IP spoofing**: Validate proxy headers configuration
- **Distributed attacks**: Consider implementing CAPTCHA for repeated violations
- **Storage exhaustion**: Implement KV cleanup and size limits

### Privacy
- **IP storage**: Minimal retention, automatic cleanup
- **Logging**: Avoid logging full IP addresses in production

## Monitoring

### Metrics to Track
- Rate limit violations per hour
- Average requests per IP
- Storage usage for rate limit records
- Response time impact

### Alerting
- High rate limit violation rates (potential attack)
- Rate limiting service unavailable
- Unusual IP address patterns

## Future Enhancements

### Progressive Penalties
- Temporary IP blocking after repeated violations
- Exponential backoff for repeat offenders

### Advanced Rate Limiting
- User account based limits (when auth is added)
- Different limits for different endpoint types
- Geographic rate limiting

### Performance Optimization
- In-memory cache for frequent IPs
- Batch KV operations for better performance