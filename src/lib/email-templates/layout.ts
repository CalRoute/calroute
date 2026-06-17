export function emailLayout(content: string, preheader?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; background: #F7F4EF; }
          .wrapper { background: #F7F4EF; padding: 32px 16px; }
          .container { max-width: 560px; margin: 0 auto; }
          .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
          .brand-name { font-weight: 600; color: #1a1a1a; font-size: 15px; }
          .card { background: #ffffff; border: 1px solid #e8e4dc; border-radius: 16px; padding: 28px; }
          h2 { color: #1a1a1a; margin-top: 0; font-size: 19px; }
          .details { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .details td { padding: 8px 0; font-size: 14px; vertical-align: top; }
          .details td.label { color: #888; width: 110px; white-space: nowrap; }
          .details td.value { color: #1a1a1a; font-weight: 500; }
          p { color: #555; font-size: 14px; }
          .greeting { color: #1a1a1a; font-size: 14px; background: #F7F4EF; border-radius: 10px; padding: 12px 14px; margin: 16px 0; }
          a.button { display: inline-block; background: #0D7377; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 10px; margin: 8px 0; }
          a { color: #0D7377; }
          a:hover { text-decoration: underline; }
          hr { border: none; border-top: 1px solid #eee; margin: 22px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 18px; text-align: center; }
          .actions { font-size: 13px; color: #888; }
        </style>
      </head>
      <body>
        ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
        <div class="wrapper">
          <div class="container">
            <div class="brand">
              <span class="brand-name">CalRoute</span>
            </div>
            <div class="card">
              ${content}
            </div>
            <div class="footer">Sent by CalRoute on behalf of your meeting host.</div>
          </div>
        </div>
      </body>
    </html>
  `
}
