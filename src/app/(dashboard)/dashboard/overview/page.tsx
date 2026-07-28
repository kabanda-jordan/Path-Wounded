'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart, DollarSign, Truck, Clock, Star, MoreHorizontal } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { useOverview, useTopCarriers, useVehicleBreakdown, useRevenue } from '@/hooks/useQueries'
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/formatters'

const CHART_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8']

export default function OverviewPage() {
  const router = useRouter()
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useOverview()
  const { data: carriersData, isLoading: carriersLoading } = useTopCarriers(5)
  const { data: breakdownData, isLoading: breakdownLoading } = useVehicleBreakdown()
  const { data: revenueData, isLoading: revenueLoading } = useRevenue('30d')

  const stats = overviewData?.data?.data
  const carriers = carriersData?.data?.data || []
  const breakdown = breakdownData?.data?.data || []
  const revenue = revenueData?.data?.data || []

  const statCards = [
    { icon: ShoppingCart, label: 'Total Orders', value: stats?.totalOrders ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: DollarSign, label: 'Total Money Paid', value: stats ? formatCurrency(Number(stats.totalRevenue)) : '$0', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Truck, label: 'Available Couriers', value: stats?.activeCarriers ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Clock, label: 'Hours on the Road', value: stats ? `${stats.avgHoursOnRoad}h` : '0h', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
            <div key={card.label} className="bg-dark-card border border-white/10 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </div>
          ))
        }
      </div>

      {overviewError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400">Failed to load overview data</p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-dark-card border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top Carriers</h3>
            <button onClick={() => router.push('/dashboard/carriers')} className="text-xs text-blue-400 hover:text-blue-300">See All</button>
          </div>
          {carriersLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-white/5">
                    <th className="text-left pb-3 font-medium">Company</th>
                    <th className="text-left pb-3 font-medium">Reviews</th>
                    <th className="text-left pb-3 font-medium">Vehicles</th>
                    <th className="text-left pb-3 font-medium">Partners</th>
                    <th className="text-right pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.map((c: any) => (
                    <tr key={c.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-slate-300">{Number(c.rating).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3"><span className="text-sm text-slate-300">{c._count?.vehicles || c.vehicleCount}</span></td>
                      <td className="py-3"><span className="text-sm text-slate-300">{c._count?.partners || c.partnerCount}</span></td>
                      <td className="py-3 text-right">
                        <button className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-dark-card border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Vehicle Breakdown</h3>
          {breakdownLoading ? (
            <TableSkeleton rows={5} cols={2} />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="percentage"
                      nameKey="type"
                      paddingAngle={3}
                    >
                      {breakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F9FAFB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-2">
                {breakdown.map((item: any, i: number) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs text-slate-300 capitalize">{item.type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs font-medium text-white">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-dark-card border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Average Revenue</h3>
        {revenueLoading ? (
          <TableSkeleton rows={3} cols={7} />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.slice(-14)}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F9FAFB' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
