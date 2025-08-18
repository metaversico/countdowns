# Environment Configuration RFC

## Objective
Implement comprehensive environment configuration system with `.env` file support, environment-specific settings, and secure configuration management for development, staging, and production environments.

## User Stories
- As a developer, I want easy environment setup with sensible defaults
- As a DevOps engineer, I want secure configuration management for production
- As a system administrator, I want environment-specific behavior control
- As a team member, I want consistent configuration across different environments

## Configuration Architecture

### Environment Hierarchy
1. **Default Values** - Built-in application defaults
2. **Environment Files** - `.env`, `.env.local`, `.env.production`
3. **System Environment** - OS environment variables
4. **Runtime Overrides** - Command-line arguments or container configs

### Precedence Order (highest to lowest)
1. Runtime environment variables
2. `.env.local` (ignored by git)
3. `.env.{NODE_ENV}` (e.g., `.env.production`)
4. `.env` (default environment file)
5. Built-in defaults

## Configuration Schema

### Core Application Settings
```typescript
interface AppConfig {
  // Server configuration
  server: {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
    cors: {
      enabled: boolean;
      origins: string[];
      credentials: boolean;
    };
  };
  
  // Database configuration
  database: {
    kvPath?: string; // Custom KV database path
    enableBackup: boolean;
    backupInterval: number; // hours
  };
  
  // Rate limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number; // milliseconds
    maxRequests: number;
    trustProxy: boolean;
  };
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
  };
  
  // Security
  security: {
    enableHelmet: boolean;
    trustedProxies: string[];
    allowedHosts: string[];
  };
  
  // Features
  features: {
    enableMetrics: boolean;
    enableHealthCheck: boolean;
    enableRealTimeUpdates: boolean;
    enableAnalytics: boolean;
  };
  
  // External services
  external: {
    analytics?: {
      provider: 'google' | 'mixpanel' | 'none';
      trackingId?: string;
    };
    monitoring?: {
      provider: 'prometheus' | 'datadog' | 'none';
      endpoint?: string;
      apiKey?: string;
    };
  };
}
```

### Environment Files

#### `.env` (Development defaults)
```bash
# Server Configuration
PORT=8000
HOST=localhost
NODE_ENV=development
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true

# Database Configuration
KV_PATH=./data/dev.db
ENABLE_BACKUP=false
BACKUP_INTERVAL=24

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=180000
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_TRUST_PROXY=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=false

# Security
ENABLE_HELMET=true
TRUSTED_PROXIES=
ALLOWED_HOSTS=localhost,127.0.0.1

# Features
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true
ENABLE_REALTIME_UPDATES=true
ENABLE_ANALYTICS=false

# External Services
ANALYTICS_PROVIDER=none
MONITORING_PROVIDER=none
```

#### `.env.production` (Production overrides)
```bash
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
CORS_ENABLED=true
CORS_ORIGINS=https://countdowns.example.com
CORS_CREDENTIALS=false

# Database Configuration
KV_PATH=/var/lib/countdowns/prod.db
ENABLE_BACKUP=true
BACKUP_INTERVAL=6

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=180000
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_TRUST_PROXY=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_FILE_PATH=/var/log/countdowns/app.log

# Security
ENABLE_HELMET=true
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
ALLOWED_HOSTS=countdowns.example.com

# Features
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true
ENABLE_REALTIME_UPDATES=true
ENABLE_ANALYTICS=true

# External Services (set via environment variables)
# ANALYTICS_PROVIDER=google
# ANALYTICS_TRACKING_ID=GA-XXXXXXXXX
# MONITORING_PROVIDER=prometheus
# MONITORING_ENDPOINT=http://prometheus:9090
```

#### `.env.local` (Local development overrides)
```bash
# Local development specific settings
# This file is ignored by git for personal configurations

# Override for local testing
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug

# Local external service testing
ANALYTICS_PROVIDER=google
ANALYTICS_TRACKING_ID=GA-TEST-123456
```

## Implementation Plan

### Backend Configuration System

#### Configuration Loader
```typescript
// backend/config/index.ts
import { load } from '@std/dotenv';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfig;
  
  private constructor() {
    this.loadConfiguration();
  }
  
  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }
  
  async loadConfiguration(): Promise<void> {
    // Load environment files in order
    await this.loadEnvFiles();
    
    // Parse and validate configuration
    this.config = this.parseConfiguration();
    
    // Validate required settings
    this.validateConfiguration();
  }
  
  private async loadEnvFiles(): Promise<void> {
    const env = Deno.env.get('NODE_ENV') || 'development';
    
    // Load base .env file
    try {
      await load({ export: true, envPath: '.env' });
    } catch {
      // .env file optional
    }
    
    // Load environment-specific file
    try {
      await load({ export: true, envPath: `.env.${env}` });
    } catch {
      // Environment-specific file optional
    }
    
    // Load local overrides (highest priority)
    try {
      await load({ export: true, envPath: '.env.local' });
    } catch {
      // Local file optional
    }
  }
  
  private parseConfiguration(): AppConfig {
    return {
      server: {
        port: parseInt(Deno.env.get('PORT') || '8000'),
        host: Deno.env.get('HOST') || 'localhost',
        environment: (Deno.env.get('NODE_ENV') || 'development') as any,
        cors: {
          enabled: Deno.env.get('CORS_ENABLED') === 'true',
          origins: Deno.env.get('CORS_ORIGINS')?.split(',') || [],
          credentials: Deno.env.get('CORS_CREDENTIALS') === 'true'
        }
      },
      
      database: {
        kvPath: Deno.env.get('KV_PATH'),
        enableBackup: Deno.env.get('ENABLE_BACKUP') === 'true',
        backupInterval: parseInt(Deno.env.get('BACKUP_INTERVAL') || '24')
      },
      
      rateLimit: {
        enabled: Deno.env.get('RATE_LIMIT_ENABLED') !== 'false',
        windowMs: parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MS') || '180000'),
        maxRequests: parseInt(Deno.env.get('RATE_LIMIT_MAX_REQUESTS') || '10'),
        trustProxy: Deno.env.get('RATE_LIMIT_TRUST_PROXY') === 'true'
      },
      
      logging: {
        level: (Deno.env.get('LOG_LEVEL') || 'info') as any,
        format: (Deno.env.get('LOG_FORMAT') || 'pretty') as any,
        enableConsole: Deno.env.get('LOG_ENABLE_CONSOLE') !== 'false',
        enableFile: Deno.env.get('LOG_ENABLE_FILE') === 'true',
        filePath: Deno.env.get('LOG_FILE_PATH')
      },
      
      security: {
        enableHelmet: Deno.env.get('ENABLE_HELMET') !== 'false',
        trustedProxies: Deno.env.get('TRUSTED_PROXIES')?.split(',') || [],
        allowedHosts: Deno.env.get('ALLOWED_HOSTS')?.split(',') || []
      },
      
      features: {
        enableMetrics: Deno.env.get('ENABLE_METRICS') !== 'false',
        enableHealthCheck: Deno.env.get('ENABLE_HEALTH_CHECK') !== 'false',
        enableRealTimeUpdates: Deno.env.get('ENABLE_REALTIME_UPDATES') !== 'false',
        enableAnalytics: Deno.env.get('ENABLE_ANALYTICS') === 'true'
      },
      
      external: {
        analytics: this.parseAnalyticsConfig(),
        monitoring: this.parseMonitoringConfig()
      }
    };
  }
  
  getConfig(): AppConfig {
    return this.config;
  }
  
  get<T>(key: string): T {
    return this.getNestedValue(this.config, key);
  }
}

// Global config instance
export const config = ConfigLoader.getInstance();
```

#### Configuration Validation
```typescript
// backend/config/validation.ts
import { z } from 'zod';

const AppConfigSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    host: z.string().min(1),
    environment: z.enum(['development', 'staging', 'production']),
    cors: z.object({
      enabled: z.boolean(),
      origins: z.array(z.string().url()),
      credentials: z.boolean()
    })
  }),
  
  database: z.object({
    kvPath: z.string().optional(),
    enableBackup: z.boolean(),
    backupInterval: z.number().min(1)
  }),
  
  rateLimit: z.object({
    enabled: z.boolean(),
    windowMs: z.number().min(1000),
    maxRequests: z.number().min(1),
    trustProxy: z.boolean()
  }),
  
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.enum(['json', 'pretty']),
    enableConsole: z.boolean(),
    enableFile: z.boolean(),
    filePath: z.string().optional()
  })
});

export function validateConfig(config: any): AppConfig {
  try {
    return AppConfigSchema.parse(config);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration');
  }
}
```

### Frontend Configuration

#### Environment Configuration
```typescript
// frontend/src/config/index.ts
interface FrontendConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableAnalytics: boolean;
    enableRealTime: boolean;
    enablePWA: boolean;
  };
  analytics: {
    provider: string;
    trackingId?: string;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    pageSize: number;
    animationsEnabled: boolean;
  };
}

class FrontendConfigLoader {
  private config: FrontendConfig;
  
  constructor() {
    this.config = {
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
        timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')
      },
      
      features: {
        enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        enableRealTime: import.meta.env.VITE_ENABLE_REALTIME !== 'false',
        enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true'
      },
      
      analytics: {
        provider: import.meta.env.VITE_ANALYTICS_PROVIDER || 'none',
        trackingId: import.meta.env.VITE_ANALYTICS_TRACKING_ID
      },
      
      ui: {
        theme: (import.meta.env.VITE_UI_THEME || 'auto') as any,
        pageSize: parseInt(import.meta.env.VITE_UI_PAGE_SIZE || '12'),
        animationsEnabled: import.meta.env.VITE_UI_ANIMATIONS !== 'false'
      }
    };
  }
  
  getConfig(): FrontendConfig {
    return this.config;
  }
}

export const frontendConfig = new FrontendConfigLoader().getConfig();
```

#### Frontend Environment Files

##### `.env` (Frontend development)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_REALTIME=true
VITE_ENABLE_PWA=false

# Analytics
VITE_ANALYTICS_PROVIDER=none

# UI Configuration
VITE_UI_THEME=auto
VITE_UI_PAGE_SIZE=12
VITE_UI_ANIMATIONS=true
```

##### `.env.production` (Frontend production)
```bash
# API Configuration
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=5000

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_PWA=true

# Analytics
VITE_ANALYTICS_PROVIDER=google

# UI Configuration
VITE_UI_THEME=auto
VITE_UI_PAGE_SIZE=12
VITE_UI_ANIMATIONS=true
```

## Security Considerations

### Sensitive Data Management
```typescript
// Separate sensitive configuration
interface SecretsConfig {
  database: {
    encryptionKey?: string;
  };
  external: {
    analyticsApiKey?: string;
    monitoringApiKey?: string;
  };
  auth: {
    jwtSecret?: string;
    sessionSecret?: string;
  };
}

// Load from secure sources only
function loadSecrets(): SecretsConfig {
  return {
    database: {
      encryptionKey: Deno.env.get('DB_ENCRYPTION_KEY')
    },
    external: {
      analyticsApiKey: Deno.env.get('ANALYTICS_API_KEY'),
      monitoringApiKey: Deno.env.get('MONITORING_API_KEY')
    },
    auth: {
      jwtSecret: Deno.env.get('JWT_SECRET'),
      sessionSecret: Deno.env.get('SESSION_SECRET')
    }
  };
}
```

### Configuration Security Rules
1. **Never commit secrets** - Use `.env.local` for sensitive data
2. **Environment validation** - Validate all configuration at startup
3. **Default to secure** - Secure defaults for production
4. **Principle of least privilege** - Minimal required permissions
5. **Audit configuration** - Log configuration loading (without secrets)

## Development Tools

### Configuration Generator
```typescript
// scripts/generate-config.ts
import { writeFile } from '@std/fs';

interface ConfigTemplate {
  environment: 'development' | 'staging' | 'production';
  options: Partial<AppConfig>;
}

async function generateConfig(template: ConfigTemplate): Promise<void> {
  const envContent = generateEnvFile(template);
  await writeFile(`.env.${template.environment}`, envContent);
  console.log(`Generated .env.${template.environment}`);
}

function generateEnvFile(template: ConfigTemplate): string {
  // Generate environment file content from template
  return Object.entries(template.options)
    .map(([key, value]) => `${key.toUpperCase()}=${value}`)
    .join('\n');
}

// Usage: deno run scripts/generate-config.ts --env=production
```

### Configuration Validator
```typescript
// scripts/validate-config.ts
import { config } from '../backend/config/index.ts';

async function validateConfiguration(): Promise<void> {
  try {
    await config.loadConfiguration();
    console.log('✅ Configuration is valid');
    
    // Print non-sensitive configuration
    console.log('Current configuration:');
    console.log(JSON.stringify(config.getConfig(), null, 2));
    
  } catch (error) {
    console.error('❌ Configuration validation failed:');
    console.error(error.message);
    Deno.exit(1);
  }
}

// Usage: deno run scripts/validate-config.ts
```

## Documentation

### Configuration Reference
Create comprehensive documentation covering:

1. **All configuration options** with descriptions and examples
2. **Environment-specific settings** and their purposes  
3. **Security best practices** for configuration management
4. **Troubleshooting guide** for common configuration issues
5. **Migration guide** for configuration changes between versions

### README Updates
```markdown
## Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed.

### Key Settings

- `PORT`: Server port (default: 8000)
- `RATE_LIMIT_MAX_REQUESTS`: Countdown creation limit (default: 10)
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

### Environment Files

- `.env` - Base configuration
- `.env.local` - Local overrides (ignored by git)
- `.env.production` - Production settings

See [CONFIGURATION.md](docs/CONFIGURATION.md) for complete reference.
```

## Testing Strategy

### Configuration Tests
```typescript
// tests/config.test.ts
import { assertEquals } from '@std/assert';
import { ConfigLoader } from '../backend/config/index.ts';

Deno.test('Configuration loading', async () => {
  // Test default configuration
  const config = new ConfigLoader();
  await config.loadConfiguration();
  
  assertEquals(config.get('server.port'), 8000);
  assertEquals(config.get('rateLimit.enabled'), true);
});

Deno.test('Environment override', async () => {
  // Test environment variable override
  Deno.env.set('PORT', '9000');
  
  const config = new ConfigLoader();
  await config.loadConfiguration();
  
  assertEquals(config.get('server.port'), 9000);
  
  Deno.env.delete('PORT');
});
```

### Integration Tests
- **Configuration validation** in different environments
- **Environment file loading** priority and overrides
- **Security validation** for sensitive data handling
- **Default behavior** when configuration is missing

## Acceptance Criteria

### Functional Requirements
- [ ] Environment-based configuration system working
- [ ] `.env` file support with proper precedence
- [ ] Configuration validation at startup
- [ ] Environment-specific settings
- [ ] Secure handling of sensitive data
- [ ] Configuration documentation complete

### Security Requirements
- [ ] No secrets in version control
- [ ] Secure defaults for production
- [ ] Configuration validation prevents invalid states
- [ ] Audit logging for configuration changes
- [ ] Environment isolation working correctly

### Developer Experience
- [ ] Easy local development setup
- [ ] Clear configuration documentation
- [ ] Helpful error messages for invalid config
- [ ] Configuration generation tools
- [ ] Examples for all environments

## Future Enhancements

### Advanced Features
- **Configuration hot-reload** - Update configuration without restart
- **Configuration API** - Runtime configuration management
- **Configuration encryption** - Encrypt sensitive configuration at rest
- **Configuration versioning** - Track configuration changes over time

### DevOps Integration
- **Kubernetes ConfigMaps** - Integration with K8s configuration
- **HashiCorp Vault** - External secrets management
- **Configuration drift detection** - Monitor configuration changes
- **Multi-environment management** - Centralized configuration control