export function arrayToCSV(objArray: Record<string, any>[]): string {
  if (objArray.length === 0) return ""

  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray
  
  // Extract all unique headers across all objects
  const headersSet = new Set<string>()
  array.forEach((row: any) => {
    Object.keys(row).forEach((key) => headersSet.add(key))
  })
  const headers = Array.from(headersSet)
  
  let str = headers.join(",") + "\r\n"

  // Process rows
  for (let i = 0; i < array.length; i++) {
    let line = ""
    for (const header of headers) {
      if (line !== "") line += ","
      
      let val = array[i][header]
      
      // Handle nulls and undefined
      if (val === null || val === undefined) {
        val = ""
      } 
      // Handle objects and arrays by stringifying
      else if (typeof val === "object") {
        val = JSON.stringify(val)
      }
      
      // Escape quotes and wrap strings containing commas in quotes
      let strVal = String(val)
      if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
        strVal = '"' + strVal.replace(/"/g, '""') + '"'
      }
      
      line += strVal
    }
    str += line + "\r\n"
  }
  return str
}

export function downloadCSV(data: any[], filename: string) {
  const csvStr = arrayToCSV(data)
  const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
