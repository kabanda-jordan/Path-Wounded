'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { authApi } from '@/api/client'
import { CheckCircle2, XCircle } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [searchParams])

  return (
    <div className="text-center max-w-sm">
      {status === 'loading' && <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />}
      {status === 'success' && (
        <>
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Email verified!</h1>
          <p className="text-slate-400 mb-6">Your email has been verified. You can now sign in.</p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
          <p className="text-slate-400 mb-6">The link is invalid or has expired.</p>
        </>
      )}
      <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">Go to login</Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
