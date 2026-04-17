"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    TrendingUp, TrendingDown, DollarSign, Wallet,
    PieChart, ArrowUpRight, ArrowDownRight, AlertCircle,
    Filter, Download, Plus, Receipt, Box
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ExpenseTrackerProps {
    expenses: any[]
    totalRevenue: number
}

export function ExpenseTracker({ expenses, totalRevenue }: ExpenseTrackerProps) {
    const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses])
    const netProfit = totalRevenue - totalExpenses
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Dynamically derive top cost drivers to ensure NO cost is left out
    const topCostDrivers = useMemo(() => {
        const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))
        return categories.map(cat => {
            const val = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0)
            return {
                name: cat,
                amount: val,
                percentage: totalExpenses > 0 ? (val / totalExpenses) * 100 : 0
            }
        }).sort((a, b) => b.amount - a.amount).slice(0, 5)
    }, [expenses, totalExpenses])

    return (
        <div className="space-y-8">
            {/* Executive Financial Summary */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Operating Revenue</p>
                                <h3 className="text-2xl font-black mt-1">TZS {totalRevenue.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-white/10 rounded-xl"><ArrowUpRight className="text-emerald-400" /></div>
                        </div>
                        <Box className="absolute -bottom-6 -right-6 w-24 h-24 opacity-10" />
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Actual Cost</p>
                                <h3 className="text-2xl font-black mt-1 text-red-600">TZS {totalExpenses.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-xl"><ArrowDownRight className="text-red-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">EBITDA (Profit)</p>
                                <h3 className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    TZS {netProfit.toLocaleString()}
                                </h3>
                            </div>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl"><Wallet className="text-emerald-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-amber-500 text-white overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-80">Operating Margin</p>
                                <h3 className="text-2xl font-black mt-1">{margin.toFixed(1)}%</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-xl"><TrendingUp className="text-white" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Distribution & Trends */}
            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Expense Velocity</CardTitle>
                            <p className="text-xs text-muted-foreground">Rolling cost aggregation across all mining phases</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-2">
                            <Download className="w-3 h-3 mr-2" /> Export Ledger
                        </Button>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={expenses}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="log_date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="url(#colorCost)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl rounded-[2.5rem]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Top Cost Drivers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {['fuel', 'explosives', 'labor', 'maintenance'].map((cat) => {
                            const val = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
                            const percent = (val / totalExpenses) * 100
                            return (
                                <div key={cat} className="space-y-2">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span>{cat}</span>
                                        <span className="text-slate-400">{percent.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}