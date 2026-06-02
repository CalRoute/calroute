// Database Indexing Strategy Documentation
// This file documents the recommended indexes for optimal query performance

export const RECOMMENDED_INDEXES = {
  bookings: [
    {
      name: 'status-createdAt',
      fields: ['status', 'createdAt'],
      description: 'For filtering bookings by status and date range',
      exampleQuery: "where('status', '==', 'confirmed').where('createdAt', '>=', date)",
    },
    {
      name: 'hostId-createdAt',
      fields: ['hostId', 'createdAt'],
      description: 'For getting user bookings by date',
      exampleQuery: "where('hostId', '==', uid).orderBy('createdAt', 'desc')",
    },
    {
      name: 'status-startTime',
      fields: ['status', 'startTime'],
      description: 'For availability checking',
      exampleQuery: "where('status', '==', 'confirmed').where('startTime', '>=', time)",
    },
  ],

  booking_links: [
    {
      name: 'hostId-createdAt',
      fields: ['hostId', 'createdAt'],
      description: 'For getting user links',
      exampleQuery: "where('hostId', '==', uid).orderBy('createdAt', 'desc')",
    },
    {
      name: 'slug-unique',
      fields: ['slug'],
      description: 'Single field index for slug lookup',
      exampleQuery: "where('slug', '==', slug)",
    },
  ],

  webhooks: [
    {
      name: 'hostId-createdAt',
      fields: ['hostId', 'createdAt'],
      description: 'For getting user webhooks',
      exampleQuery: "where('hostId', '==', uid).orderBy('createdAt', 'desc')",
    },
    {
      name: 'status-event',
      fields: ['status', 'event'],
      description: 'For webhook event routing',
      exampleQuery: "where('status', '==', 'active').where('event', '==', 'booking.created')",
    },
  ],

  api_metrics: [
    {
      name: 'timestamp',
      fields: ['timestamp'],
      description: 'Single field index for time range queries',
      exampleQuery: "where('timestamp', '>=', since).orderBy('timestamp', 'desc')",
    },
    {
      name: 'endpoint-timestamp',
      fields: ['endpoint', 'timestamp'],
      description: 'For endpoint-specific metrics',
      exampleQuery: "where('endpoint', '==', path).where('timestamp', '>=', since)",
    },
  ],

  feature_usage: [
    {
      name: 'timestamp',
      fields: ['timestamp'],
      description: 'For time range queries',
      exampleQuery: "where('timestamp', '>=', since).orderBy('timestamp', 'desc')",
    },
    {
      name: 'feature-timestamp',
      fields: ['feature', 'timestamp'],
      description: 'For feature-specific tracking',
      exampleQuery: "where('feature', '==', name).where('timestamp', '>=', since)",
    },
  ],

  email_metrics: [
    {
      name: 'templateId-event',
      fields: ['templateId', 'event'],
      description: 'For email template analytics',
      exampleQuery: "where('templateId', '==', id).where('event', '==', 'opened')",
    },
    {
      name: 'timestamp',
      fields: ['timestamp'],
      description: 'For time range queries',
      exampleQuery: "where('timestamp', '>=', since).orderBy('timestamp', 'desc')",
    },
  ],
}

export const INDEXING_STRATEGY = {
  whenToIndex: [
    '- When a query is repeatedly failing with "missing index" errors',
    '- When collections grow beyond 1000 documents',
    '- When query response time exceeds 100ms',
    '- When combining multiple where clauses',
    '- When ordering by a field other than the primary key',
  ],

  howToCreateIndex: [
    '1. Visit Firebase Console > Firestore Database > Indexes',
    '2. Click "Create Index"',
    '3. Select collection name',
    '4. Add fields in the correct order (most selective first)',
    '5. Set sort direction for each field',
    '6. Wait for index to build (can take minutes for large collections)',
  ],

  bestPractices: [
    '✓ Create indexes proactively for known query patterns',
    '✓ Order fields by selectivity (most restrictive first)',
    '✓ Avoid indexes on high-cardinality fields',
    '✓ Monitor index performance regularly',
    '✓ Delete unused indexes to save costs',
    '✗ Do not create indexes for single-field equality queries',
    '✗ Do not create indexes for large text fields',
    '✗ Do not create too many indexes (increases write latency)',
  ],

  performanceTips: [
    '- Cache frequently accessed data (see cache.ts)',
    '- Use collection groups sparingly',
    '- Denormalize data when appropriate',
    '- Limit query results with .limit()',
    '- Use pagination for large result sets',
    '- Query only needed fields when possible',
  ],
}

// Helper function to log index recommendations
export function getIndexRecommendations(collection: string) {
  const indexes = (RECOMMENDED_INDEXES as any)[collection] || []
  return {
    collection,
    recommendedIndexes: indexes,
    totalIndexes: indexes.length,
    instructions: INDEXING_STRATEGY.howToCreateIndex,
  }
}
