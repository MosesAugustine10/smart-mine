"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, FileText, Download, Info, CheckCircle2, Bomb, Drill, Truck, Shield, Landmark, Map, Box, Crown, FlaskConical, Pickaxe, DollarSign, Users, Fuel } from "lucide-react"

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
    "Dashboard": {
        icon: Landmark,
        sw: {
            purpose: "Hiki nio kituo kikuu cha amri (Command Center) kinachotoa muonekano wa jumla wa utendaji kazi wa mgodi kwa wakati halisi (Real-time).",
            efficiency: "Inaunganisha data kutoka moduli zote ili kutoa takwimu muhimu (KPIs) zinazosaidia uamuzi wa haraka wa usimamizi.",
            pro_tips: ["Fuatilia chati za uzalishaji kila asubuhi kubaini mapungufu mapema.", "Linganisha malengo ya mwezi (Targets) dhidi ya utekelezaji halisi."]
        },
        en: {
            purpose: "Centralized operational command center providing a high-fidelity overview of enterprise performance metrics in real-time.",
            efficiency: "Aggregates cross-modular data into actionable Key Performance Indicators (KPIs) to facilitate rapid decision-making.",
            pro_tips: ["Analyze production variants daily to identify operational bottlenecks.", "Compare monthly strategic targets against actual site output for performance auditing."]
        }
    },
    "Blasting": {
        icon: Bomb,
        sw: {
            purpose: "Moduli ya usimamizi wa vilipuzi na mipango ya milipuko. Inarekodi 'hole patterns', 'loading sheets', na matokeo ya uvunjaji wa miamba (fragmentation).",
            efficiency: "Inapunguza gharama kwa kudhibiti 'Powder Factor' na kuhakikisha matumizi sahihi ya baruti kulingana na aina ya mwamba.",
            pro_tips: ["Kagua ripoti ya 'Misfire' na hatua za usalama zilizochukuliwa.", "Rekodi 'Vibration levels' ili kuhakikisha usalama wa mazingira yanayozunguka."]
        },
        en: {
            purpose: "Industrial ledger for explosive logistics, blast pattern design, and rock fragmentation efficiency tracking.",
            efficiency: "Optimizes operational expenditure (OPEX) by monitoring Powder Factor and ensuring precision explosive distribution.",
            pro_tips: ["Document post-blast fragmentation quality to optimize downstream crushing efficiency.", "Maintain strict compliance records for explosive magazine withdrawals."]
        }
    },
    "Drilling": {
        icon: Drill,
        sw: {
            purpose: "Mfumo wa kufuatilia uchorongaji (RC/Blast hole). Inasimamia kina cha mashimo, matumizi ya nondo (rods), na telemetry ya mashine.",
            efficiency: "Inaongeza tija kwa kulinganisha 'Planned vs Actual depth' na kufuatilia muda wa mashine kusimama (Downtime).",
            pro_tips: ["Rekodi 'Penetration Rate' ili kujua ugumu wa miamba na afya ya 'drill bits'.", "Hifadhi taarifa za matengenezo (Service) kuzuia uharibifu mkubwa wa mitambo."]
        },
        en: {
            purpose: "Precision tracking system for RC and Blast-hole drilling operations, monitoring depth accuracy and machine telemetry.",
            efficiency: "Enhances productivity by auditing Planned vs. Actual drilling depth and analyzing machine availability/utilization (UA/MA).",
            pro_tips: ["Monitor penetration rates to assess geological hardness and bit lifecycle wear.", "Execute proactive maintenance requests directly from the drilling field log."]
        }
    },
    "Diamond Drilling": {
        icon: Drill,
        sw: {
            purpose: "Moduli mahususi kwa ajili ya uchorongaji wa 'Core'. Inafuatilia 'Core Recovery', 'RQD', na uwekaji wa alama kwenye masanduku ya 'core'.",
            efficiency: "Inahakikisha ubora wa data za kijiolojia unazingatiwa ili kutoa makadirio sahihi ya rasilimali (Resource Estimation).",
            pro_tips: ["Hakikisha 'Core orientation' imerekodiwa kwa usahihi kwa ajili ya uchambuzi wa miundo.", "Fuatilia matumizi ya maji na kemikali wakati wa uchorongaji."]
        },
        en: {
            purpose: "Advanced interface for diamond core drilling, managing lithological recovery, RQD metrics, and core box logistics.",
            efficiency: "Ensures high-integrity geological data capture, critical for high-confidence resource estimation and modeling.",
            pro_tips: ["Verify core orientation markers regularly to ensure structural analysis accuracy.", "Monitor core loss zones to adjust drilling parameters in complex stratigraphic layers."]
        }
    },
    "Fleet": {
        icon: Truck,
        sw: {
            purpose: "Kituo cha usimamizi wa mitambo na magari mazito (Earthmoving equipment). Inasimamia mafuta, matairi, na saa za kazi (Run hours).",
            efficiency: "Inapunguza gharama za uendeshaji kwa kuhakikisha mitambo inafanyiwa 'Preventive Maintenance' kwa wakati.",
            pro_tips: ["Fuatilia 'Payload' kuzuia kubebesha magari mzigo mkubwa kupita kiasi (Overloading).", "Linganisha matumizi ya mafuta kati ya madereva tofauti kubaini ufanisi."]
        },
        en: {
            purpose: "Logistics hub for heavy earthmoving equipment (HME) management, tracking fuel, tires, and machine service hours.",
            efficiency: "Reduces OPEX through synchronized preventive maintenance scheduling and real-time fleet health monitoring.",
            pro_tips: ["Audit cycles times and payload distribution to optimize haulage lane productivity.", "Analyze fuel burn rates per machine category to identify legacy inefficiencies."]
        }
    },
    "Material Handling": {
        icon: Box,
        sw: {
            purpose: "Inasimamia mzunguko wa madini kutoka shimoni (Pit) kwenda kwenye maghala au mitambo ya uchenjuaji (Processing Plant).",
            efficiency: "Inatoa takwimi sahihi za 'Stockpile' na kuzuia upotevu wa madini wakati wa usafirishaji.",
            pro_tips: ["Tumia ripoti za 'Load count' kuhakikisha tani zinazopelekwa crusher zinalingana na zilizotoka pit.", "Weka alama (Tags) kwa kila stockpile kando ya aina ya mawe (Grade)."]
        },
        en: {
            purpose: "Material flow control system tracking ore movement from the pit face to stockpiles and the processing facility.",
            efficiency: "Ensures accurate stockpile reconciliation and prevents grade dilution during haulage logistics.",
            pro_tips: ["Reconcile load counts against weighed tonnage for true logistical accuracy.", "Implement rigorous stockpile tagging based on lithological grade and source location."]
        }
    },
    "Inventory": {
        icon: Box,
        sw: {
            purpose: "Moduli ya usimamizi wa ghala (Warehouse). Inasimamia ununuzi, utoaji, na uhifadhi wa vifaa vya mgodi.",
            efficiency: "Inahakikisha hakuna kusimama kwa kazi kwa kukosa vifaa ('Out of stock') kupitia 'Minimum Stock Alerts'.",
            pro_tips: ["Fanya 'Periodic Stock Counts' kuhakikisha bidhaa zilizopo stoo zinalingana na mfumo.", "Panga vifaa kwa makundi (Categories) ili kurahisisha utafutaji."]
        },
        en: {
            purpose: "Enterprise Warehouse Management System (WMS) for procurement, distribution, and critical spares control.",
            efficiency: "Eliminates operational downtime by enforcing safety stock levels and automated reorder point alerts.",
            pro_tips: ["Standardize periodic physical stock reconciliation to eliminate inventory shrinkage.", "Leverage ABC analysis to prioritize management of high-value mining consumables."]
        }
    },
    "Geophysics": {
        icon: Map,
        sw: {
            purpose: "Mfumo wa kuhifadhi na kuchambua data za utafiti wa ardhi (Seismic, IP, Mag). Inasaidia kuainisha maeneo mapya yenye madini.",
            efficiency: "Inarahisisha kazi ya wanajiolojia kwa kutoa taswira ya miamba iliyo chini ya ardhi bila kuchimba.",
            pro_tips: ["Hakikisha 'GPS coordinates' za kila kituo cha utafiti zimeingizwa kwa usahihi."]
        },
        en: {
            purpose: "Analytical store for geophysical survey data (Seismic, Induced Polarization, Magnetics) for advanced target generation.",
            efficiency: "Streamlines exploration workflows by providing subterranean lithological visualizations for targeted drilling.",
            pro_tips: ["Strictly validate spatial GPS coordinates for each survey station to ensure grid integrity."]
        }
    },

    "Finance": {
        icon: Landmark,
        sw: {
            purpose: "Mfumo wa uhasibu wa mgodi. Inasimamia Invoices, malipo ya wakandarasi, na mzunguko wa fedha (Cash Flow).",
            efficiency: "Inahakikisha udhibiti wa fedha na kusaidia katika kuandaa ripoti za kodi na faida ya kampuni.",
            pro_tips: ["Kagua ripoti ya 'Aging Invoices' kila wiki ili kudhibiti idadi ya madeni.", "Weka viambatisho vya risiti (E-receipts) kwa kila muamala wa matumizi."]
        },
        en: {
            purpose: "Strategic financial ledger for Capex/Opex tracking, contractor invoicing, and enterprise revenue intelligence.",
            efficiency: "Ensures fiscal compliance and real-time cash flow visibility for executive stakeholders and auditors.",
            pro_tips: ["Audit the Aging Invoice report weekly to minimize outstanding liabilities.", "Attach digital tax-compliant receipts to every expenditure entry for seamless auditing."]
        }
    },
    "Safety": {
        icon: Shield,
        sw: {
            purpose: "Kituo cha usimamizi wa Afya, Usalama na Mazingira (HSSE). Inarekodi ajali na kuzuia hatari mgodini.",
            efficiency: "Inapunguza upotevu wa muda kutokana na majeraha (LTI) na kuimarisha utamaduni wa usalama mahali pa kazi.",
            pro_tips: ["Tumia mbinu ya '5-Why' kuchambua chanzo cha ajali yoyote iliyotokea.", "Fanya ukaguzi (Audit) wa vifaa vya kinga (PPE) kila mwanzo wa shifti."]
        },
        en: {
            purpose: "Health, Safety, Security, and Environment (HSSE) command center for incident reporting and risk mitigation.",
            efficiency: "Minimizes Lost Time Injuries (LTI) and fosters a pro-active zero-harm safety culture within the workforce.",
            pro_tips: ["Utilize the '5-Why' methodology for comprehensive root cause analysis of all safety incidents.", "Execute daily PPE compliance audits to ensure field personnel meet industrial safety standards."]
        }
    },
    "Super Admin": {
        icon: Crown,
        sw: {
            purpose: "Huu ndio moyo wa usimamizi wa mfumo mzima. Unatumika kusajili kampuni, kudhibiti watumiaji, na kuwasha/kuzima moduli.",
            efficiency: "Inatoa mamlaka kamili ya kuona jinsi migodi yote nchini inavyofanya kazi kupitia akaunti moja.",
            pro_tips: ["Kagua 'Subscription logs' kuhakikisha malipo ya wateja yako sawa.", "Tumia 'System Flags' kuwasha vipengele vipya kwa wateja maalum."]
        },
        en: {
            purpose: "Master governance portal for global entity management, multi-tenant provisioning, and platform-wide configuration.",
            efficiency: "Provides centralized oversight of national operations, enabling rapid scaling and cross-entity auditing.",
            pro_tips: ["Audit account provisioning logs to ensure proper entity classification and billing.", "Leverage Dynamic Feature Flags to deploy module-specific updates to strategic clients."]
        }
    },
    "Shimo": {
        icon: Pickaxe,
        sw: {
            purpose: "Daftari la kila siku la uzalishaji wa shimo/duara. Inarekodi idadi ya marumbesa, kina cha shimo, na mche uliopatikana.",
            efficiency: "Inakusaidia kujua ni duara gani linatoa mzigo mwingi na kupanga nguvu kazi kulingana na uzalishaji.",
            pro_tips: ["Rekodi mzigo kila mwisho wa shifti ili kuzuia upotevu wa takwimu.", "Linganisha 'Planned length' na urefu halisi uliopigwa."]
        },
        en: {
            purpose: "Daily operational log for small-scale pit production, tracking bucket counts, depth metrics, and ore yield per shaft.",
            efficiency: "Allows for identification of high-yield shafts and efficient labor allocation based on production velocity.",
            pro_tips: ["Log load counts immediately at shift-end to prevent data leakage.", "Monitor shaft depth daily to maintain safety standards and production targets."]
        }
    },
    "Mauzo": {
        icon: DollarSign,
        sw: {
            purpose: "Moduli ya kufuatilia mapato yanayotokana na uoshaji na uuzaji wa madini sokoni.",
            efficiency: "Inakupa picha kamili ya marumbesa mangapi yameoshwa na gramu ngapi zimepatikana dhidi ya bei ya soko.",
            pro_tips: ["Ingiza bei ya dhahabu ya soko ya siku hiyo ili kupata faida halisi.", "Kagua ripoti ya 'Recovery Rate' kujua kama uoshaji wako una ufanisi."]
        },
        en: {
            purpose: "Revenue tracking module focusing on ore processing (washing) outcomes and final market sales.",
            efficiency: "Provides a complete reconciliation of processed buckets against final gold recovery and market value.",
            pro_tips: ["Apply current market spot prices to calculate real-time net profitability.", "Analyze recovery rate trends to optimize processing and identify possible extraction losses."]
        }
    },
    "Vibarua": {
        icon: Users,
        sw: {
            purpose: "Mfumo wa usimamizi wa wafanyakazi na vibarua mgodini. Unasimamia mahudhurio, mishahara, na mikopo.",
            efficiency: "Inapunguza migogoro ya malipo kwa kuwa na rekodi ya wazi ya siku walizofanya kazi na kazi waliyokamilisha.",
            pro_tips: ["Weka picha ya kibarua kwa usalama na utambulisho rahisi.", "Tumia ripoti ya malipo (Pay-list) wakati wa kutoa mishahara."]
        },
        en: {
            purpose: "Human Resources ledger for artisanal and small-scale mining labor, tracking attendance, payroll, and advances.",
            efficiency: "Eliminates payment disputes by maintaining a transparent immutable record of days worked and tasks completed.",
            pro_tips: ["Maintain a digital registry with photos for enhanced site security and identification.", "Generate the payroll summary weekly to streamline administrative overhead."]
        }
    },
    "Mafuta": {
        icon: Fuel,
        sw: {
            purpose: "Usimamizi wa nishati (Petrol/Diesel). Inarekodi ununuzi wa mafuta na jinsi yanavyotumika kwenye mashine/genereta.",
            efficiency: "Inazuia wizi na upotevu wa mafuta kwa kulinganisha 'Lita zilizotumika' dhidi ya 'Kazi iliyofanyika'.",
            pro_tips: ["Rekodi 'Hour meter' ya genereta/mashine kila wakati mafuta yanapoongezwa.", "Kagua kama kuna kuvuja kwa mafuta ikiwa matumizi yanaongezeka bila sababu."]
        },
        en: {
            purpose: "Energy and fuel logistics management, tracking bulk purchases, inventory storage, and consumption per unit.",
            efficiency: "Prevents fuel shrinkage and identifies mechanical issues by correlating burn rates with machine hour logs.",
            pro_tips: ["Document machine hour-meters at every refueling event for accurate consumption analytics.", "Audit irregular spikes in fuel usage to identify potential theft or engine maintenance needs."]
        }
    }
}

interface ModuleHelpNotebookProps {
    moduleTitle: string;
}

export function ModuleHelpNotebook({ moduleTitle }: ModuleHelpNotebookProps) {
    // Advanced Matching Logic (Case-insensitive keyword search)
    const normalizedTitle = moduleTitle.toLowerCase();
    
    let moduleKey = "General";
    
    if (normalizedTitle.includes("command") || normalizedTitle.includes("super admin")) moduleKey = "Super Admin";
    else if (normalizedTitle.includes("blasting")) moduleKey = "Blasting";
    else if (normalizedTitle.includes("drilling") && !normalizedTitle.includes("diamond")) moduleKey = "Drilling";
    else if (normalizedTitle.includes("diamond") || normalizedTitle.includes("core")) moduleKey = "Diamond Drilling";
    else if (normalizedTitle.includes("fleet") || normalizedTitle.includes("vehicle")) moduleKey = "Fleet";
    else if (normalizedTitle.includes("haulage") || normalizedTitle.includes("material")) moduleKey = "Material Handling";
    else if (normalizedTitle.includes("inventory") || normalizedTitle.includes("ghala") || normalizedTitle.includes("stoo")) moduleKey = "Inventory";
    else if (normalizedTitle.includes("geophysic") || normalizedTitle.includes("ramani")) moduleKey = "Geophysics";

    else if (normalizedTitle.includes("finance") || normalizedTitle.includes("billing") || normalizedTitle.includes("malipo") || normalizedTitle.includes("invoice")) moduleKey = "Finance";
    else if (normalizedTitle.includes("safety") || normalizedTitle.includes("ajali") || normalizedTitle.includes("usalama")) moduleKey = "Safety";
    else if (normalizedTitle.includes("dashbodi") || (normalizedTitle.includes("dashboard") && normalizedTitle.includes("chimbo"))) moduleKey = "Dashboard";
    else if (normalizedTitle.includes("shimo")) moduleKey = "Shimo";
    else if (normalizedTitle.includes("mauzo")) moduleKey = "Mauzo";
    else if (normalizedTitle.includes("vibarua") || normalizedTitle.includes("personnel")) moduleKey = "Vibarua";
    else if (normalizedTitle.includes("mafuta") || normalizedTitle.includes("fuel")) moduleKey = "Mafuta";
    
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
