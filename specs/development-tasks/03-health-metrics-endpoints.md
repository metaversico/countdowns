# Health and Metrics Endpoints RFC

## Objective
Implement `/health` and `/metrics` endpoints for production observability, monitoring, and operational readiness of the countdown application.

## User Stories
- As a DevOps engineer, I want health checks to monitor service availability
- As a system administrator, I want metrics to understand application performance
- As a developer, I want diagnostic information for troubleshooting
- As a monitoring system, I want standardized endpoints for automated checks

## Design Decisions

### Health Check Strategy
- **Endpoint**: `GET /health`
- **Response Format**: JSON with detailed component status
- **Checks**: Application, database (Deno KV), and dependencies
- **Response Codes**: 200 (healthy), 503 (unhealthy)

### Metrics Strategy
- **Endpoint**: `GET /metrics`
- **Format**: Prometheus-compatible metrics
- **Categories**: HTTP metrics, application metrics, system metrics
- **Collection**: Real-time counters and gauges

## Health Endpoint Specification

### Response Format
```typescript
interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string; // ISO 8601
  uptime: number; // seconds since startup
  version: string; // application version
  environment: string; // production/development/staging
  checks: {
    [component: string]: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number; // milliseconds
  message?: string;
  lastChecked: string; // ISO 8601
  details?: Record<string, any>;
}
```

### Health Checks

#### 1. Application Health
- **Component**: `application`
- **Check**: Basic application responsiveness
- **Criteria**: Process is running and handling requests

#### 2. Database Health
- **Component**: `database`
- **Check**: Deno KV connectivity and responsiveness
- **Criteria**: Can read/write test keys within 100ms

#### 3. Memory Health
- **Component**: `memory`
- **Check**: Memory usage within acceptable limits
- **Criteria**: < 80% of available memory

#### 4. Dependency Health
- **Component**: `dependencies`
- **Check**: Critical external dependencies
- **Criteria**: All required services accessible

### Example Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "application": {
      "status": "pass",
      "responseTime": 2,
      "lastChecked": "2024-01-15T10:30:00.000Z"
    },
    "database": {
      "status": "pass",
      "responseTime": 15,
      "lastChecked": "2024-01-15T10:30:00.000Z",
      "details": {
        "connectionPool": "active",
        "writeLatency": 12
      }
    },
    "memory": {
      "status": "pass",
      "lastChecked": "2024-01-15T10:30:00.000Z",
      "details": {
        "usedPercent": 65,
        "usedMB": 256,
        "totalMB": 512
      }
    }
  }
}
```

## Metrics Endpoint Specification

### Prometheus Format
Standard Prometheus exposition format with appropriate metric types:

#### HTTP Metrics
```
# Request duration histogram
http_request_duration_seconds{method="GET",route="/api/countdowns",status="200"} 0.015

# Request count
http_requests_total{method="POST",route="/api/countdowns",status="201"} 1247

# Response size histogram
http_response_size_bytes{method="GET",route="/api/countdowns"} 2048
```

#### Application Metrics
```
# Total countdowns created
countdowns_created_total 5432

# Active countdowns
countdowns_active 1234

# Expired countdowns
countdowns_expired_total 3456

# Rate limit violations
rate_limit_violations_total{ip="*"} 89
```

#### System Metrics
```
# Process metrics
process_start_time_seconds 1642253400
process_uptime_seconds 86400
process_memory_usage_bytes 268435456

# Deno-specific metrics
deno_version_info{version="2.4.3"} 1
v8_heap_used_bytes 134217728
```

## Implementation Plan

### Backend Implementation

#### 1. Health Check Service
```typescript
// backend/services/health.ts
export class HealthService {
  private checks: Map<string, HealthChecker> = new Map();
  
  async getHealthStatus(): Promise<HealthResponse> {
    // Aggregate all health checks
  }
  
  registerCheck(name: string, checker: HealthChecker): void {
    // Register new health check
  }
}

interface HealthChecker {
  check(): Promise<HealthCheck>;
}
```

#### 2. Metrics Collection Service
```typescript
// backend/services/metrics.ts
export class MetricsService {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
  
  export(): string; // Prometheus format
}
```

#### 3. HTTP Middleware
```typescript
// backend/middleware/metrics.ts
export function metricsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();
    
    await next();
    
    const duration = (Date.now() - start) / 1000;
    metricsService.recordHistogram('http_request_duration_seconds', duration, {
      method: c.req.method,
      route: getRoute(c),
      status: c.res.status.toString()
    });
    
    metricsService.incrementCounter('http_requests_total', {
      method: c.req.method,
      route: getRoute(c),
      status: c.res.status.toString()
    });
  };
}
```

#### 4. Route Implementation
```typescript
// backend/routes/observability.ts
import { Hono } from 'hono';
import { healthService, metricsService } from '../services/index.ts';

const app = new Hono();

app.get('/health', async (c) => {
  const health = await healthService.getHealthStatus();
  const status = health.status === 'healthy' ? 200 : 503;
  return c.json(health, status);
});

app.get('/metrics', (c) => {
  const metrics = metricsService.export();
  return c.text(metrics, 200, {
    'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
  });
});

export default app;
```

### Health Check Implementations

#### Database Health Check
```typescript
export class DatabaseHealthCheck implements HealthChecker {
  async check(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const kv = await Deno.openKv();
      
      // Test write
      const testKey = ['health_check', Date.now()];
      await kv.set(testKey, 'test');
      
      // Test read
      const result = await kv.get(testKey);
      
      // Cleanup
      await kv.delete(testKey);
      
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime < 100 ? 'pass' : 'warn',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          writeLatency: responseTime,
          readable: result.value === 'test'
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }
}
```

#### Memory Health Check
```typescript
export class MemoryHealthCheck implements HealthChecker {
  async check(): Promise<HealthCheck> {
    const memoryUsage = Deno.memoryUsage();
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
    const usedMemory = memoryUsage.heapUsed;
    const usedPercent = (usedMemory / totalMemory) * 100;
    
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (usedPercent > 90) status = 'fail';
    else if (usedPercent > 80) status = 'warn';
    
    return {
      status,
      lastChecked: new Date().toISOString(),
      details: {
        usedPercent: Math.round(usedPercent),
        usedMB: Math.round(usedMemory / 1024 / 1024),
        totalMB: Math.round(totalMemory / 1024 / 1024),
        ...memoryUsage
      }
    };
  }
}
```

## Security Considerations

### Access Control
- **Health Endpoint**: Public access (for load balancers)
- **Metrics Endpoint**: Restricted access (internal monitoring only)
- **Sensitive Data**: No credentials or PII in responses

### Rate Limiting
- **Separate Limits**: Health checks exempt from countdown rate limits
- **Internal Access**: Higher limits for monitoring systems
- **DoS Protection**: Basic rate limiting on observability endpoints

### Information Disclosure
- **Environment Detection**: Different detail levels per environment
- **Error Messages**: Generic messages in production
- **Version Information**: Minimal exposure in public responses

## Monitoring Integration

### Prometheus Configuration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'countdowns-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard
Key metrics to visualize:
- **Request Rate**: requests/second by endpoint
- **Response Time**: p50, p95, p99 latencies
- **Error Rate**: 4xx/5xx responses percentage
- **Active Countdowns**: current active countdown count
- **System Health**: memory usage, uptime

### Alerting Rules
```yaml
# alerts.yml
groups:
  - name: countdowns
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        
      - alert: ServiceDown
        expr: up == 0
        for: 1m
```

## Testing Strategy

### Unit Tests
- **Health Check Logic**: Each health checker individually
- **Metrics Collection**: Counter, histogram, gauge functionality
- **Response Formatting**: JSON and Prometheus format output

### Integration Tests
- **Endpoint Availability**: Both endpoints return valid responses
- **Health Status Accuracy**: Health reflects actual system state
- **Metrics Accuracy**: Metrics match actual request patterns

### Load Tests
- **Observability Overhead**: Impact on application performance
- **Concurrent Health Checks**: Multiple simultaneous requests
- **Metrics Collection Scale**: Performance with high request volume

## Performance Considerations

### Health Check Optimization
- **Caching**: Cache health status for 10-30 seconds
- **Timeout**: 5-second timeout for individual checks
- **Parallel Execution**: Run health checks concurrently

### Metrics Collection
- **In-Memory Storage**: Keep metrics in memory with periodic persistence
- **Sampling**: Sample expensive metrics in high-traffic scenarios
- **Retention**: Automatic cleanup of old metric data

### Resource Usage
- **Memory Footprint**: Minimize metrics storage overhead
- **CPU Impact**: Efficient metric collection and aggregation
- **Network Overhead**: Compress metrics output when possible

## Acceptance Criteria

### Functional Requirements
- [ ] `/health` endpoint returns comprehensive health status
- [ ] `/metrics` endpoint provides Prometheus-compatible metrics
- [ ] Health checks cover all critical system components
- [ ] Metrics include HTTP and application-specific data
- [ ] Proper HTTP status codes for healthy/unhealthy states

### Performance Requirements
- [ ] Health check response time < 100ms (99th percentile)
- [ ] Metrics endpoint response time < 200ms
- [ ] < 5% performance overhead from observability
- [ ] Health check timeout handling

### Integration Requirements
- [ ] Compatible with Prometheus monitoring
- [ ] Works with common load balancers
- [ ] Supports container orchestration health checks
- [ ] Provides useful debugging information

## Future Enhancements

### Advanced Metrics
- **Business Metrics**: Conversion rates, user engagement
- **Custom Dimensions**: Geographic, device type, referrer
- **Tracing Integration**: Distributed tracing support

### Enhanced Health Checks
- **Dependency Checks**: External service health
- **Performance Thresholds**: Dynamic threshold adjustment
- **Predictive Health**: Trend-based health prediction

### Operational Features
- **Debug Mode**: Additional diagnostic information
- **Maintenance Mode**: Graceful degradation signaling
- **Circuit Breakers**: Automatic service protection