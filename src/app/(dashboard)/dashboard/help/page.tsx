'use client'

import { HelpCircle } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-2xl">
      <div className="bg-dark-card border border-white/10 rounded-2xl p-8 text-center">
        <HelpCircle size={48} className="text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Need Help?</h2>
        <p className="text-sm text-slate-400 mb-6">Contact our support team or check the documentation.</p>
        <div className="flex gap-3 justify-center">
          <a href="#" className="text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-500/5 transition-colors">Documentation</a>
          <a href="#" className="text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-500/5 transition-colors">Contact Support</a>
        </div>
      </div>
    </div>
  )
}
