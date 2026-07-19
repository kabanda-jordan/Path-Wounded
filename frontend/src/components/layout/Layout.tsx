import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 transition-all duration-300">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
