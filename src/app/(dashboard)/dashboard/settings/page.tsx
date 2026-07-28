'use client'

import { useState, useRef } from 'react'
import { useAuthStore } from '@/context/AuthContext'
import { miscApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, User, Lock } from 'lucide-react'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const profileMutation = useMutation({
    mutationFn: (d: { fullName?: string; companyName?: string }) => miscApi.users.updateProfile(d),
    onSuccess: (res) => { setUser(res.data.data); toast.success('Profile updated') },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed'),
  })

  const passwordMutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => miscApi.users.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); setPwdForm({ currentPassword: '', newPassword: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => miscApi.users.uploadAvatar(file),
    onSuccess: (res) => { setUser({ ...user!, avatarUrl: res.data.data.avatarUrl }); toast.success('Avatar updated') },
  })

  const [nameForm, setNameForm] = useState({ fullName: user?.fullName || '', companyName: user?.companyName || '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><User size={16} /> Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white">
              {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" /> : user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) avatarMutation.mutate(e.target.files[0]) }} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(nameForm) }} className="space-y-4">
          <Input label="Full Name" defaultValue={user?.fullName} onChange={(e) => setNameForm(f => ({ ...f, fullName: e.target.value }))} />
          <Input label="Company" defaultValue={user?.companyName || ''} onChange={(e) => setNameForm(f => ({ ...f, companyName: e.target.value }))} />
          <Input label="Email" value={user?.email || ''} disabled />
          <Button type="submit" size="sm" disabled={profileMutation.isPending}>{profileMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
        </form>
      </div>

      <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
        <form onSubmit={(e) => { e.preventDefault(); passwordMutation.mutate(pwdForm) }} className="space-y-4">
          <Input label="Current Password" type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} />
          <Input label="New Password" type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} />
          <Button type="submit" size="sm" disabled={passwordMutation.isPending}>{passwordMutation.isPending ? 'Changing...' : 'Change Password'}</Button>
        </form>
      </div>
    </div>
  )
}
