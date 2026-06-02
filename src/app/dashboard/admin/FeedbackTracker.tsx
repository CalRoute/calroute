'use client'

import { useState, useEffect } from 'react'

interface FeedbackItem {
  id: string
  userId: string
  userEmail: string
  type: 'bug' | 'feature' | 'feedback'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: string
  createdAt: string
}

export default function FeedbackTracker({ feedbackStats }: { feedbackStats: { total: number; byType: Record<string, number> } }) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'bug' | 'feature' | 'feedback'>('all')

  useEffect(() => {
    loadFeedback()
  }, [])

  const loadFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback')
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.feedback || [])
      }
    } catch (err) {
      console.error('Failed to load feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? feedback : feedback.filter(f => f.type === filter)

  const icons = {
    bug: '🐛',
    feature: '✨',
    feedback: '💬',
  }

  const colors = {
    bug: 'bg-red-50 border-red-200',
    feature: 'bg-blue-50 border-blue-200',
    feedback: 'bg-yellow-50 border-yellow-200',
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">User Feedback & Issues</h2>
        <p className="text-sm text-gray-600 mt-1">Community insights and feature requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{feedbackStats.total}</p>
        </div>
        {Object.entries(feedbackStats.byType).map(([type, count]) => (
          <div key={type} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold capitalize">{type}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'bug', 'feature', 'feedback'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-[#0D7377] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading feedback...</p>
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${colors[item.type as keyof typeof colors]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{icons[item.type as keyof typeof icons]}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{item.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{item.userEmail}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                  {item.priority}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No feedback in this category</p>
        )}
      </div>
    </div>
  )
}
