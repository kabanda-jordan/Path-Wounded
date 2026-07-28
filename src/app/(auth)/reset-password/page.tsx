'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Boxes, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const [done, setDone] = useState(false)
  const token = searchParams.get('token') || ''
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: { password: string }) {
    try {
      await authApi.resetPassword(token, data.password)
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Reset failed')
    }
  }

  if (done) {
    return (
      <div className="text-center max-w-sm">
        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Password reset!</h1>
        <p className="text-slate-400 mb-6">Your password has been updated.</p>
        <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
          <Boxes size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset password</h1>
      </div>
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="New Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
