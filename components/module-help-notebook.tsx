"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, FileText, Download, Info, CheckCircle2, Bomb, Drill, Truck, Shield, Landmark, Map, Box } from "lucide-react"

interface HelpContent {
    sw: {
        purpose: string;
        efficiency: string;
        pro_tips: string[];
    };
    en: {
        purpose: string;
        efficiency: string;
        pro_tips: string[];
    };
    icon: any;
}

const MODULE_HELP_REGISTRY: Record<string, HelpContent> = {
    "Blasting": {
        icon: Bomb,
        sw: {
            purpose: "Moduli hii inatumika kurekodi mipango na utekelezaji wa ulipuaji (blasting). Inahifadhi idadi ya mashimo (holes), kiasi cha vilipuzi (explosives), na 'powder factor'.",
            efficiency: "Inasaidia kukokotoa gharama ya ulipuaji kwa kila tani (cost per tonne) na kuzuia upotevu wa vilipuzi.",
            pro_tips: ["Hakikisha umeingiza 'Powder Factor' baada ya kila mlipuko.", "Weka saini ya msimamizi (supervisor) ili kuhalalisha rekodi."]
        },
        en: {
            purpose: "This module serves as the primary registry for blasting logistics, hole layout parameters, and explosive fragmentation metrics.",
            efficiency: "Enable real-time Powder Factor tracking and cost optimization per cubic meter of blasted material.",
            pro_tips: ["Cross-verify explosive quantity against hole depth records.", "Monitor cost-per-tonne trends in the dashboard to identify operational leaks."]
        }
    },
    "Drilling": {
        icon: Drill,
        sw: {
            purpose: "Hapa ndipo unapoingiza taarifa za uchorongaji (drilling), ikiwemo namba ya mashine, urefu wa mashimo (depth), na namba ya fimbo (rods) zilizopigwa.",
            efficiency: "Inafuatilia ufanisi wa kila mashine na mchorongaji (driller) kwa wakati halisi.",
            pro_tips: ["Weka idadi kamili ya 'rods' zilizotumika kwa kila shimo.", "Fuatilia muda wa mashine kusimama (downtime) kuzuia upotevu wa muda."]
        },
        en: {
            purpose: "Strategic command center for drilling operations, monitoring technical penetration rates, machine telemetry, and rod consumption.",
            efficiency: "Track Machine Availability vs. Utilization (MA vs UA) for better lifecycle management.",
            pro_tips: ["Log downtime minutes accurately to improve fleet maintenance scheduling.", "Validate driller name against regional personnel directory."]
        }
    },
    "Haulage / Material": {
        icon: Truck,
        sw: {
            purpose: "Moduli hii inahusika na ubebaji wa mawe au mchanga (material handling). Inarekodi safari za malori na ufanisi wa kupakia (loading efficiency).",
            efficiency: "Inasaidia kujua kiasi kamili cha tani zilizosafirishwa kwenda 'crusher' au sehemu ya kuhifadhi.",
            pro_tips: ["Weka ufanisi wa mafuta (fuel efficiency) kwa kila lita.", "Gonga saini ya dereva ili kuthibitisha safari."]
        },
        en: {
            purpose: "Operations ledger for haulage logistics, material flow tracking, and vehicle dispatch metrics.",
            efficiency: "Monitor Tonne-Kilometer-Per-Hour (TKPH) and fuel consumption versus production output.",
            pro_tips: ["Record load count vs payload weight for accurate tonnage calculation.", "Monitor vehicle operational status directly from the fleet dashboard."]
        }
    },
    "Safety (HSSE)": {
        icon: Shield,
        sw: {
            purpose: "Moduli muhimu zaidi kwa ajili ya kulinda maisha na vifaa. Inarekodi ajali, nusura-ajali (near misses), na ukaguzi wa usalama.",
            efficiency: "Inasaidia kupunguza hatari (risk) na kuhakikisha mgodi unafuata sheria za usalama (Occupational Safety).",
            pro_tips: ["Ripoti 'Near Misses' haraka kabla hazijawa ajali kamili.", "Tumia ripoti za usalama kuimarisha mafunzo ya wafanyakazi."]
        },
        en: {
            purpose: "Command interface for Health, Safety, Security, and Environment (HSSE) governance and incident reporting.",
            efficiency: "Enable predictive risk analysis based on near-miss frequency and PPE compliance audits.",
            pro_tips: ["Incident reporting should include photographic evidence for root cause analysis.", "Track LTIFR (Lost Time Injury Frequency Rate) in the global dashboard."]
        }
    },
    "Finance / Billing": {
        icon: Landmark,
        sw: {
            purpose: "Sehemu ya kusimamia mapato na matumizi. Hapa ndipo unaandaa ankara (invoices), unarekodi malipo, na kufuatilia faida.",
            efficiency: "Inahakikisha hakuna ankara inayopotea na inatoa ripoti kamili kwa ajili ya wawekezaji au TRA.",
            pro_tips: ["Chagua 'Brand' sahihi kama unatoa ankara kwa kupitia kampuni nyingine.", "Pakua ripoti ya XLSX kwa ajili ya uhasibu zaidi."]
        },
        en: {
            purpose: "Enterprise Financial Ledger for high-value billing, invoice lifecycle management, and revenue intelligence.",
            efficiency: "Automated VAT calculations and multi-branding support for professional white-labeled reports.",
            pro_tips: ["Utilize the Brand Selector to toggle between different front-company identities for reports.", "Monitor aging invoices in the dashboard to improve cash flow."]
        }
    },
    "Inventory": {
        icon: Box,
        sw: {
            purpose: "Dira ya stoo na ghala. Hapa unafuatilia vifaa vilivyopo, vilivyotumika, na kuhakikisha vifaa muhimu (spare parts) havishi.",
            efficiency: "Inakupa 'Warning' vifaa vinapopungua (Low Stock) ili usiwasilishe maombi kwa kuchelewa.",
            pro_tips: ["Weka 'Minimum Stock' kwa kila kifaa ili upewe taarifa mapema.", "Fanya ulinganisho (Stock-take) kila wiki dhidi ya mfumo."]
        },
        en: {
            purpose: "Supply Chain & Multi-Warehouse Inventory Control for critical spares and high-frequency consumables.",
            efficiency: "Automated stock alerts and consumption rate tracking based on operational withdrawals.",
            pro_tips: ["Categorize items for better financial reporting on expenditures.", "Monitor Lead Time for critical spares to prevent machine downtime."]
        }
    }
}

interface ModuleHelpNotebookProps {
    moduleTitle: string;
}

export function ModuleHelpNotebook({ moduleTitle }: ModuleHelpNotebookProps) {
    // Find content or use generic fallback
    const moduleKey = Object.keys(MODULE_HELP_REGISTRY).find(k => moduleTitle.includes(k)) || "General";
    const help = MODULE_HELP_REGISTRY[moduleKey] || {
        icon: BookOpen,
        sw: {
            purpose: "Moduli hii inasaidia kuimarisha rekodi za kimkakati katika mgodi wako.",
            efficiency: "Inahakikisha uwazi (transparency) kwa wawekezaji na uamuzi unaozingatia data.",
            pro_tips: ["Weka data zako kwa wakati kupitia simu au kompyuta.", "Tumia ripoti za PDF na Excel kwa ajili ya mikutano ya bodi."]
        },
        en: {
            purpose: "This module enhances strategic data governance within your operation.",
            efficiency: "Ensures institutional transparency and data-driven decision making for stakeholders.",
            pro_tips: ["Capture operational events in real-time to avoid data backlog.", "Leverage professional exports for investor reporting and auditing."]
        }
    };

    const Icon = help.icon;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg hover:scale-105 active:scale-95">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    MWONGOZO / MODULE HELP
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 max-h-[85vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950 shadow-3xl">
                <DialogHeader className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-2xl relative">
                            <Icon className="w-8 h-8 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-20" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">Standard Operational Guide</p>
                            <DialogTitle className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">
                                {moduleTitle}
                            </DialogTitle>
                        </div>
                    </div>
                    <div className="h-1 w-20 bg-blue-500 rounded-full" />
                </DialogHeader>

                <div className="space-y-10">
                    {/* Kiswahili Section */}
                    <div className="space-y-5 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FileText className="w-24 h-24" />
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2 mb-4">
                             (SW) MWONGOZO WA KIKAZI
                        </h4>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">MAELENZO YA MODULI</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {help.sw.purpose}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">UFANISI WA KAZI</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {help.sw.efficiency}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">USHURI WA KITAALAMU (TIPS)</p>
                                <ul className="space-y-2">
                                    {help.sw.pro_tips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* English Section */}
                    <div className="space-y-5 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 border-l-8 border-l-blue-600">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2 mb-4">
                             (EN) PROFESSIONAL DOCUMENTATION
                        </h4>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">OPERATIONAL PURPOSE</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    {help.en.purpose}
                                </p>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">PROCESS OPTIMIZATION</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    {help.en.efficiency}
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl space-y-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Pro-Tips</p>
                                <ul className="space-y-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {help.en.pro_tips.map((tip, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center pt-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">✦ SMART MINE ENTERPRISE RESOURCE PLANNING ✦</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
