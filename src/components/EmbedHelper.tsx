'use client'

import { useState } from 'react'

export default function EmbedHelper({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const embedUrl = `https://calroute.me/embed/${slug}`
  const embedCode = `<div class="calroute-embed" data-slug="${slug}" data-height="600px"></div>
<script src="https://calroute.me/embed.js"><\/script>`

  const iframeCode = `<iframe src="${embedUrl}" style="width: 100%; height: 600px; border: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);" title="Book a meeting"></iframe>`

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Embed this booking widget</h3>
        <p className="text-sm text-gray-500 mb-4">Share your booking link by embedding it directly on your website.</p>
      </div>

      {/* Method 1: Script Tag */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 uppercase tracking-widest">Method 1: Drop-in script</p>
        <p className="text-sm text-gray-500">Easiest — just add two lines to your HTML</p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-xs overflow-x-auto">
          <code className="text-gray-700">{embedCode}</code>
        </div>
        <button
          onClick={() => copyToClipboard(embedCode)}
          className="text-xs text-[#0D7377] hover:text-[#0a5f63] font-medium transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>

      {/* Method 2: Direct iFrame */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 uppercase tracking-widest">Method 2: Direct iframe</p>
        <p className="text-sm text-gray-500">For more control over styling and sizing</p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-xs overflow-x-auto">
          <code className="text-gray-700">{iframeCode}</code>
        </div>
        <button
          onClick={() => copyToClipboard(iframeCode)}
          className="text-xs text-[#0D7377] hover:text-[#0a5f63] font-medium transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy code'}
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 uppercase tracking-widest">Preview</p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <iframe
            src={embedUrl}
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              borderRadius: '8px',
            }}
            title="Preview"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
        <p>💡 <strong>Customization tips:</strong></p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Change <code className="bg-gray-100 px-1 rounded">data-height</code> or <code className="bg-gray-100 px-1 rounded">data-width</code> attributes to resize</li>
          <li>The iframe is responsive and will adapt to its container</li>
          <li>Direct iframe URL: <code className="bg-gray-100 px-1 rounded text-[11px]">{embedUrl}</code></li>
        </ul>
      </div>
    </div>
  )
}
