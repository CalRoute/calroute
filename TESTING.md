# CalRoute Testing & Performance Guide

## Testing Setup

### Unit Tests

Run unit tests with Jest:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Integration Tests

Tests are organized by feature in `src/**/__tests__/` directories.

Example test structure:
```
src/lib/__tests__/
  ├── cache.test.ts
  ├── performance.test.ts
  └── onboarding.test.ts
```

## Performance Testing

### Load Testing

Run load tests against your local or production server:

```bash
# Test localhost:3000 (default)
node scripts/load-test.js

# Test custom host/port
TEST_HOST=example.com TEST_PORT=443 node scripts/load-test.js

# Configure concurrency and request count
CONCURRENCY=50 REQUESTS=500 node scripts/load-test.js
```

### Performance Profiling

Run performance tests:

```bash
node scripts/performance-test.js
node scripts/performance-test.js https://calroute.me
```

## Caching Strategy

### Memory Cache

The application uses in-memory caching for frequently accessed data:

```typescript
import { memoryCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

// Set cache
memoryCache.set(CACHE_KEYS.USER(uid), userData, CACHE_TTL.LONG)

// Get cache
const cached = memoryCache.get(CACHE_KEYS.USER(uid))

// Cache TTL values:
// - SHORT: 5 minutes
// - MEDIUM: 15 minutes
// - LONG: 1 hour
// - VERY_LONG: 24 hours
```

### Automatic Cleanup

Expired cache entries are automatically cleaned up every 5 minutes.

## Performance Optimization Tips

### 1. Use Caching

```typescript
import { withCache } from '@/lib/cache'

const getUser = withCache(
  'user:123',
  async () => await fetchUser('123'),
  3600 // TTL in seconds
)
```

### 2. Debounce API Calls

```typescript
import { debounce } from '@/lib/performance'

const debouncedSearch = debounce((query) => {
  apiCall(query)
}, 300)
```

### 3. Throttle Events

```typescript
import { throttle } from '@/lib/performance'

window.addEventListener('scroll', throttle(() => {
  updateLayout()
}, 100))
```

### 4. Batch Operations

```typescript
import { BatchProcessor } from '@/lib/performance'

const batcher = new BatchProcessor(
  async (items) => {
    return await saveAllToDatabase(items)
  },
  10, // batch size
  100 // delay in ms
)

// Add items
items.forEach(item => batcher.add(item))
```

## Database Indexing

### Recommended Indexes

See `src/lib/database-indexing.ts` for recommended Firestore indexes.

### Creating Indexes

1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Create Index"
3. Select the collection and fields (in order of selectivity)
4. The index will build in the background

### Index Performance Tips

- Create indexes proactively for known query patterns
- Order fields by selectivity (most restrictive first)
- Monitor index performance regularly
- Delete unused indexes to save costs

## Core Web Vitals

CalRoute is optimized for Core Web Vitals:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## Dark Mode

The application includes dark mode support:

```typescript
import { useTheme } from '@/components/ThemeProvider'

export default function Component() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('dark')}>
      Enable Dark Mode
    </button>
  )
}
```

## Onboarding System

Track user onboarding progress:

```typescript
import { completeOnboardingStep } from '@/lib/onboarding'

await completeOnboardingStep(userId, 'profile_setup')
```

## Tutorial System

Implement in-app tutorials:

```typescript
import { TUTORIALS, startTutorial } from '@/lib/tutorial'

await startTutorial(userId, 'dashboard')
```

## Revenue Analytics

Revenue data is tracked automatically for all bookings.

```typescript
import { getRevenueAnalytics } from '@/lib/revenue-analytics'

const revenue = await getRevenueAnalytics(30) // Last 30 days
```

## Email Template Analytics

Track email performance:

```typescript
import {
  trackEmailSent,
  trackEmailOpened,
  getEmailTemplateMetrics
} from '@/lib/email-template-analytics'

await trackEmailSent('template-id', 'Booking Confirmation', userId)
const metrics = await getEmailTemplateMetrics()
```

## Monitoring

### Performance Monitor

```typescript
import { monitor } from '@/lib/performance'

monitor.mark('operation-start')
// ... do work ...
monitor.measure('operation', 'operation-start')

const avg = monitor.getAverageDuration('operation')
```

### Error Logging

```typescript
import { logError } from '@/lib/error-logger'

await logError('operation', 'Error description', 'critical')
```

## Best Practices

### Code Organization
- Keep components small and focused
- Use proper TypeScript typing
- Follow naming conventions

### Performance
- Lazy load images and components
- Use React.memo for expensive components
- Implement pagination for large lists
- Cache API responses appropriately

### Testing
- Write tests as you develop
- Aim for 80%+ code coverage
- Test edge cases and error scenarios
- Use meaningful test descriptions

### Security
- Never hardcode credentials
- Validate all user input
- Use HTTPS in production
- Implement rate limiting for APIs

## Troubleshooting

### Tests Failing
- Clear Jest cache: `npm test -- --clearCache`
- Check Node version: `node --version` (should be 18+)
- Ensure dependencies are installed: `npm install`

### Performance Issues
- Check Chrome DevTools Performance tab
- Review Network tab for slow requests
- Check for memory leaks with DevTools
- Run load tests to identify bottlenecks

### Database Issues
- Check if required indexes are created
- Monitor Firestore operations in console
- Use database indexing strategy
- Profile slow queries

## Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Jest Documentation](https://jestjs.io/)
- [Web Vitals](https://web.dev/vitals/)
