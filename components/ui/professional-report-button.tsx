"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns"
import { downloadCSV, downloadXLSX } from "@/lib/export-utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface KPI {
  label: string
  value: string | number
  color?: string
}

interface ChartData {
  type: "bar" | "line" | "pie"
  title: string
  data: { label: string; value: number }[]
  color?: string
}

interface ProfessionalReportButtonProps {
  data: any[]
  filename: string
  title: string
  headers?: string[]
  groupBy?: string
  moduleColor?: "blue" | "orange" | "emerald" | "indigo" | "slate" | "purple" | "red" | "amber"
  buttonLabel?: string
  showLanguageSwitch?: boolean
  language?: "en" | "sw"
  kpis?: KPI[]
  charts?: ChartData[]
  translations?: Record<string, string>
  hidePeriodSelector?: boolean
  brand?: { brand_name: string; logo_url: string | null }
  activePeriod?: "all" | "daily" | "weekly" | "monthly" | "yearly"
}

export function ProfessionalReportButton({ 
  data, 
  filename, 
  title, 
  headers,
  groupBy,
  moduleColor = "blue",
  buttonLabel = "Export Professional Report",
  showLanguageSwitch = false,
  language = "en",
  hidePeriodSelector = false,
  brand,
  activePeriod,
  kpis = [],
  charts = [],
  translations = {}
}: ProfessionalReportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "daily" | "weekly" | "monthly" | "yearly">(activePeriod || "all")
  
  // Sync with prop if it changes
  useState(() => {
    if (activePeriod) setSelectedPeriod(activePeriod)
  })
  const [reportLanguage, setReportLanguage] = useState<"en" | "sw">(language)
  const [companyInfo, setCompanyInfo] = useState<any>({ name: "SMART MINE", vat_number: "CORP-VAT-999", logo_url: "" })

  const isSwahili = reportLanguage === "sw"

  // Pre-fetch company info once
  useState(() => {
    const fetchCompany = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          const { data: companyData } = await supabase
            .from("companies").select("*")
            .eq("id", session.user.user_metadata?.company_id || session.user.id).single()
          if (companyData) setCompanyInfo(companyData)
        }
      } catch (e) {
        console.warn("Offline or missing Supabase config")
      }
    }
    fetchCompany()
  })

  // Filter data by selected period
  const filteredByPeriod = useMemo(() => {
    if (selectedPeriod === "all") return data
    const now = new Date()
    let interval: { start: Date; end: Date }
    if (selectedPeriod === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
    else if (selectedPeriod === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
    else if (selectedPeriod === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
    else interval = { start: startOfYear(now), end: endOfYear(now) }

    return data.filter(item => {
      try {
        const date = item.created_at || item.date || item.issue_date || item.timestamp
        if (!date) return true
        return isWithinInterval(parseISO(date), interval)
      } catch { return true }
    })
  }, [data, selectedPeriod])

  // Dynamic Report Enhancements: Auto-Status Injections for Inventory
  const enhancedData = useMemo(() => {
    const activeData = filteredByPeriod
    if (activeData.length > 0 && ('current_stock' in activeData[0] || 'minimum_stock' in activeData[0])) {
      return activeData.map(item => {
        const current = Number(item.current_stock || 0)
        const minimum = Number(item.minimum_stock || 0)
        let status = "OK"
        if (current < minimum) status = "CRITICAL"
        else if (current <= minimum * 1.2) status = "LOW"
        return { ...item, auto_status: status }
      })
    }
    return activeData
  }, [filteredByPeriod])

  const enhancedHeaders = useMemo(() => {
    if (!headers || enhancedData === data) return headers
    const newHeaders = [...headers]
    if (!newHeaders.includes('minimum_stock')) {
      const idx = newHeaders.indexOf('current_stock')
      if (idx !== -1) newHeaders.splice(idx, 0, 'minimum_stock')
      else newHeaders.push('minimum_stock')
    }
    if (!newHeaders.includes('auto_status')) {
      const idx = newHeaders.indexOf('current_stock')
      if (idx !== -1) newHeaders.splice(idx + 2, 0, 'auto_status')
      else newHeaders.push('auto_status')
    }
    return newHeaders
  }, [headers, enhancedData])

  const { toast } = useToast()

  const generatePDF = async () => {
    try {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      const company = companyInfo

      const isSwahili = reportLanguage === "sw"
      
      const labels = {
        tableSummary: isSwahili ? "I. MUHTASARI WA JEDWALI" : "I. TABLE SUMMARY",
        fullDetails: isSwahili ? "II. MAELEZO KAMILI YA DATA" : "II. FULL DATA RECORDS",
        recordRef: isSwahili ? "KUMBUKUMBU YA DATA: " : "DATA RECORD REFERENCE: ",
        footerText: isSwahili ? "Taarifa Binafsi za " : "Proprietary Information of ",
        unauthorized: isSwahili ? " • Usambazaji hauruhusiwi" : " • Unauthorised Distribution Prohibited",
        secureCopy: isSwahili ? "NAKALA ILIYOLINDWA" : "SECURE REPORT COPY",
        date: isSwahili ? "Tarehe" : "Date",
        vaultRef: isSwahili ? "Rejea ya Mfumo" : "Vault Reference",
        visuals: isSwahili ? "III. UCHAMBUZI WA PICHA/CHATI" : "III. VISUAL ANALYTICS",
        noRecords: isSwahili ? "Hakuna rekodi zilizopatikana." : "No active records found."
      }

      let formKeys = Object.keys(enhancedData[0] || {})
      let columnsToUse = enhancedHeaders ? Array.from(new Set([...enhancedHeaders, ...formKeys])) : formKeys
      
      // Filter out redundant columns for sections if they are in table headers
      const tableHeaders = enhancedHeaders?.slice(0, 6) || columnsToUse.slice(0, 6)
      
      let columns = columnsToUse.map(k => {
        let label = k.replace(/_/g, ' ').toUpperCase()
        if (translations && translations[k]) {
           const parts = translations[k].split(' / ')
           if (parts.length > 1) {
             label = isSwahili ? parts[1].toUpperCase() : parts[0].toUpperCase()
           } else {
             label = translations[k].toUpperCase()
           }
        }
        return { key: k, label }
      })
      if (columns.length === 0) columns = [{ key: "notice", label: "SYSTEM NOTICE" }]

      let sections: any = null
      const activeGroupBy = groupBy || (enhancedData.length > 0 && 'status' in enhancedData[0] ? 'status' : null)
      if (activeGroupBy && enhancedData.length > 0 && Object.keys(enhancedData[0] || {}).length > 0) {
        const grouped = enhancedData.reduce((acc: any, item: any) => {
          const key = item[activeGroupBy] || "Uncategorized"
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        }, {} as Record<string, any[]>)
        sections = Object.entries(grouped).map(([key, items]) => ({
          title: activeGroupBy.toUpperCase() + ': ' + key,
          data: items
        }))
      }

      const finalData = enhancedData.length > 0 && Object.keys(enhancedData[0] || {}).length > 0
        ? enhancedData
        : [{ notice: "No active records found for this List." }]
      const actualData = !sections ? finalData : []

      // Theme colors per module - High Intensity Palette
      const themeColors: Record<string, string> = {
        blue: "#1e40af",    // blue-800
        orange: "#c2410c",  // orange-700
        emerald: "#047857", // emerald-700
        indigo: "#4338ca",  // indigo-700
        slate: "#1e293b",   // slate-800
        purple: "#7e22ce",  // purple-700
        red: "#b91c1c",     // red-700
        amber: "#b45309"    // amber-700
      }
      const themeHex = themeColors[moduleColor] || themeColors.blue
      const accentHex = themeHex + '15' // Light background version

      // Build cell HTML using string concatenation (no nested template literals)
      const buildCell = (col: any, row: any, tag: string) => {
        let val = row[col.key]
        if (val === undefined || val === null) val = '-'
        else if (typeof val === 'number') val = val.toLocaleString(undefined, { maximumFractionDigits: 2 })
        else if (typeof val === 'boolean') val = val ? 'YES' : 'NO'
        else val = String(val) || '-'

        if (col.key.toLowerCase().includes('signature') && val && val !== '-') {
          return '<' + tag + '><img src="' + val + '" style="height:20px;mix-blend-mode:multiply;" /></' + tag + '>'
        }
        return '<' + tag + '>' + val + '</' + tag + '>'
      }

      // Build table HTML
      const buildTable = (rows: any[]) => {
        let tableCols = columns.filter(col => tableHeaders.includes(col.key))
        if (tableCols.length === 0) tableCols = columns.slice(0, 6)
        
        let thead = '<tr>' + tableCols.map((col: any) => '<th>' + (col.label || col.key) + '</th>').join('') + '</tr>'
        let tbody = rows.map((row: any) => {
          return '<tr>' + tableCols.map((col: any) => buildCell(col, row, 'td')).join('') + '</tr>'
        }).join('')
        return '<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>'
      }

      // Build KPI Cards HTML
      const buildKPICards = () => {
        if (!kpis || kpis.length === 0) {
           // Auto-derive some KPIs if not provided
           const totalCount = enhancedData.length
           const numericCols = columns.filter(c => typeof enhancedData[0]?.[c.key] === 'number')
           const derivedKPIs = [
             { label: isSwahili ? "JUMLA YA REKODI" : "TOTAL RECORDS", value: totalCount },
             ...numericCols.slice(0, 3).map(c => ({
               label: "TOTAL " + c.label,
               value: enhancedData.reduce((acc, r) => acc + (Number(r[c.key]) || 0), 0).toLocaleString()
             }))
           ]
           return '<div class="kpi-grid">' + derivedKPIs.map(k => '<div class="kpi-card"><div class="kpi-label">' + k.label + '</div><div class="kpi-value">' + k.value + '</div></div>').join('') + '</div>'
        }
        return '<div class="kpi-grid">' + kpis.map(k => '<div class="kpi-card"><div class="kpi-label">' + k.label + '</div><div class="kpi-value">' + k.value + '</div></div>').join('') + '</div>'
      }

      // Build complex Charts HTML
      const buildCharts = () => {
        if (!charts || charts.length === 0) {
            // Auto-derive one simple bar chart if none provided
            const numericCols = columns.filter(c => typeof enhancedData[0]?.[c.key] === 'number')
            if (numericCols.length === 0) return ''
            const col = numericCols[0]
            const chartData = enhancedData.slice(0, 8).map(r => ({
                label: String(r.name || r.id || r.id_number || r.date || 'Record'),
                value: Number(r[col.key]) || 0
            }))
            return renderSingleChart({ type: "bar", title: labels.visuals + ': ' + col.label, data: chartData })
        }
        return charts.map(c => renderSingleChart(c)).join('')
      }

      const renderSingleChart = (chart: ChartData) => {
        const maxVal = Math.max(...chart.data.map(d => d.value), 1)
        const chartColor = chart.color || themeHex

        let vizHtml = ''
        if (chart.type === 'bar') {
            vizHtml = chart.data.map(d => {
                const pct = (d.value / maxVal) * 100
                return `
                    <div style="margin-bottom: 8px;">
                        <div style="display:flex; justify-content:space-between; font-size:7px; font-weight:800; color:#64748b; margin-bottom:2px;">
                            <span>${d.label}</span>
                            <span>${d.value.toLocaleString()}</span>
                        </div>
                        <div style="height:6px; width:100%; background:#e2e8f0; border-radius:3px; overflow:hidden;">
                            <div style="height:100%; width:${pct}%; background:${chartColor}; border-radius:3px;"></div>
                        </div>
                    </div>
                `
            }).join('')
        } else if (chart.type === 'line') {
            // Simple sparkline-style dots for PDF
            vizHtml = '<div style="display:flex; align-items:flex-end; height:60px; gap:4px; padding-bottom:15px; border-bottom:1px solid #e2e8f0; margin-bottom:10px;">' + 
                chart.data.map(d => {
                    const h = (d.value / maxVal) * 100
                    return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="width:6px; height:6px; background:${chartColor}; border-radius:50%; margin-bottom:${(h/100)*40}px;"></div>
                        <div style="font-size:5px; transform:rotate(-45deg); white-space:nowrap; margin-top:10px;">${d.label}</div>
                    </div>`
                }).join('') + '</div>'
        } else if (chart.type === 'pie') {
            const total = chart.data.reduce((acc, d) => acc + d.value, 0)
            vizHtml = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">' +
                   '<div style="width:80px; height:80px; border-radius:50%; border:15px solid #e2e8f0; border-top-color:' + chartColor + '; border-right-color:' + chartColor + '99;"></div>' +
                   '<div style="display:flex; flex-direction:column; justify-content:center; gap:5px;">' +
                   chart.data.map((d, i) => `<div style="font-size:8px; display:flex; align-items:center; gap:6px;">
                        <div style="width:8px; height:8px; border-radius:2px; background:${chartColor}${i === 0 ? '' : '99'};"></div>
                        <span style="font-weight:800;">${d.label}:</span> <span>${((d.value/total)*100).toFixed(1)}%</span>
                   </div>`).join('') + '</div></div>'
        }

        return `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:15px; margin-bottom:20px; page-break-inside:avoid;">
                <div style="font-size:9px; font-weight:900; color:#1e293b; margin-bottom:12px; text-transform:uppercase; border-left:3px solid ${chartColor}; padding-left:8px;">
                    ${chart.title}
                </div>
                ${vizHtml}
            </div>
        `
      }

      // Build record-card grid HTML for wide forms
      const buildRecordCards = (rows: any[]) => {
        const categories = [
          { title: "BASIC INFORMATION", keywords: ['id', 'number', 'code', 'title', 'name', 'date', 'time', 'location', 'region', 'status', 'type', 'category', 'supplier', 'company'] },
          { title: "COSTS & FINANCIALS", keywords: ['cost', 'budget', 'tzs', 'price', 'amount', 'fee', 'tax', 'discount', 'payment', 'value', 'usd'] },
          { title: "QUANTITIES & METRICS", keywords: ['depth', 'holes', 'length', 'vibration', 'airblast', 'tonnage', 'weight', 'liters', 'consumption', 'hours', 'meters', 'quantity', 'stock', 'unit', 'rate', 'distance', 'volume', 'level'] },
          { title: "PERSONNEL & AUTHORIZATION", keywords: ['signature', 'manager', 'supervisor', 'blaster', 'person', 'reported', 'approved', 'operator', 'driver', 'worker'] },
          { title: "SUPPLEMENTARY DETAILS", keywords: ['description', 'remarks', 'reason', 'comment', 'notice', 'photo', 'image', 'file', 'attachment', 'created_at', 'updated_at'] }
        ]

        const categorizedColumns: Record<string, any[]> = {}
        columns.forEach((col: any) => {
           // AVOID REPETITION: If column is in the table headers, don't show it in detailed cards
           if (tableHeaders.includes(col.key)) return

           let assigned = isSwahili ? "MAELEZO YA NYONGEZA" : "ADDITIONAL DETAILS"
           for (const cat of categories) {
              if (cat.keywords.some(kw => col.key.toLowerCase().includes(kw) || col.label.toLowerCase().includes(kw))) {
                 assigned = cat.title; break;
              }
           }
           if (!categorizedColumns[assigned]) categorizedColumns[assigned] = []
           categorizedColumns[assigned].push(col)
        })

        const sortedCategoryNames = Object.keys(categorizedColumns).sort()

        return rows.map((row: any, i: number) => {
          const entryId = row.sample_id || row.id || row.code || row.incident_number || row.drill_number || row.blast_number || (i + 1)
          
          let sectionsHtml = ''
          let secNum = 1;
          
          sortedCategoryNames.forEach((catName) => {
             const cols = categorizedColumns[catName]
             if (cols.length === 0) return
             
             let fields = cols.map((col: any) => {
                let val = row[col.key]
                if (val === undefined || val === null || val === '') val = '-'
                else if (typeof val === 'number') val = val.toLocaleString(undefined, { maximumFractionDigits: 2 })
                else if (typeof val === 'boolean') val = val ? 'YES' : 'NO'
                else val = String(val)
                
                if (col.key.toLowerCase().includes('signature') && val !== '-') {
                   val = '<img src="' + val + '" style="height:40px;mix-blend-mode:multiply;" />'
                } else if ((col.key.toLowerCase().includes('photo') || col.key.toLowerCase().includes('image') || col.key.toLowerCase().includes('photos')) && val !== '-') {
                  let outVal = val
                  try {
                    const parsed = JSON.parse(val)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                       outVal = parsed.map((p: string) => '<img src="' + p + '" style="height:100px;margin-right:10px;border-radius:4px;object-fit:cover;border:1px solid #ccc" />').join('')
                    } else if (typeof parsed === 'string' && parsed.startsWith('http')) {
                       outVal = '<img src="' + parsed + '" style="height:100px;border-radius:4px;object-fit:cover;border:1px solid #ccc" />'
                    }
                  } catch(e) {
                     if (val.startsWith('http') || val.startsWith('data:image')) {
                       outVal = '<img src="' + val + '" style="height:100px;border-radius:4px;object-fit:cover;border:1px solid #ccc" />'
                     }
                  }
                  val = outVal
                }
                
                return '<div class="field"><div class="field-label">' + (col.label || col.key) + '</div><div class="field-value">' + val + '</div></div>'
             }).join('')
             
             sectionsHtml += '<div class="sub-section-title">' + (isSwahili ? 'SEHEMU ' : 'SECTION ') + secNum + ': ' + catName + '</div><div class="record-grid">' + fields + '</div>'
             secNum++
          })
          
          return '<div class="record-card"><div class="record-card-header">' + labels.recordRef + entryId + '</div><div class="record-body">' + sectionsHtml + '</div></div>'
        }).join('')
      }

      const renderDataContent = (rows: any[]) => {
        let contentHtml = ''
        contentHtml += buildKPICards()
        contentHtml += '<div class="summary-section"><h4 class="sub-report-header">' + labels.tableSummary + '</h4>' + buildTable(rows) + '</div>'
        contentHtml += buildCharts()
        contentHtml += '<div class="details-section"><h4 class="sub-report-header">' + labels.fullDetails + '</h4>' + buildRecordCards(rows) + '</div>'
        return contentHtml
      }

      // Build sig boxes
      const firstRow = actualData[0] || {}
      const sigBox = (sigKey: string, nameKey: string, fallback: string, role: string) => {
        const sigVal = firstRow[sigKey]
        const nameVal = firstRow[nameKey] || fallback
        const imgTag = sigVal ? '<img src="' + sigVal + '" class="sig-image" />' : ''
        return '<div class="sig-box"><div class="sig-space">' + imgTag + '</div><div class="sig-label">' + nameVal + '</div><div class="sig-sub">' + role + '</div></div>'
      }

      // Build full HTML
      const css = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Outfit', sans-serif; margin: 0; padding: 50px; color: #0f172a; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); opacity: 0.03; z-index: -1; font-size: 120px; font-weight: 900; color: ${themeHex}; pointer-events: none; white-space: nowrap; text-transform: uppercase; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 5px solid ${themeHex}; padding-bottom: 30px; margin-bottom: 40px; }
        .company-info h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.04em; color: ${themeHex}; text-transform: uppercase; }
        .report-meta { margin-top: 15px; display: flex; gap: 20px; }
        .report-meta p { margin: 0; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .badge { display: inline-block; background: ${themeHex}; color: #fff; padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 900; margin-top: 15px; letter-spacing: 0.05em; text-transform: uppercase; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .kpi-card { background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 20px; border-radius: 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${themeHex}; }
        .kpi-label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.05em; }
        .kpi-value { font-size: 18px; font-weight: 900; color: ${themeHex}; letter-spacing: -0.02em; }
        
        .summary-section { margin-bottom: 50px; }
        .sub-report-header { font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 20px; display: flex; align-items: center; gap: 10px; }
        .sub-report-header::after { content: ""; flex: 1; height: 2px; background: #e2e8f0; }

        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        th { background: ${themeHex}; color: white; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 14px 12px; text-align: left; }
        td { padding: 12px; font-size: 10px; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) td { background: #f8fafc; }
        
        .section-title { font-size: 16px; font-weight: 900; color: ${themeHex}; margin: 40px 0 20px; padding-left: 15px; border-left: 6px solid ${themeHex}; text-transform: uppercase; letter-spacing: 0.02em; }
        
        .record-card { border: 2px solid #e2e8f0; border-radius: 24px; margin-bottom: 30px; page-break-inside: avoid; overflow: hidden; background: #ffffff; }
        .record-card-header { background: ${themeHex}; color: white; font-weight: 900; padding: 14px 20px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        .record-body { padding: 5px; }
        .sub-section-title { font-size: 9px; font-weight: 900; color: ${themeHex}; background: ${accentHex}; padding: 10px 20px; margin: 15px 10px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .record-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 15px 20px 25px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field-label { font-size: 7.5px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-value { font-size: 11px; font-weight: 700; color: #0f172a; word-break: break-all; }
        
        .sig-container { margin-top: 80px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 50px; page-break-inside: avoid; }
        .sig-box { border-top: 3px solid #e2e8f0; padding-top: 15px; text-align: center; transition: border-color 0.3s; }
        .sig-box:hover { border-color: ${themeHex}; }
        .sig-space { height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .sig-image { max-height: 60px; max-width: 150px; mix-blend-mode: multiply; filter: contrast(1.2); }
        .sig-label { font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.02em; }
        .sig-sub { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em; }
        
        .footer { position: fixed; bottom: 30px; left: 50px; right: 50px; font-size: 8px; font-weight: 800; color: #94a3b8; display: flex; justify-content: space-between; border-top: 2px solid #f1f5f9; padding-top: 15px; text-transform: uppercase; letter-spacing: 0.05em; }
      `

      let bodyContent = ''
      if (sections) {
        bodyContent = sections.map((sec: any) => {
          return '<div class="section"><h3 class="section-title">' + sec.title + '</h3>' + renderDataContent(sec.data) + '</div>'
        }).join('')
      } else {
        bodyContent = renderDataContent(actualData)
      }

      const logoUrl = brand?.logo_url || company?.logo_url
      const logoTag = logoUrl ? '<img src="' + logoUrl + '" style="max-height:60px;max-width:150px;" />' : ''
      const vatTag = company?.vat_number ? '<p>VAT Ident: ' + company.vat_number + '</p>' : ''
      const companyName = brand?.brand_name || company?.name || 'SMART MINE'
      const refNum = 'SMP-EXP-' + Math.floor(Math.random() * 900000 + 100000)

      const htmlContent = [
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>' + title + '</title><style>' + css + '\n@media print { @page { margin: 0; } }\n</style></head><body>',
        '<div class="watermark">' + companyName + '</div>',
        '<div class="header">',
        '  <div class="company-info">',
        '    <h1>' + companyName + '</h1>',
        '    <div class="report-meta"><p>' + labels.vaultRef + ': ' + refNum + '</p><p>' + labels.date + ': ' + today + '</p>' + vatTag + '</div>',
        '    <div class="badge">' + title + '</div>',
        '  </div>',
        '  ' + logoTag,
        '</div>',
        bodyContent,
        '<div class="sig-container">',
        sigBox('blaster_signature', 'blaster_name', firstRow.created_by || 'Operations Lead', 'Field Validation Authority'),
        sigBox('official_signature', 'approved_by_name', 'Oversight Supervisor', 'Technical Verification Officer'),
        sigBox('manager_signature', '', isSwahili ? 'Meneja Mkuu' : 'General Manager', isSwahili ? 'Mwakilishi Aliyeidhinishwa' : 'Executive Authorized Representative'),
        '</div>',
        '<div class="footer"><div>' + labels.footerText + companyName + labels.unauthorized + '</div><div>' + labels.secureCopy + '</div></div>',
        '</body></html>'
      ].join('\n')

      const printIframe = document.createElement('iframe')
      printIframe.style.cssText = 'position:absolute;width:0;height:0;border:none;'
      document.body.appendChild(printIframe)
      const printDoc = printIframe.contentWindow?.document
      if (printDoc) {
        printDoc.open()
        printDoc.write(htmlContent)
        printDoc.close()
        setTimeout(() => {
          printIframe.contentWindow?.focus()
          printIframe.contentWindow?.print()
          setTimeout(() => { document.body.removeChild(printIframe) }, 1000)
          toast({ title: "Report Ready", description: "Save as PDF or Print securely." })
        }, 400)
      } else {
        throw new Error("Could not initialize print List")
      }
    } catch (error: any) {
      toast({ title: "Compilation Error", description: error.message, variant: "destructive" })
    }
  }

  const handleExport = async (type: "csv" | "xlsx" | "pdf") => {
    setIsExporting(type)
    try {
      // Create translated data copy for CSV/XLSX
      let exportData = enhancedData
      let exportHeaders = enhancedHeaders
      
      if (translations && type !== "pdf") {
         exportData = enhancedData.map(item => {
            const translatedItem: any = {}
            for (const key in item) {
               let label = key.replace(/_/g, ' ').toUpperCase()
               if (translations[key]) {
                  const parts = translations[key].split(' / ')
                  label = parts.length > 1 ? (isSwahili ? parts[1] : parts[0]) : translations[key]
               }
               translatedItem[label] = item[key]
            }
            return translatedItem
         })
         
         if (exportHeaders) {
            exportHeaders = exportHeaders.map(key => {
               if (translations[key]) {
                  const parts = translations[key].split(' / ')
                  return parts.length > 1 ? (isSwahili ? parts[1] : parts[0]) : translations[key]
               }
               return key.replace(/_/g, ' ').toUpperCase()
            })
         }
      }

      if (type === "csv") downloadCSV(exportData, filename, exportHeaders)
      if (type === "xlsx") downloadXLSX(exportData, filename, title, exportHeaders)
      if (type === "pdf") await generatePDF()
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-[1.02] hover:bg-black group">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2 text-blue-400 group-hover:scale-110 transition-transform" />}
          {buttonLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-3 rounded-[1.5rem] border-2 shadow-2xl bg-white dark:bg-slate-900">
        {!hidePeriodSelector && (
          <>
            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2">
                {isSwahili ? "Muda wa Ripoti" : "REPORT PERIOD"}
            </DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 px-2 mb-2">
                {[
                    { id: "all", label: isSwahili ? "Zote" : "All" },
                    { id: "daily", label: isSwahili ? "Leo" : "Daily" },
                    { id: "weekly", label: isSwahili ? "Wiki" : "Weekly" },
                    { id: "monthly", label: isSwahili ? "Mwezi" : "Monthly" },
                    { id: "yearly", label: isSwahili ? "Mwaka" : "Yearly" }
                ].map((p) => (
                    <button 
                        key={p.id}
                        onClick={() => setSelectedPeriod(p.id as any)}
                        className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedPeriod === p.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
          </>
        )}
        {showLanguageSwitch && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2">
                {isSwahili ? "Lugha ya Ripoti" : "REPORT LANGUAGE"}
            </DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 px-2 mb-2">
                <button 
                    onClick={() => setReportLanguage("sw")}
                    className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reportLanguage === "sw" ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-500"}`}
                >
                    Kiswahili
                </button>
                <button 
                    onClick={() => setReportLanguage("en")}
                    className={`h-8 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${reportLanguage === "en" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                    English
                </button>
            </div>
          </>
        )}
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2">
            {isSwahili ? "CHAGUA AINA YA RIPOTI" : "EXPORT PROCESS SELECTION"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={!!isExporting} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSwahili ? "Ripoti Rasmi (PDF)" : "Executive PDF Report"}
            </span>
          </div>
          {isExporting === "pdf" && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")} disabled={!!isExporting} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSwahili ? "Kumbukumbu ya Excel" : "Ready for Review XLSX"}
            </span>
          </div>
          {isExporting === "xlsx" && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled={!!isExporting} className="h-12 rounded-xl cursor-pointer hover:bg-slate-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <FileJson className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSwahili ? "Data Ghafi (CSV)" : "Raw Data Ledger (CSV)"}
            </span>
          </div>
          {isExporting === "csv" && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
