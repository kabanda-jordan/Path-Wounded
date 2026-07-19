import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Boxes, CheckCircle2 } from 'lucide-react'
import { authApi } from '../../api/client'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const schema = z.object({ email: z.string().email() })

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: { email: string }) {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 mb-6">If an account exists with that email, we've sent a password reset link.</p>
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Boxes size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your email and we'll send you a reset link</p>
        </div>
        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
