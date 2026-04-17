import * as XLSX from "xlsx"

/**
 * Universal Data Export Utility
 * Supports professional CSV and XLSX generation for mining ledgers
 */

export function downloadCSV(data: any[], filename: string, headers?: string[]) {
  const finalHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : [])
  
  let csvContent = finalHeaders.join(",") + "\r\n"

  if (data.length > 0) {
    data.forEach(row => {
      const line = finalHeaders.map(header => {
        let val = row[header] ?? ""
        if (typeof val === "object") val = JSON.stringify(val)
        let strVal = String(val)
        if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
          strVal = '"' + strVal.replace(/"/g, '""') + '"'
        }
        return strVal
      }).join(",")
      csvContent += line + "\r\n"
    })
  } else {
    // Professional empty state: Include headers only
    csvContent += "ZERO RECORDS INDEXED\r\n"
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadXLSX(data: any[], filename: string, sheetName: string = "Data Ledger", headers?: string[]) {
  // If no data, provide a professional template header
  const worksheetData = data.length > 0 ? data : (headers ? [headers.reduce((acc, h) => ({...acc, [h]: "NO DATA"}), {})] : [{ Status: "ZERO RECORDS INDEXED" }])
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  
  // Excel sheet names cannot exceed 31 chars and cannot contain certain chars
  const safeSheetName = sheetName.replace(/[\\/*?:\[\]]/g, '').substring(0, 31) || "Data"
  
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
  
  // High-contrast professional formatting logic
  const dateStr = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`)
}
