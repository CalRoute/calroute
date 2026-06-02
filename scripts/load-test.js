#!/usr/bin/env node

/**
 * Load Testing Script
 * Tests API endpoints under load to identify performance bottlenecks
 * Usage: node scripts/load-test.js
 */

const http = require('http')
const https = require('https')

const ENDPOINTS = [
  { method: 'GET', path: '/api/bookings', name: 'Get bookings' },
  { method: 'GET', path: '/api/booking-links', name: 'Get booking links' },
  { method: 'GET', path: '/api/admin/metrics', name: 'Get admin metrics' },
  { method: 'GET', path: '/api/admin/engagement', name: 'Get engagement metrics' },
]

const CONFIG = {
  host: process.env.TEST_HOST || 'localhost',
  port: process.env.TEST_PORT || 3000,
  concurrency: parseInt(process.env.CONCURRENCY || '10'),
  requestsPerEndpoint: parseInt(process.env.REQUESTS || '100'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
}

class LoadTester {
  constructor() {
    this.results = []
    this.startTime = null
    this.endTime = null
  }

  async test() {
    console.log('🚀 Starting Load Test')
    console.log(`Host: ${CONFIG.host}:${CONFIG.port}`)
    console.log(`Concurrency: ${CONFIG.concurrency}`)
    console.log(`Requests per endpoint: ${CONFIG.requestsPerEndpoint}`)
    console.log('')

    this.startTime = Date.now()

    for (const endpoint of ENDPOINTS) {
      await this.testEndpoint(endpoint)
    }

    this.endTime = Date.now()
    this.printResults()
  }

  async testEndpoint(endpoint) {
    console.log(`Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`)

    const results = {
      endpoint: endpoint.name,
      path: endpoint.path,
      totalRequests: CONFIG.requestsPerEndpoint,
      successful: 0,
      failed: 0,
      responseTimes: [],
      errors: [],
    }

    // Create concurrent request batches
    const batchSize = CONFIG.concurrency
    for (let batch = 0; batch < CONFIG.requestsPerEndpoint; batch += batchSize) {
      const promises = []
      for (let i = 0; i < Math.min(batchSize, CONFIG.requestsPerEndpoint - batch); i++) {
        promises.push(this.makeRequest(endpoint, results))
      }
      await Promise.all(promises)
    }

    results.avgResponseTime = (
      results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    ).toFixed(2)
    results.minResponseTime = Math.min(...results.responseTimes).toFixed(2)
    results.maxResponseTime = Math.max(...results.responseTimes).toFixed(2)

    this.results.push(results)
    console.log(
      `✓ Completed: ${results.successful}/${results.totalRequests} successful, avg ${results.avgResponseTime}ms`
    )
    console.log('')
  }

  makeRequest(endpoint, results) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const protocol = CONFIG.host.includes('https') ? https : http

      const options = {
        hostname: CONFIG.host,
        port: CONFIG.port,
        path: endpoint.path,
        method: endpoint.method,
        timeout: CONFIG.timeout,
      }

      const req = protocol.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const duration = Date.now() - startTime
          results.responseTimes.push(duration)

          if (res.statusCode >= 200 && res.statusCode < 300) {
            results.successful++
          } else {
            results.failed++
            results.errors.push({
              statusCode: res.statusCode,
              body: data.substring(0, 100),
            })
          }

          resolve()
        })
      })

      req.on('error', (error) => {
        results.failed++
        results.errors.push({ message: error.message })
        resolve()
      })

      req.on('timeout', () => {
        results.failed++
        results.errors.push({ message: 'Timeout' })
        req.abort()
        resolve()
      })

      req.end()
    })
  }

  printResults() {
    console.log('📊 Load Test Results')
    console.log('═'.repeat(60))

    const totalDuration = this.endTime - this.startTime
    console.log(`Total duration: ${totalDuration}ms`)
    console.log(`Total requests: ${this.results.reduce((a, b) => a + b.totalRequests, 0)}`)
    console.log(`Total successful: ${this.results.reduce((a, b) => a + b.successful, 0)}`)
    console.log(`Total failed: ${this.results.reduce((a, b) => a + b.failed, 0)}`)
    console.log('')

    for (const result of this.results) {
      console.log(`${result.endpoint}`)
      console.log(`  Successful: ${result.successful}/${result.totalRequests}`)
      console.log(`  Avg response: ${result.avgResponseTime}ms`)
      console.log(`  Min/Max: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`)
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`)
      }
      console.log('')
    }

    // Overall performance rating
    const successRate = (
      (this.results.reduce((a, b) => a + b.successful, 0) /
        this.results.reduce((a, b) => a + b.totalRequests, 0)) *
      100
    ).toFixed(1)
    const avgResponseTime = this.results.reduce((a, b) => a + parseFloat(b.avgResponseTime), 0) / this.results.length

    console.log('Overall Performance Rating:')
    if (successRate >= 99 && avgResponseTime < 200) {
      console.log('✅ Excellent')
    } else if (successRate >= 95 && avgResponseTime < 500) {
      console.log('✓ Good')
    } else if (successRate >= 90 && avgResponseTime < 1000) {
      console.log('⚠ Fair')
    } else {
      console.log('❌ Poor')
    }

    console.log(`Success Rate: ${successRate}%`)
    console.log(`Avg Response Time: ${avgResponseTime.toFixed(2)}ms`)
  }
}

// Run the load test
const tester = new LoadTester()
tester.test().catch(console.error)
