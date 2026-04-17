import { DashboardHeader } from "@/components/dashboard-header"
import { BlastingBudgetForm } from "@/components/blasting/blasting-budget-form"

export default function BlastingBudgetPage() {
  return (
    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/30 p-8 space-y-8">
      <DashboardHeader 
        title="Fiscal Authorization" 
        description="Configure blast-specific budget allocation and unit cost projections." 
      />
      <BlastingBudgetForm />
    </div>
  )
}
