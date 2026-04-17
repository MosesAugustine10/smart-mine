const fs = require('fs');
const path = require('path');

const moduleFiles = [
    'app/drilling/page.tsx',
    'app/blasting/page.tsx',
    'app/diamond-drilling/page.tsx',
    'app/geophysics/page.tsx',
    'app/material-handling/page.tsx'
];

for (const p of moduleFiles) {
    const fullPath = path.join(__dirname, p);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if we haven't already added the dual buttons
    if (!content.includes('BUDGET DOWNLOAD REPORT')) {
        // Find ProfessionalReportButton XML element block
        const btnMatch = content.match(/<ProfessionalReportButton[\s\S]*?\/>/);
        
        if (btnMatch) {
            const originalBtn = btnMatch[0];
            
            // Extract the 'data={xxxx}' variable
            const dataMatch = originalBtn.match(/data=\{([^}]+)\}/);
            const dataVar = dataMatch ? dataMatch[1] : '[]';
            
            // Extract moduleColor
            const colorMatch = originalBtn.match(/moduleColor="([^"]+)"/);
            const modColor = colorMatch ? colorMatch[1] : 'blue';

            // Extract the filename base
            const filenameMatch = originalBtn.match(/filename="([^"]+)"/);
            const filenameBase = filenameMatch ? filenameMatch[1].replace('_AUDIT', '').replace('_LEDGER', '') : 'MODULE_EXPORT';

            const newButtons = `
            <ProfessionalReportButton 
              data={${dataVar}} 
              filename="${filenameBase}_BUDGET_REPORT" 
              title="Budget & Financial Estimations Report" 
              moduleColor="${modColor}"
              buttonLabel="BUDGET DOWNLOAD REPORT"
              headers={['date', 'region', 'planned_budget_tzs', 'total_cost', 'status']}
            />
            <ProfessionalReportButton 
              data={${dataVar}} 
              filename="${filenameBase}_SITE_REPORT" 
              title="Site Execution & Operations Report" 
              moduleColor="${modColor}"
              buttonLabel="SITE DOWNLOAD REPORT"
            />
            `;

            content = content.replace(originalBtn, newButtons);
            fs.writeFileSync(fullPath, content);
            console.log(`Updated Reports in ${fullPath}`);
        }
    }
}

// Complex wording simplification for Finance / Invoices
function simplifyTextInFile(filePath) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    
    const replacements = [
        { from: /Forensic Analysis Phase/gi, to: 'Detailed Checking Phase' },
        { from: /Forensic audit trail/gi, to: 'Detailed record' },
        { from: /Forensic Risk/gi, to: 'Risk' },
        { from: /Forensic Document/gi, to: 'Official Document' },
        { from: /Forensic Protocol/gi, to: 'Report' },
        { from: /Forensic/gi, to: 'Detailed' },
        { from: /Financial Ledger/gi, to: 'Financial Records' },
        { from: /Governance Ledger/gi, to: 'Management Records' },
        { from: /Enterprise Ledger/gi, to: 'Main Records' },
        { from: /Enterprise solutions/gi, to: 'System Solutions' },
        { from: /Enterprise Budget/gi, to: 'Main Budget' },
        { from: /Enterprise/gi, to: 'Main' },
        { from: /Protocol Registry/gi, to: 'Records List' },
        { from: /Registry/gi, to: 'List' },
        { from: /Audit Trail/gi, to: 'History Records' },
        { from: /Audit Ready/gi, to: 'Ready for Review' },
        { from: /Audit/gi, to: 'Review' },
        { from: /Protocol/gi, to: 'Process' },
    ];

    let modified = false;
    for (const rep of replacements) {
        if (content.match(rep.from)) {
            content = content.replace(rep.from, rep.to);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Simplified text in ${filePath}`);
    }
}

const financeFiles = [
    'components/billing/centralized-invoice.tsx',
    'components/billing/invoice-pdf-engine.tsx',
    'app/invoices/page.tsx',
    'app/finance/page.tsx',
    'components/finance/finance-table.tsx' // hypothetical or similar ones usually present
];

for (const f of financeFiles) {
    simplifyTextInFile(f);
}

// Let's also simplify wording across all components broadly to catch PDF templates
function simplifyBroadly(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            simplifyBroadly(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            simplifyTextInFile(p);
        }
    }
}

// Safe broad simplification in components and app, catching the most aggressive "Forensic" / "Enterprise" jargon
simplifyTextInFile('components/ui/professional-report-button.tsx');
simplifyBroadly(path.join(__dirname, 'components', 'fleet'));
simplifyBroadly(path.join(__dirname, 'components', 'safety'));
simplifyBroadly(path.join(__dirname, 'components', 'inventory'));
