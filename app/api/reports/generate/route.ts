import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, summary, data, columns, company } = body

    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    // 1. Compile HTML Template with Premium Enterprise styling
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin: 0;
          padding: 50px;
          color: #1e293b;
          background: white;
        }

        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          opacity: 0.04;
          z-index: -1;
          font-size: 140px;
          font-weight: 900;
          color: #0f172a;
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 4px solid #0f172a;
          padding-bottom: 30px;
          margin-bottom: 40px;
        }

        .company-info h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .report-meta {
          margin-top: 10px;
        }

        .report-meta p {
          margin: 2px 0;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge {
          display: inline-block;
          background: #0f172a;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          margin-top: 10px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 12px;
        }

        .summary-label {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-value {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 60px;
        }

        th {
          background: #0f172a;
          color: white;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 10px;
          text-align: left;
        }

        td {
          padding: 12px 10px;
          font-size: 10px;
          font-weight: 500;
          border-bottom: 1px solid #e2e8f0;
        }

        tr:nth-child(even) { background: #fcfcfd; }

        .sig-container {
          margin-top: 80px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          page-break-inside: avoid;
        }

        .sig-box {
          border-top: 2px solid #0f172a;
          padding-top: 15px;
          text-align: center;
        }

        .sig-space {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sig-image {
          max-height: 70px;
          max-width: 150px;
          mix-blend-mode: multiply;
        }

        .sig-label {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }

        .sig-sub {
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }

        .footer {
          position: fixed;
          bottom: 30px;
          left: 50px;
          right: 50px;
          font-size: 8px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 30px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media print { @page { margin: 0; } 
            .page-break { page-break-before: always; }
            .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">${company?.name || 'SMART MINE'}</div>

      <div class="header">
        <div class="company-info">
          <h1>${company?.name || 'SMART MINE'}</h1>
          <div class="report-meta">
            <p>Vault Reference: SMP-EXP-${Math.floor(Math.random() * 900000 + 100000)}</p>
            <p>Registry Date: ${today}</p>
            ${company?.vat_number ? `<p>VAT Ident: ${company.vat_number}</p>` : ''}
          </div>
          <div class="badge">${title}</div>
        </div>
        ${company?.logo_url ? `<img src="${company.logo_url}" style="max-height: 80px; max-width: 180px;" />` : ''}
      </div>

      ${summary ? `
      <div class="summary-grid">
        ${Object.entries(summary).filter(([k]) => typeof summary[k] !== 'object').map(([key, value]) => `
          <div class="summary-card">
            <div class="summary-label">${key.replace(/_/g, ' ')}</div>
            <div class="summary-value">${typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${body.sections ? body.sections.map((sec: any) => `
        <div class="section">
          <h3 class="section-title">${sec.title}</h3>
          <table>
            <thead>
              <tr>
                ${columns.map((col: any) => `<th>${col.label || col.key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sec.data.map((row: any) => `
                <tr>
                  ${columns.map((col: any) => {
                    let val = row[col.key];
                    if (typeof val === 'number') val = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                    if (col.key.toLowerCase().includes('signature') && val) {
                      return `<td><img src="${val}" style="height:25px; mix-blend-mode: multiply;" /></td>`
                    }
                    if (typeof val === 'boolean') return `<td>${val ? 'YES' : 'NO'}</td>`
                    return `<td>${val || '-'}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('') : `
        <table>
          <thead>
            <tr>
              ${columns.map((col: any) => `<th>${col.label || col.key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row: any) => `
              <tr>
                ${columns.map((col: any) => {
                  let val = row[col.key];
                  if (typeof val === 'number') val = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                  if (col.key.toLowerCase().includes('signature') && val) {
                    return `<td><img src="${val}" style="height:25px; mix-blend-mode: multiply;" /></td>`
                  }
                  if (typeof val === 'boolean') return `<td>${val ? 'YES' : 'NO'}</td>`
                  return `<td>${val || '-'}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}

      <div class="sig-container">
        <div class="sig-box">
          <div class="sig-space">
             ${data[0]?.blaster_signature ? `<img src="${data[0].blaster_signature}" class="sig-image" />` : ''}
          </div>
          <div class="sig-label">${data[0]?.blaster_name || data[0]?.created_by || 'Operations Lead'}</div>
          <div class="sig-sub">Field Validation Authority</div>
        </div>
        <div class="sig-box">
          <div class="sig-space">
            ${data[0]?.official_signature ? `<img src="${data[0].official_signature}" class="sig-image" />` : ''}
          </div>
          <div class="sig-label">${data[0]?.approved_by_name || 'Oversight Supervisor'}</div>
          <div class="sig-sub">Technical Verification Officer</div>
        </div>
        <div class="sig-box">
          <div class="sig-space">
            ${data[0]?.manager_signature ? `<img src="${data[0].manager_signature}" class="sig-image" />` : ''}
          </div>
          <div class="sig-label">General Manager</div>
          <div class="sig-sub">Executive Authorized Representative</div>
        </div>
      </div>

      <div class="footer">
        <div>Proprietary Information of ${company?.name || 'Smart Mine Corp'} • Unauthorised Distribution Prohibited</div>
        <div>SECURE REGISTRY COPY • PAGE <span class="pageNumber"></span> / <span class="totalPages"></span></div>
      </div>
    </body>
    </html>
    `

    const browser = await puppeteer.launch({
       headless: true,
       args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 })
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      displayHeaderFooter: false
    })

    await browser.close()

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}_${today}.pdf"`
      }
    })

  } catch (err: any) {
    console.error("Puppeteer PDF Error:", err)
    return NextResponse.json({ error: "Failed to generate professional report" }, { status: 500 })
  }
}
