'use client'

import { useState, useEffect } from 'react'

interface TrelloConnection {
  connected: boolean
  boardId?: string
  boardName?: string
  listId?: string
  listName?: string
  connectedAt?: string
}

interface Board {
  id: string
  name: string
  lists: Array<{ id: string; name: string }>
}

export default function TrelloConnector() {
  const [status, setStatus] = useState<TrelloConnection>({ connected: false })
  const [showForm, setShowForm] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [token, setToken] = useState('')
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedListId, setSelectedListId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingBoards, setFetchingBoards] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/integrations/trello')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch Trello status:', err)
    }
  }

  const fetchBoards = async () => {
    if (!apiKey || !token) {
      setError('Please enter both API Key and Token')
      return
    }

    setFetchingBoards(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/integrations/trello/boards?apiKey=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}`
      )

      if (!response.ok) {
        throw new Error('Invalid Trello credentials')
      }

      const data = await response.json()
      setBoards(data.boards || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boards')
    } finally {
      setFetchingBoards(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoardId || !selectedListId) {
      setError('Please select a board and list')
      return
    }

    const selectedBoard = boards.find(b => b.id === selectedBoardId)
    const selectedList = selectedBoard?.lists.find(l => l.id === selectedListId)

    if (!selectedBoard || !selectedList) {
      setError('Invalid board or list selection')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations/trello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          token,
          boardId: selectedBoardId,
          boardName: selectedBoard.name,
          listId: selectedListId,
          listName: selectedList.name,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect Trello')
      }

      await fetchStatus()
      setShowForm(false)
      setApiKey('')
      setToken('')
      setBoards([])
      setSelectedBoardId('')
      setSelectedListId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Trello')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/integrations/trello', { method: 'DELETE' })
      await fetchStatus()
    } catch (err) {
      setError('Failed to disconnect Trello')
    } finally {
      setLoading(false)
    }
  }

  const selectedBoard = boards.find(b => b.id === selectedBoardId)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trello Integration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically create Trello cards from meeting action items
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            status.connected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {status.connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {status.connected ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Board</p>
            <p className="font-medium text-gray-900">{status.boardName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">List</p>
            <p className="font-medium text-gray-900">{status.listName}</p>
          </div>
          {status.connectedAt && (
            <div>
              <p className="text-xs text-gray-500">
                Connected on {new Date(status.connectedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="mt-4 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] text-sm font-medium"
            >
              Connect Trello
            </button>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Trello API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Get from https://trello.com/app-key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                  disabled={loading || fetchingBoards}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Trello Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Generate from your app-key page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                  disabled={loading || fetchingBoards}
                />
              </div>

              <button
                type="button"
                onClick={fetchBoards}
                disabled={loading || fetchingBoards || !apiKey || !token}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
              >
                {fetchingBoards ? 'Fetching...' : 'Load My Boards'}
              </button>

              {boards.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Board
                    </label>
                    <select
                      value={selectedBoardId}
                      onChange={e => setSelectedBoardId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                    >
                      <option value="">Choose a board...</option>
                      {boards.map(board => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBoard && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Select List
                      </label>
                      <select
                        value={selectedListId}
                        onChange={e => setSelectedListId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                      >
                        <option value="">Choose a list...</option>
                        {selectedBoard.lists.map(list => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                    setApiKey('')
                    setToken('')
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedBoardId || !selectedListId}
                  className="flex-1 px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
