// app/geophysics/execution/[id]/page.tsx - CREATE THIS
import { GeophysicsExecutionForm } from "@/components/geophysics/geophysics-execution-form"

export default function GeophysicsExecutionPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <GeophysicsExecutionForm operationId={params.id} />
    </div>
  )
}