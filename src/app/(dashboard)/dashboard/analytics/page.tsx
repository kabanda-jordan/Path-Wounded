'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useRevenue, useVehicleBreakdown, useOrderStatusBreakdown } from '@/hooks/useQueries'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/formatters'
import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { miscApi } from '@/api/client'

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8']

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')
  const { data: revenue, isLoading: revenueLoading } = useRevenue(range)
  const { data: breakdown, isLoading: breakdownLoading } = useVehicleBreakdown()
  const { data: statusData, isLoading: statusLoading } = useOrderStatusBreakdown()

  const revenueArr = revenue?.data?.data || []
  const vehicleData = breakdown?.data?.data || []
  const statusBreakdown = statusData?.data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Revenue Over Time</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
            {['7d', '30d', '90d'].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${range === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => miscApi.reporting.exportCarriersCsv()}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-dark-card border border-white/10 rounded-2xl p-5">
        {revenueLoading ? <TableSkeleton rows={3} cols={7} /> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueArr}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F9FAFB' }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), String(name)]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-dark-card border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Vehicle Distribution</h3>
          {breakdownLoading ? <TableSkeleton rows={5} cols={2} /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vehicleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="percentage" nameKey="type" paddingAngle={3}>
                    {vehicleData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F9FAFB' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-dark-card border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Order Status Distribution</h3>
          {statusLoading ? <TableSkeleton rows={5} cols={2} /> : (
            <div className="space-y-3">
              {statusBreakdown.map((s: any) => (
                <div key={s.status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-300 capitalize">{s.status.replace('_', ' ')}</span>
                    <span className="text-xs font-medium text-white">{s.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
