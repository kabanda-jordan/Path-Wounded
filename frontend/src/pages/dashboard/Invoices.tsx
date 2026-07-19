import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { useInvoices } from '../../hooks/useQueries'
import { invoicesApi } from '../../api/invoices'
import { TableSkeleton } from '../../components/ui/Skeleton'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../lib/formatters'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = { paid: 'success', unpaid: 'warning', overdue: 'danger' }
const statusIcon: Record<string, any> = { paid: CheckCircle, unpaid: Clock, overdue: AlertTriangle }

export default function Invoices() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const params: Record<string, string> = { page: String(page), limit: '10' }
  if (statusFilter) params.status = statusFilter

  const { data, isLoading } = useInvoices(params)
  const invoices = data?.data?.data || []
  const meta = data?.data?.meta

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.markPaid(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice marked as paid') },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {isLoading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-5 py-3 font-medium">Invoice</th>
                  <th className="text-left px-5 py-3 font-medium">Order</th>
                  <th className="text-left px-5 py-3 font-medium">Carrier</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Due Date</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const Icon = statusIcon[inv.status]
                  return (
                    <tr key={inv.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-sm text-slate-300 font-mono">{inv.id.slice(0, 8)}</td>
                      <td className="px-5 py-3.5 text-sm text-blue-400">{inv.order?.orderNumber || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">{inv.carrier?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{formatCurrency(Number(inv.amount))}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariant[inv.status]} className="flex items-center gap-1 w-fit">
                          <Icon size={12} /> {inv.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {inv.status !== 'paid' && (
                          <button onClick={() => markPaidMutation.mutate(inv.id)} className="text-xs text-emerald-400 hover:text-emerald-300">Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {invoices.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No invoices</td></tr>}
              </tbody>
            </table>
          </div>
          {meta && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
                <Button variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
