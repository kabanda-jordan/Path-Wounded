'use client'

import { useState } from 'react'
import { Search, Star, MapPin, Truck, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useCarriers } from '@/hooks/useQueries'
import { carrierApi } from '@/api/client'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/formatters'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const createSchema = z.object({ name: z.string().min(1), location: z.string().optional() })

export default function CarriersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const params: Record<string, string> = { page: String(page), limit: '10' }
  if (search) params.search = search

  const { data, isLoading } = useCarriers(params)
  const carriers = data?.data?.data || []
  const meta = data?.data?.meta

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search carriers..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"><Plus size={16} /> Add Carrier</Button>
      </div>

      {isLoading ? <TableSkeleton rows={8} cols={5} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {carriers.map((c: any) => (
            <div key={c.id} className="bg-dark-card border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                    {c.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-500" />
                        <span className="text-[11px] text-slate-400">{c.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge>
              </div>

              <div className="flex items-center gap-1 mb-3">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-white">{Number(c.rating).toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><Truck size={13} /> {c._count?.vehicles || c.vehicleCount} vehicles</div>
                <div className="flex items-center gap-1"><Users size={13} /> {c._count?.partners || c.partnerCount} partners</div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
                Created {formatDate(c.createdAt)}
              </div>
            </div>
          ))}
          {carriers.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-slate-400">No carriers found</div>
          )}
        </div>
      )}

      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
            <Button variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Carrier">
        <CreateCarrierForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}

function CreateCarrierForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(createSchema) })
  const createMutation = useMutation({
    mutationFn: (d: any) => carrierApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carriers'] }); onClose(); toast.success('Carrier created') },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
      <Input label="Carrier Name" placeholder="Acme Logistics" error={errors.name?.message} {...register('name')} />
      <Input label="Location" placeholder="City, State" {...register('location')} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Add Carrier'}</Button>
    </form>
  )
}
