import { useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useOrders } from '../../hooks/useQueries'
import { ordersApi } from '../../api/orders'
import { TableSkeleton } from '../../components/ui/Skeleton'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { formatDate, formatCurrency } from '../../lib/formatters'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  pending: 'warning', assigned: 'info', in_transit: 'info', delivered: 'success', cancelled: 'danger',
}

const createSchema = z.object({
  originAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  amountPaid: z.coerce.number().min(0).optional(),
})

export default function Orders() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const params: Record<string, string> = { page: String(page), limit: '10' }
  if (statusFilter) params.status = statusFilter
  if (search) params.search = search

  const { data, isLoading } = useOrders(params)
  const orders = data?.data?.data || []
  const meta = data?.data?.meta

  const createMutation = useMutation({
    mutationFn: (d: any) => ordersApi.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setShowCreate(false)
      toast.success('Order created')
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled')
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search orders..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"><Plus size={16} /> New Order</Button>
      </div>

      {isLoading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-5 py-3 font-medium">Order #</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Origin</th>
                  <th className="text-left px-5 py-3 font-medium">Destination</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-blue-400">{o.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant[o.status]}>{o.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 max-w-[200px] truncate">{o.originAddress}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 max-w-[200px] truncate">{o.destinationAddress}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-white">{formatCurrency(Number(o.amountPaid))}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {o.status !== 'cancelled' && o.status !== 'delivered' && (
                        <button onClick={() => cancelMutation.mutate(o.id)} className="text-xs text-red-400 hover:text-red-300">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
                <Button variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Order">
        <CreateOrderForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
      </Modal>
    </div>
  )
}

function CreateOrderForm({ onSubmit, isLoading }: { onSubmit: (d: any) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(createSchema) })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Origin Address" placeholder="123 Main St, City, State" error={errors.originAddress?.message} {...register('originAddress')} />
      <Input label="Destination Address" placeholder="456 Oak Ave, City, State" error={errors.destinationAddress?.message} {...register('destinationAddress')} />
      <Input label="Amount ($)" type="number" placeholder="0.00" {...register('amountPaid')} />
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Order'}</Button>
    </form>
  )
}
