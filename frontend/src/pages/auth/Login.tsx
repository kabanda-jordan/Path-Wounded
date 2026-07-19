import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Boxes, Eye, EyeOff } from 'lucide-react'
import { authApi, setAccessToken } from '../../api/client'
import { useAuthStore } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { toast } from 'sonner'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data: { email: string; password: string }) {
    try {
      const { data: res } = await authApi.login(data)
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      toast.success('Welcome back!')
      navigate('/dashboard/overview')
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Boxes size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your Path Wounded account</p>
        </div>

        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
            <div className="relative">
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" className="rounded border-white/20 bg-white/5" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
