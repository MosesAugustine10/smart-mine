const fs = require('fs');
const path = require('path');

const files = [
    'app/drilling/page.tsx',
    'app/blasting/page.tsx',
    'app/diamond-drilling/page.tsx',
    'app/geophysics/page.tsx',
    'app/material-handling/page.tsx'
];

for (const relPath of files) {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Protect against double running
    if (content.includes('bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border')) {
        console.log(`Skipped ${relPath} - already moved`);
        continue;
    }

    // 1. Extract the ProfessionalReportButton(s)
    let buttonsStr = '';
    // The regex matches 1 or 2 sequential <ProfessionalReportButton ... /> elements
    const btnRegex = /(<ProfessionalReportButton[\s\S]*?\/>)\s*(?:(<ProfessionalReportButton[\s\S]*?\/>))?/g;
    
    // We only want to extract the first occurrence block we find (which has our buttons)
    // and remove them all from their original deep down position.
    content = content.replace(btnRegex, (match) => {
        if (!buttonsStr) {
            buttonsStr = match;
        }
        return ''; // remove from old position
    });

    if (buttonsStr) {
        // 2. Insert it right after DashboardHeader
        // Some headers span multiple lines: <DashboardHeader \n title="..." \n />
        const headerRegex = /(<DashboardHeader[\s\S]*?\/>)/;
        
        const wrapperHtml = `\n      <div className="mx-6 mt-4 mb-2 flex flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border shadow-sm">
        <div className="w-full text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Global Reporting Actions</div>
        ` + buttonsStr + `\n      </div>`;

        content = content.replace(headerRegex, `$1${wrapperHtml}`);
        fs.writeFileSync(fullPath, content);
        console.log(`Successfully elevated reports to top for ${relPath}`);
    } else {
        console.log(`No buttons found in ${relPath}`);
    }
}
