import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Boxes, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { authApi, setAccessToken } from '../../api/client'
import { useAuthStore } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { toast } from 'sonner'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [pendingToken, setPendingToken] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) })

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [step])

  async function onLoginSubmit(data: { email: string; password: string }) {
    try {
      const { data: res } = await authApi.login(data)
      if (res.data.requiresOtp) {
        setPendingToken(res.data.pendingToken)
        setUserEmail(res.data.email)
        setStep('otp')
        setCountdown(60)
        toast.success('Verification code sent to your email')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed')
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    setOtpError('')

    // Auto-advance
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 8 digits are entered
    if (value && index === 7) {
      const fullCode = newDigits.join('')
      if (fullCode.length === 8) {
        verifyOtpCode(fullCode)
      }
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newDigits = [...otpDigits]
      newDigits[index - 1] = ''
      setOtpDigits(newDigits)
    }
    if (e.key === 'Enter') {
      const fullCode = otpDigits.join('')
      if (fullCode.length === 8) {
        verifyOtpCode(fullCode)
      }
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pasted.length === 0) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 8; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)

    const focusIndex = Math.min(pasted.length, 7)
    inputRefs.current[focusIndex]?.focus()

    if (pasted.length === 8) {
      verifyOtpCode(pasted)
    }
  }

  async function verifyOtpCode(code: string) {
    setIsVerifying(true)
    try {
      const { data: res } = await authApi.verifyOtp({ pendingToken, code })
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      toast.success('Welcome back!')
      navigate('/dashboard/overview')
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Invalid code'
      setOtpError(message)
      toast.error(message)
      // Clear OTP on error
      setOtpDigits(['', '', '', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    try {
      await authApi.resendOtp({ pendingToken })
      setCountdown(60)
      setOtpDigits(['', '', '', '', '', '', '', ''])
      setOtpError('')
      inputRefs.current[0]?.focus()
      toast.success('New verification code sent')
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  function handleBackToLogin() {
    setStep('login')
    setPendingToken('')
    setUserEmail('')
    setOtpDigits(['', '', '', '', '', '', '', ''])
    setOtpError('')
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            {step === 'otp' ? <ShieldCheck size={24} className="text-white" /> : <Boxes size={24} className="text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 'otp' ? 'Two-Factor Authentication' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'otp'
              ? `Enter the 8-digit code sent to ${userEmail}`
              : 'Sign in to your Path Wounded account'}
          </p>
        </div>

        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          {step === 'login' ? (
            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
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
          ) : (
            <div className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Verification Code</label>
                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      disabled={isVerifying}
                      className="w-10 h-12 text-center text-lg font-bold text-white bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>
                {otpError && <p className="mt-2 text-xs text-red-400 text-center">{otpError}</p>}
              </div>

              {/* Loading state */}
              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying code...</span>
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-400">
                    Resend code in <span className="text-white font-medium">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend code'}
                  </button>
                )}
              </div>

              {/* Back to login */}
              <button
                onClick={handleBackToLogin}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                Back to login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
