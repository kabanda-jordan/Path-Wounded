import { useAutomations } from '../../hooks/useQueries'
import { automationsApi } from '../../api/misc'
import { TableSkeleton } from '../../components/ui/Skeleton'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Plus, Zap, ArrowRight, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const createSchema = z.object({ name: z.string().min(1), triggerType: z.string().min(1), actionType: z.string().min(1) })

export default function Automations() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useAutomations()
  const automations = data?.data?.data || []
  const [showCreate, setShowCreate] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: (id: string) => automationsApi.toggle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automation updated') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automation deleted') },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} size="sm"><Plus size={16} /> New Rule</Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="space-y-3">
          {automations.map((a: any) => (
            <div key={a.id} className="bg-dark-card border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Zap size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{a.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="capitalize">{a.triggerType.replace(/_/g, ' ')}</span>
                    <ArrowRight size={12} />
                    <span className="capitalize">{a.actionType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={a.isActive ? 'success' : 'default'}>{a.isActive ? 'Active' : 'Paused'}</Badge>
                <button onClick={() => toggleMutation.mutate(a.id)} className={`relative w-10 h-5 rounded-full transition-colors ${a.isActive ? 'bg-blue-600' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${a.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <button onClick={() => deleteMutation.mutate(a.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {automations.length === 0 && (
            <div className="bg-dark-card border border-white/10 rounded-2xl p-12 text-center text-sm text-slate-400">
              No automation rules yet. Create one to get started.
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Automation Rule">
        <CreateAutomationForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}

function CreateAutomationForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(createSchema) })
  const createMutation = useMutation({
    mutationFn: (d: any) => automationsApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); onClose(); toast.success('Automation created') },
  })

  return (
    <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
      <Input label="Rule Name" placeholder="e.g. Auto-invoice on delivery" error={errors.name?.message} {...register('name')} />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Trigger</label>
        <select {...register('triggerType')} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50">
          <option value="">Select trigger</option>
          <option value="order_delivered">Order Delivered</option>
          <option value="order_created">Order Created</option>
          <option value="order_cancelled">Order Cancelled</option>
          <option value="invoice_overdue">Invoice Overdue</option>
          <option value="payment_received">Payment Received</option>
        </select>
        {errors.triggerType && <p className="text-xs text-red-400 mt-1">{errors.triggerType.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Action</label>
        <select {...register('actionType')} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50">
          <option value="">Select action</option>
          <option value="send_email">Send Email</option>
          <option value="send_notification">Send Notification</option>
          <option value="create_invoice">Create Invoice</option>
          <option value="update_status">Update Status</option>
          <option value="send_message">Send Message</option>
        </select>
        {errors.actionType && <p className="text-xs text-red-400 mt-1">{errors.actionType.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Rule'}</Button>
    </form>
  )
}
