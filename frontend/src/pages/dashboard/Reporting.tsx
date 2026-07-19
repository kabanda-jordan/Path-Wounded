import { useQuery } from '@tanstack/react-query'
import { reportingApi } from '../../api/misc'
import { TableSkeleton } from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import { Download, Star } from 'lucide-react'

export default function Reporting() {
  const { data, isLoading } = useQuery({
    queryKey: ['reporting', 'carriers'],
    queryFn: () => reportingApi.carrierPerformance(),
  })

  const report = data?.data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => reportingApi.exportCarriersCsv()}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-5 py-3 font-medium">Carrier</th>
                  <th className="text-left px-5 py-3 font-medium">Rating</th>
                  <th className="text-left px-5 py-3 font-medium">Orders</th>
                  <th className="text-left px-5 py-3 font-medium">Revenue</th>
                  <th className="text-left px-5 py-3 font-medium">Avg Hours</th>
                  <th className="text-left px-5 py-3 font-medium">Vehicles</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">{r.name.charAt(0)}</div>
                        <span className="text-sm font-medium text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" /><span className="text-sm text-slate-300">{Number(r.rating).toFixed(1)}</span></div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{r.deliveredOrders}/{r.totalOrders}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-white">${Number(r.totalRevenue).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{r.avgHoursOnRoad}h</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{r.vehicleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
