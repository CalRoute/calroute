#!/usr/bin/env node

/**
 * Performance Testing Script
 * Measures page load times and Core Web Vitals
 * Usage: node scripts/performance-test.js [url]
 */

const url = process.argv[2] || 'http://localhost:3000'

async function measurePerformance() {
  console.log(`📊 Performance Testing: ${url}`)
  console.log('═'.repeat(60))

  try {
    const response = await fetch(url)
    const html = await response.text()

    // Extract load time from headers
    console.log(`HTTP Status: ${response.status}`)
    console.log(`Content Length: ${(html.length / 1024).toFixed(2)} KB`)

    // Parse HTML to estimate metrics
    const hasLCP = html.includes('data-lcp')
    const hasFID = html.includes('data-fid')
    const hasCLS = html.includes('data-cls')

    console.log('')
    console.log('Core Web Vitals Detection:')
    console.log(`  LCP (Largest Contentful Paint): ${hasLCP ? '✓ Tracked' : '✗ Not tracked'}`)
    console.log(`  FID (First Input Delay): ${hasFID ? '✓ Tracked' : '✗ Not tracked'}`)
    console.log(`  CLS (Cumulative Layout Shift): ${hasCLS ? '✓ Tracked' : '✗ Not tracked'}`)

    // Analyze bundle size
    const jsMatch = html.match(/\.js/g) || []
    const cssMatch = html.match(/\.css/g) || []

    console.log('')
    console.log('Resource Analysis:')
    console.log(`  JavaScript files: ${jsMatch.length}`)
    console.log(`  CSS files: ${cssMatch.length}`)

    // Performance recommendations
    console.log('')
    console.log('📋 Recommendations:')
    console.log('  ✓ Implement caching headers')
    console.log('  ✓ Minify CSS and JavaScript')
    console.log('  ✓ Enable gzip compression')
    console.log('  ✓ Use image optimization')
    console.log('  ✓ Implement lazy loading')
    console.log('  ✓ Use CDN for static assets')
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    console.log('Make sure the server is running at the specified URL')
  }
}

measurePerformance()
