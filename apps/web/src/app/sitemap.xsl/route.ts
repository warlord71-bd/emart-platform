const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap | Emart Skincare Bangladesh</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          :root {
            color-scheme: light;
            --ink: #1b1b33;
            --muted: #667085;
            --line: #e7e0d8;
            --bg: #fbf8f3;
            --card: #ffffff;
            --accent: #d94d83;
            --soft: #fff0f5;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          a { color: inherit; }
          .wrap { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 42px; }
          .hero {
            border: 1px solid var(--line);
            border-radius: 10px;
            background: var(--ink);
            color: white;
            padding: 24px;
            box-shadow: 0 14px 40px rgba(27, 27, 51, 0.12);
          }
          .eyebrow {
            margin: 0 0 8px;
            color: #e5b94f;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          h1 { margin: 0; font-size: clamp(30px, 7vw, 54px); line-height: 1; letter-spacing: 0; }
          .hero p { margin: 14px 0 0; max-width: 760px; color: rgba(255,255,255,.72); line-height: 1.7; }
          .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
          .btn {
            display: inline-flex;
            align-items: center;
            min-height: 42px;
            border-radius: 8px;
            background: white;
            color: var(--ink);
            padding: 0 14px;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
          }
          .btn.secondary {
            border: 1px solid rgba(255,255,255,.2);
            background: rgba(255,255,255,.08);
            color: white;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }
          .metric {
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--card);
            padding: 14px;
          }
          .metric strong { display: block; font-size: 24px; }
          .metric span { display: block; margin-top: 2px; color: var(--muted); font-size: 12px; font-weight: 700; }
          .table-card {
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: var(--card);
            box-shadow: 0 10px 30px rgba(27, 27, 51, 0.08);
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th {
            background: var(--soft);
            color: var(--ink);
            font-size: 12px;
            letter-spacing: .04em;
            text-align: left;
            text-transform: uppercase;
          }
          th, td { border-bottom: 1px solid var(--line); padding: 12px; vertical-align: top; }
          td { color: var(--muted); font-size: 13px; line-height: 1.55; }
          td:first-child { color: var(--ink); font-weight: 700; overflow-wrap: anywhere; }
          tr:hover td { background: #fffafd; }
          .url a { color: var(--ink); text-decoration: none; }
          .url a:hover { color: var(--accent); text-decoration: underline; }
          .pill {
            display: inline-flex;
            border-radius: 999px;
            background: #f3f0eb;
            padding: 4px 8px;
            color: var(--ink);
            font-size: 12px;
            font-weight: 800;
          }
          .images { color: var(--accent); font-weight: 800; }
          @media (max-width: 760px) {
            .wrap { width: min(100% - 20px, 1180px); padding-top: 18px; }
            .hero { padding: 18px; }
            .summary { grid-template-columns: 1fr; }
            table, thead, tbody, th, td, tr { display: block; }
            thead { display: none; }
            tr { border-bottom: 1px solid var(--line); padding: 10px 0; }
            td { border: 0; padding: 6px 12px; }
            td::before {
              content: attr(data-label);
              display: block;
              margin-bottom: 2px;
              color: var(--muted);
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <section class="hero">
            <p class="eyebrow">XML sitemap</p>
            <h1>Emart sitemap</h1>
            <p>This is the machine-readable sitemap, styled for humans. Search engines still receive valid XML from this same URL.</p>
            <div class="actions">
              <a class="btn" href="/sitemap">View site tree</a>
              <a class="btn secondary" href="/">Back to shop</a>
            </div>
          </section>

          <section class="summary" aria-label="Sitemap summary">
            <div class="metric">
              <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong>
              <span>Total URLs</span>
            </div>
            <div class="metric">
              <strong><xsl:value-of select="count(sm:urlset/sm:url[starts-with(sm:loc, 'https://e-mart.com.bd/shop/')])"/></strong>
              <span>Product URLs</span>
            </div>
            <div class="metric">
              <strong><xsl:value-of select="count(sm:urlset/sm:url[starts-with(sm:loc, 'https://e-mart.com.bd/category/')])"/></strong>
              <span>Category URLs</span>
            </div>
          </section>

          <section class="table-card">
            <table>
              <thead>
                <tr>
                  <th style="width:52%">URL</th>
                  <th>Last modified</th>
                  <th>Frequency</th>
                  <th>Priority</th>
                  <th>Images</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                  <tr>
                    <td class="url" data-label="URL">
                      <a>
                        <xsl:attribute name="href"><xsl:value-of select="sm:loc"/></xsl:attribute>
                        <xsl:value-of select="sm:loc"/>
                      </a>
                    </td>
                    <td data-label="Last modified"><xsl:value-of select="sm:lastmod"/></td>
                    <td data-label="Frequency"><span class="pill"><xsl:value-of select="sm:changefreq"/></span></td>
                    <td data-label="Priority"><xsl:value-of select="sm:priority"/></td>
                    <td class="images" data-label="Images"><xsl:value-of select="count(image:image)"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

export function GET() {
  return new Response(xsl, {
    headers: {
      'Content-Type': 'application/xslt+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
