import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Boxes, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api/client'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { toast } from 'sonner'

const schema = z.object({
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/\d/, 'Password must include a number')
    .regex(/[@$!%*?&#]/, 'Password must include a special character (@$!%*?&#)'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function Signup() {
  const [submitted, setSubmitted] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: any) {
    try {
      const { confirmPassword: _, ...payload } = data
      await authApi.signup(payload)
      setSubmitted(true)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Signup failed'
      const details = err.response?.data?.error?.details
      toast.error(msg + (details ? `: ${details.join(', ')}` : ''))
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 mb-6">We've sent a verification link to your email address. Please verify to continue.</p>
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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Join Path Wounded today</p>
        </div>

        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Company Name" placeholder="Acme Inc." {...register('companyName')} />
            <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
            <div className="relative">
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <p className="text-[11px] text-slate-500 mt-1">Uppercase, lowercase, number, and special character (@$!%*?&#)</p>
            </div>
            <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
