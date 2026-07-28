'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Rocket, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { authApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  role: z.enum(['broker', 'admin'], { required_error: 'Please select a role' }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/\d/, 'Password must include a number')
    .regex(/[@$!%*?&#]/, 'Password must include a special character (@$!%*?&#)'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function SignupPage() {
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
      toast.error(msg)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Account created!</h1>
          <p className="text-slate-400 mb-6">Welcome to Velocity! A confirmation email has been sent to your inbox. You can now sign in.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Rocket size={20} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Join Velocity today</p>
        </div>

        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Company Name (optional)" placeholder="Acme Inc." {...register('companyName')} />
            <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input type="radio" value="broker" {...register('role')} className="peer sr-only" />
                  <div className="border border-white/10 rounded-xl p-3 text-center transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 hover:border-white/20">
                    <p className="text-sm font-medium text-white">Broker</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Manage carriers & orders</p>
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input type="radio" value="admin" {...register('role')} className="peer sr-only" />
                  <div className="border border-white/10 rounded-xl p-3 text-center transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 hover:border-white/20">
                    <p className="text-sm font-medium text-white">Admin</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Full platform access</p>
                  </div>
                </label>
              </div>
              {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
            </div>

            <div className="relative">
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <p className="text-[11px] text-slate-500 mt-1">Uppercase, lowercase, number, and special character (@$!%*?&amp;#)</p>
            </div>
            <Input label="Confirm Password" type="password" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
