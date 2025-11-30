# Logger Usage Guide

## Overview

The Logger utility provides environment-aware logging with automatic integration to ErrorMonitoringService in production. It replaces direct console.log/error usage with a structured, configurable logging system.

## Features

- **Environment-aware**: Different log levels for development vs production
- **Log Levels**: DEBUG, INFO, WARN, ERROR, NONE
- **Error Monitoring Integration**: Automatic error tracking in production
- **Child Loggers**: Create loggers with persistent context
- **Type-safe**: Full TypeScript support
- **Configurable**: Customize per environment or feature

---

## Installation

The logger is already available as a singleton:

```typescript
import { logger } from '../utils';
```

---

## Basic Usage

### Debug Logging (Development Only)

```typescript
import { logger } from '../utils';

// Simple debug message
logger.debug('User clicked submit button');

// With context
logger.debug('User clicked submit button', {
  userId: '123',
  screen: 'PaymentScreen',
});
```

### Info Logging

```typescript
// General information
logger.info('Payment initiated');

// With metadata
logger.info('Payment initiated', {
  amount: 100,
  currency: 'USD',
  paymentMethod: 'credit_card',
});
```

### Warning Logging

```typescript
// Potential issues
logger.warn('Rate limit approaching');

// With context
logger.warn('Rate limit approaching', {
  currentRequests: 95,
  limit: 100,
});
```

### Error Logging

```typescript
// Error with message only
logger.error('Payment failed');

// Error with Error object
try {
  await processPayment();
} catch (error) {
  logger.error('Payment processing failed', error as Error, {
    userId: '123',
    amount: 100,
  });
}

// Or use errorWithContext for better readability
logger.errorWithContext('Payment processing failed', error as Error, {
  userId: '123',
  amount: 100,
});
```

---

## Child Loggers

Create child loggers with persistent context for related operations:

```typescript
import { logger } from '../utils';

// Create a child logger for a specific component
const componentLogger = logger.child({ component: 'TransactionScreen' });

// All logs from this logger will include component context
componentLogger.info('Transaction initiated');
// Output: [INFO] Transaction initiated {"component":"TransactionScreen"}

componentLogger.error('Transaction failed', error);
// Output: [ERROR] Transaction failed {"component":"TransactionScreen"}

// Additional context merges with parent context
componentLogger.info('Transaction completed', { txHash: '0x123' });
// Output: [INFO] Transaction completed {"component":"TransactionScreen","txHash":"0x123"}
```

---

## Log Grouping (Development Only)

Group related log messages together:

```typescript
logger.group('Transaction Processing');
logger.debug('Validating transaction');
logger.debug('Signing transaction');
logger.debug('Broadcasting transaction');
logger.groupEnd();
```

---

## Configuration

### Default Configuration

- **Development** (`__DEV__ === true`):
  - Level: DEBUG (all logs shown)
  - Console: Enabled
  - Error Monitoring: Disabled

- **Production** (`__DEV__ === false`):
  - Level: WARN (only warnings and errors)
  - Console: Disabled
  - Error Monitoring: Enabled

### Custom Configuration

```typescript
import { logger, LogLevel } from '../utils';

// Configure log level
logger.configure({
  level: LogLevel.ERROR, // Only log errors
});

// Disable console output
logger.configure({
  enableConsole: false,
});

// Enable error monitoring in development
logger.configure({
  enableErrorMonitoring: true,
});
```

### Error Monitoring Integration

```typescript
import { logger } from '../utils';
import { ErrorMonitoringService } from '../services/ErrorMonitoringService';

// Set error monitoring service (usually done at app startup)
const errorMonitoring = new ErrorMonitoringService();
logger.setErrorMonitoring(errorMonitoring);

// Configure to enable error monitoring
logger.configure({
  enableErrorMonitoring: true,
});
```

---

## Migration from console.log/error

### Before (console.log)

```typescript
console.log('User logged in:', userId);
console.error('Failed to load user:', error);
```

### After (logger)

```typescript
import { logger } from '../utils';

logger.info('User logged in', { userId });

try {
  await loadUser();
} catch (error) {
  logger.error('Failed to load user', error as Error, { userId });
}
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good: Use DEBUG for development-only logs
logger.debug('Render count:', renderCount);

// ✅ Good: Use INFO for important events
logger.info('User logged in', { userId });

// ✅ Good: Use WARN for potential issues
logger.warn('API response slow', { responseTime: 5000 });

// ✅ Good: Use ERROR for actual errors
logger.error('Failed to save data', error);

// ❌ Bad: Using INFO for debugging
logger.info('Variable value:', someVar); // Use DEBUG instead
```

### 2. Always Include Context

```typescript
// ✅ Good: Include relevant context
logger.error('Payment failed', error, {
  userId: '123',
  amount: 100,
  paymentMethod: 'credit_card',
});

// ❌ Bad: No context
logger.error('Payment failed', error);
```

### 3. Use Child Loggers for Components

```typescript
// ✅ Good: Component-specific logger
const PaymentScreen = () => {
  const logger = logger.child({ component: 'PaymentScreen' });

  const handlePayment = () => {
    logger.info('Payment initiated', { amount });
  };
};

// ❌ Bad: Manually adding component to every log
logger.info('Payment initiated', { component: 'PaymentScreen', amount });
```

### 4. Don't Log Sensitive Data

```typescript
// ❌ Bad: Logging passwords or keys
logger.debug('Login attempt', {
  password: userPassword, // NEVER!
  privateKey: wallet.privateKey, // NEVER!
});

// ✅ Good: Log only non-sensitive data
logger.debug('Login attempt', {
  userId: user.id,
  timestamp: Date.now(),
});
```

### 5. Use Structured Context

```typescript
// ✅ Good: Structured, searchable context
logger.info('Transaction completed', {
  txHash: '0x123...',
  from: '0xabc...',
  to: '0xdef...',
  value: '1.0',
  gasUsed: 21000,
});

// ❌ Bad: Unstructured string
logger.info('Transaction completed: 0x123... from 0xabc... to 0xdef...');
```

---

## Common Use Cases

### 1. Screen/Component Logging

```typescript
export const TransactionScreen: React.FC = () => {
  const screenLogger = logger.child({ screen: 'TransactionScreen' });

  useEffect(() => {
    screenLogger.debug('Screen mounted');
    return () => {
      screenLogger.debug('Screen unmounted');
    };
  }, []);

  const handleSubmit = async () => {
    try {
      screenLogger.info('Transaction submitted');
      await submitTransaction();
      screenLogger.info('Transaction successful');
    } catch (error) {
      screenLogger.error('Transaction failed', error as Error);
    }
  };
};
```

### 2. Service Logging

```typescript
export class PaymentService {
  private logger = logger.child({ service: 'PaymentService' });

  async processPayment(amount: number) {
    this.logger.info('Processing payment', { amount });

    try {
      const result = await this.api.charge(amount);
      this.logger.info('Payment successful', {
        transactionId: result.id,
        amount,
      });
      return result;
    } catch (error) {
      this.logger.error('Payment processing failed', error as Error, {
        amount,
      });
      throw error;
    }
  }
}
```

### 3. Error Boundary Logging

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.errorWithContext('React error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
  }
}
```

### 4. Network Request Logging

```typescript
const apiLogger = logger.child({ module: 'API' });

async function fetchUser(userId: string) {
  apiLogger.debug('Fetching user', { userId });

  try {
    const response = await fetch(`/users/${userId}`);

    if (!response.ok) {
      apiLogger.warn('API request failed', {
        userId,
        status: response.status,
      });
    }

    apiLogger.debug('User fetched successfully', { userId });
    return response.json();
  } catch (error) {
    apiLogger.error('Network request failed', error as Error, {
      userId,
    });
    throw error;
  }
}
```

---

## Log Level Reference

| Level | When to Use             | Development | Production           |
| ----- | ----------------------- | ----------- | -------------------- |
| DEBUG | Detailed debugging info | ✅ Shown    | ❌ Hidden            |
| INFO  | Important events        | ✅ Shown    | ❌ Hidden            |
| WARN  | Potential issues        | ✅ Shown    | ✅ Shown + Monitored |
| ERROR | Actual errors           | ✅ Shown    | ✅ Monitored         |
| NONE  | Disable all logs        | ❌          | Use for testing      |

---

## Environment Variables

You can override log configuration with environment variables (future enhancement):

```bash
# .env.development
LOG_LEVEL=DEBUG
ENABLE_CONSOLE_LOGS=true
ENABLE_ERROR_MONITORING=false

# .env.production
LOG_LEVEL=WARN
ENABLE_CONSOLE_LOGS=false
ENABLE_ERROR_MONITORING=true
```

---

## Testing

When writing tests, configure logger to suppress output:

```typescript
import { logger, LogLevel } from '../utils/Logger';

describe('MyComponent', () => {
  beforeAll(() => {
    // Suppress logs in tests
    logger.configure({
      level: LogLevel.NONE,
    });
  });
});
```

---

## Troubleshooting

### Logs not appearing in development

```typescript
// Check current configuration
logger.configure({
  level: LogLevel.DEBUG,
  enableConsole: true,
});
```

### Errors not being tracked in production

```typescript
import { ErrorMonitoringService } from '../services/ErrorMonitoringService';

// Ensure error monitoring is set and enabled
const errorMonitoring = new ErrorMonitoringService();
logger.setErrorMonitoring(errorMonitoring);
logger.configure({
  enableErrorMonitoring: true,
});
```

---

## API Reference

### Logger Methods

- `logger.debug(message, context?)` - Log debug message
- `logger.info(message, context?)` - Log info message
- `logger.warn(message, context?)` - Log warning
- `logger.error(message, error?, context?)` - Log error
- `logger.errorWithContext(message, error, context)` - Log error with context
- `logger.group(label)` - Start log group (dev only)
- `logger.groupEnd()` - End log group (dev only)
- `logger.child(context)` - Create child logger
- `logger.configure(config)` - Update configuration
- `logger.setErrorMonitoring(service)` - Set error monitoring service

### Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}
```

---

**Last Updated**: 2025-11-29
**Version**: 1.0.0
