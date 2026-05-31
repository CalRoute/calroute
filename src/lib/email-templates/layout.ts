export function emailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; line-height: 1.5; }
          h2 { color: #1a1a1a; margin-top: 0; }
          ul { color: #555; }
          li { margin: 0.5rem 0; }
          p { color: #666; }
          a { color: #0D7377; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
          .container { max-width: 600px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
      </body>
    </html>
  `
}
