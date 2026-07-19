import { useState } from 'react'
import { useMessages } from '../../hooks/useQueries'
import { messagesApi } from '../../api/misc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, MessageSquare } from 'lucide-react'
import { formatDateTime } from '../../lib/formatters'
import Button from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'

export default function Messages() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useMessages()
  const threads = data?.data?.data || []
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  useMutation({
    mutationFn: (d: { recipientId: string; body: string; threadId?: string }) => messagesApi.send(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messages'] }); setNewMessage(''); toast.success('Message sent') },
  })

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
      <div className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Inbox</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? <div className="p-4"><TableSkeleton rows={5} cols={1} /></div> : (
            threads.map((t: any) => (
              <button
                key={t.threadId}
                onClick={() => setSelectedThread(t.threadId)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedThread === t.threadId ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400 flex-shrink-0">
                    {t.sender?.fullName?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{t.sender?.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{t.body}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">{formatDateTime(t.createdAt)}</span>
                </div>
              </button>
            ))
          )}
          {threads.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No messages yet</p>}
        </div>
      </div>

      <div className="lg:col-span-2 bg-dark-card border border-white/10 rounded-2xl flex flex-col">
        {selectedThread ? (
          <>
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-center text-xs text-slate-500 mb-6">Start of conversation</p>
            </div>
            <div className="p-4 border-t border-white/5 flex items-center gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    setNewMessage('')
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <Button size="sm"><Send size={14} /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
