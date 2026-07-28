'use client'

import { useEffect, useRef, useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import {
  Boxes, ArrowRight, Truck, Globe, Shield, Zap, BarChart3, Users,
  ChevronRight, ChevronDown, Star, CheckCircle2, Menu, X,
  Package, TrendingUp, Play, Quote, Sparkles, Rocket, Clock,
  MapPin, Bell, FileText, Headphones, ArrowUpRight
} from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } }
const slideRight = { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } }
const slideLeft = { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } }

const LOTTIE_URLS = {
  logistics: 'https://lottie.host/39e667f2-d6b1-407a-a713-5d968e3049ae/SsFkMjCi3R.json',
  shipping: 'https://lottie.host/0e1cd8c1-307e-4bc3-87d2-3b0a9a63efb6/IG1nEjKJYV.json',
  dashboard: 'https://lottie.host/c44d4d5c-6964-4813-9e49-3eb8cf1e83da/1iMmbbN4cA.json',
  success: 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-18a836a14af6/dVgQdqnKlO.json',
  logisticsAlt: 'https://lottie.host/7114e3d4-1530-4343-bc28-e76a165a8b88/logistics.json',
}

function useLottieData(url: string) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    let cancelled = false
    fetch(url).then(r => r.json()).then(d => { if (!cancelled) setData(d) }).catch(() => {})
    return () => { cancelled = true }
  }, [url])
  return data
}

function LottieAnim({ url, className = '', loop = true }: { url: string; className?: string; loop?: boolean }) {
  const data = useLottieData(url)
  if (!data) return <div className={`${className} bg-white/5 rounded-2xl animate-pulse`} />
  return (
    <div className={className}>
      <Lottie animationData={data} loop={loop} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

function Marquee({ children, speed = 40, reverse = false, className = '' }: { children: React.ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        <div className="flex shrink-0">{children}{children}</div>
      </motion.div>
    </div>
  )
}

function Dropdown({ trigger, children, align = 'left' }: { trigger: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors duration-200">
        {trigger}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-full mt-2 w-64 bg-dark-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/40 ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DropdownItem({ icon: Icon, label, desc, href }: { icon: any; label: string; desc: string; href: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors duration-200 group">
      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
        <Icon size={16} className="text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Link>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const productItems = [
    { icon: Truck, label: 'Fleet Tracking', desc: 'Real-time GPS across your entire fleet', href: '#features' },
    { icon: BarChart3, label: 'Analytics', desc: 'Revenue, KPIs, and performance data', href: '#features' },
    { icon: Zap, label: 'Automation', desc: 'Automate invoicing and workflows', href: '#features' },
    { icon: Shield, label: 'Security', desc: 'Bank-level encryption and compliance', href: '#features' },
  ]

  const solutionItems = [
    { icon: Package, label: 'For Brokers', desc: 'Manage carriers, orders, and invoicing', href: '#how-it-works' },
    { icon: Truck, label: 'For Carriers', desc: 'Track loads and optimize routes', href: '#how-it-works' },
    { icon: Users, label: 'For Dispatchers', desc: 'Coordinate teams and assignments', href: '#how-it-works' },
    { icon: Globe, label: 'For Enterprises', desc: 'Custom integrations and SLA', href: '#pricing' },
  ]

  const resourceItems = [
    { icon: FileText, label: 'Documentation', desc: 'Guides, API references, and tutorials', href: '#' },
    { icon: Headphones, label: 'Support', desc: '24/7 help from our logistics experts', href: '#' },
    { icon: Bell, label: 'Changelog', desc: 'Latest updates and feature releases', href: '#' },
    { icon: MapPin, label: 'Status', desc: 'System uptime and incident history', href: '#' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-dark/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Rocket size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Velocity</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <Dropdown trigger="Product" align="left">
            {productItems.map(item => (
              <DropdownItem key={item.label} {...item} />
            ))}
          </Dropdown>
          <Dropdown trigger="Solutions" align="left">
            {solutionItems.map(item => (
              <DropdownItem key={item.label} {...item} />
            ))}
          </Dropdown>
          <Dropdown trigger="Resources" align="left">
            {resourceItems.map(item => (
              <DropdownItem key={item.label} {...item} />
            ))}
          </Dropdown>
          <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200">
            Log in
          </Link>
          <Link href="/signup" className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-5 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
            Get Started
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-400 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-dark-surface/95 backdrop-blur-2xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {[
                { label: 'Product', items: productItems },
                { label: 'Solutions', items: solutionItems },
                { label: 'Resources', items: resourceItems },
              ].map(section => (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{section.label}</p>
                  {section.items.map(item => (
                    <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-2 text-sm text-slate-300 hover:text-white">
                      <item.icon size={14} className="text-blue-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <hr className="border-white/10" />
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-blue-400">Get Started Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

function Hero() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  const marqueeWords = [
    'Freight Management', 'Real-Time Tracking', 'Carrier Network', 'Smart Automation',
    'Analytics Dashboard', 'Route Optimization', 'Invoice Processing', 'Team Collaboration',
    'Fleet Visibility', 'Load Planning', 'Compliance Tools', 'Multi-Carrier',
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-dark to-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div style={{ y: y1, opacity }} className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Trusted by 500+ logistics companies</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Move freight at{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              velocity.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed">
            The all-in-one logistics platform that connects brokers, carriers, and dispatchers.
            Automate workflows, track shipments in real-time, and scale your freight operations.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup" className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]">
              Start Free Trial
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="group inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium px-8 py-3.5 rounded-xl transition-all duration-300">
              <Play size={16} className="text-blue-400" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center gap-6 mt-10">
            <div className="flex -space-x-2">
              {['JD', 'MK', 'SR', 'AL'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-dark flex items-center justify-center text-[10px] font-bold text-white">{initials}</div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">4.9/5 from 2,000+ reviews</p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative hidden lg:block">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-2xl" />
          <div className="relative bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-slate-500 ml-2">Velocity Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Active Orders', value: '2,847', color: 'text-blue-400' },
                { label: 'Revenue', value: '$148K', color: 'text-emerald-400' },
                { label: 'Carriers', value: '500+', color: 'text-cyan-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Live Tracking</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '73%' }}
                    transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-medium text-white">73%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">142 of 194 deliveries completed today</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-white/5 rounded-lg p-2.5 flex items-center gap-2">
                <MapPin size={12} className="text-blue-400" />
                <span className="text-[10px] text-slate-400">Chicago, IL → Dallas, TX</span>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2.5">
                <Clock size={12} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function MarqueeStrip() {
  const words = [
    'Freight Management', 'Real-Time Tracking', 'Carrier Network', 'Smart Automation',
    'Analytics Dashboard', 'Route Optimization', 'Invoice Processing', 'Team Collaboration',
    'Fleet Visibility', 'Load Planning', 'Compliance Tools', 'Multi-Carrier',
  ]

  return (
    <section className="py-8 border-y border-white/5 bg-dark-surface/50">
      <Marquee speed={35} className="py-2">
        {words.map((word, i) => (
          <div key={word} className="flex items-center gap-4 mx-4">
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{word}</span>
            <Sparkles size={12} className="text-blue-500/40 flex-shrink-0" />
          </div>
        ))}
      </Marquee>
    </section>
  )
}

function LogoCloud() {
  const companies = [
    { name: 'FedEx', url: 'https://logo.clearbit.com/fedex.com' },
    { name: 'DHL', url: 'https://logo.clearbit.com/dhl.com' },
    { name: 'UPS', url: 'https://logo.clearbit.com/ups.com' },
    { name: 'XPO', url: 'https://logo.clearbit.com/xpo.com' },
    { name: 'J.B. Hunt', url: 'https://logo.clearbit.com/jbhunt.com' },
    { name: 'Werner', url: 'https://logo.clearbit.com/werner.com' },
  ]
  return (
    <section className="py-16 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center text-xs font-medium text-slate-500 uppercase tracking-widest mb-8">
          Powering freight operations for industry leaders
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
          {companies.map((co, i) => (
            <motion.div
              key={co.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={co.url}
                alt={`${co.name} logo`}
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-bold text-slate-500 tracking-tight">${co.name}</span>`
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: Truck, title: 'Real-Time Tracking', desc: 'Track every shipment across your entire fleet. Live GPS updates, ETA predictions, and route optimization.', color: 'from-blue-500 to-blue-700', lottie: LOTTIE_URLS.logisticsAlt },
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Turn raw data into actionable insights. Revenue trends, carrier performance, and operational KPIs.', color: 'from-purple-500 to-purple-700', lottie: LOTTIE_URLS.dashboard },
    { icon: Zap, title: 'Workflow Automation', desc: 'Automate invoicing, notifications, and status updates. Set rules once, let the platform handle the rest.', color: 'from-amber-500 to-orange-700', lottie: LOTTIE_URLS.logistics },
    { icon: Shield, title: 'Secure & Compliant', desc: 'Bank-level encryption, role-based access control, and full audit trails. SOC 2 compliant.', color: 'from-emerald-500 to-emerald-700', lottie: LOTTIE_URLS.success },
    { icon: Globe, title: 'Multi-Carrier Network', desc: 'Connect with 500+ verified carriers. Compare rates, book instantly, and manage all partnerships.', color: 'from-cyan-500 to-cyan-700', lottie: LOTTIE_URLS.logistics },
    { icon: Users, title: 'Team Collaboration', desc: 'Built-in messaging, role-based permissions, and shared dashboards keep your entire team aligned.', color: 'from-pink-500 to-pink-700', lottie: LOTTIE_URLS.dashboard },
  ]

  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">scale your freight</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 max-w-2xl mx-auto text-lg">
            From booking to delivery, Velocity gives you complete visibility and control over your logistics operations.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-dark-card/60 backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-white/15 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <LottieAnim url={f.lottie} className="w-16 h-16 opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Create Your Account', desc: 'Sign up in 60 seconds. No credit card required. Invite your team members and set roles.', lottie: LOTTIE_URLS.dashboard },
    { num: '02', title: 'Connect Carriers', desc: 'Onboard your carrier network or browse our marketplace of 500+ verified partners.', lottie: LOTTIE_URLS.logisticsAlt },
    { num: '03', title: 'Automate & Scale', desc: 'Set up automation rules, track shipments in real-time, and watch your operations run themselves.', lottie: LOTTIE_URLS.logistics },
  ]

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-4">
            Up and running in <span className="text-blue-400">3 simple steps</span>
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-blue-600/50 via-blue-500/30 to-blue-600/50" />
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative inline-flex mb-6">
                <div className="w-20 h-20 rounded-2xl bg-dark-card border border-white/10 flex items-center justify-center relative z-10">
                  <LottieAnim url={s.lottie} className="w-14 h-14" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xs font-bold text-white z-20 shadow-lg shadow-blue-600/30">
                  {s.num}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const stats = [
    { value: 500, suffix: '+', label: 'Carrier Partners', icon: Truck },
    { value: 2, suffix: 'M+', label: 'Shipments Tracked', icon: Package },
    { value: 99, suffix: '.9%', label: 'Uptime SLA', icon: Shield },
    { value: 40, suffix: '%', label: 'Cost Reduction', icon: TrendingUp },
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-dark-card/50 to-dark" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <s.icon size={22} className="text-blue-400" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white mb-1">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-slate-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Testimonials() {
  const [active, setActive] = useState(0)
  const testimonials = [
    { name: 'Sarah Mitchell', role: 'VP Operations, FreightCo', text: 'Velocity transformed our entire operation. We went from managing 50 shipments a week to 500, with the same team. The automation features alone saved us $200K in the first year.', rating: 5, initials: 'SM' },
    { name: 'Marcus Chen', role: 'CEO, Pacific Logistics', text: "The real-time tracking and analytics dashboard give me visibility I never had before. I can make decisions in minutes that used to take hours of phone calls and spreadsheet work.", rating: 5, initials: 'MC' },
    { name: 'Diana Torres', role: 'Fleet Manager, SwiftRoute', text: "The carrier management system is incredible. We onboarded 30 new carriers in a week, compared to the month it used to take. The platform truly understands logistics.", rating: 5, initials: 'DT' },
    { name: 'James Walker', role: 'COO, Horizon Freight', text: "Best investment we've made. Period. The ROI was clear within the first month. Our dispatch team went from overwhelmed to efficient overnight.", rating: 5, initials: 'JW' },
  ]

  useEffect(() => {
    const timer = setInterval(() => setActive(p => (p + 1) % testimonials.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonials" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white">
            Loved by logistics teams
          </motion.h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative bg-dark-card/60 backdrop-blur border border-white/10 rounded-3xl p-8 md:p-12">
            <Quote size={40} className="text-blue-600/20 absolute top-8 left-8" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                <div className="flex items-center gap-1 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-lg md:text-xl text-white leading-relaxed mb-8">&ldquo;{testimonials[active].text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                    {testimonials[active].initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonials[active].name}</p>
                    <p className="text-sm text-slate-400">{testimonials[active].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-blue-500 w-8' : 'bg-white/20 w-2 hover:bg-white/40'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const [annual, setAnnual] = useState(false)
  const plans = [
    {
      name: 'Starter', price: annual ? 0 : 0, period: 'forever',
      desc: 'Perfect for small freight brokers getting started.',
      features: ['Up to 50 orders/month', '3 team members', 'Basic tracking', 'Email support', 'Standard analytics'],
      cta: 'Get Started Free', highlight: false
    },
    {
      name: 'Professional', price: annual ? 79 : 99, period: '/month',
      desc: 'For growing teams that need power and flexibility.',
      features: ['Unlimited orders', '25 team members', 'Real-time GPS tracking', 'Workflow automation', 'Advanced analytics', 'Priority support', 'API access'],
      cta: 'Start Free Trial', highlight: true
    },
    {
      name: 'Enterprise', price: null, period: '',
      desc: 'Custom solutions for large-scale operations.',
      features: ['Unlimited everything', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'On-premise option', 'Custom reporting', 'SSO & SAML'],
      cta: 'Contact Sales', highlight: false
    },
  ]

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg mb-8">
            Start free, upgrade when you&apos;re ready. No hidden fees.
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? 'text-white font-medium' : 'text-slate-400'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${annual ? 'bg-blue-600' : 'bg-white/20'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-white font-medium' : 'text-slate-400'}`}>Annual <span className="text-emerald-400 text-xs font-medium">Save 20%</span></span>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                p.highlight
                  ? 'bg-gradient-to-b from-blue-600/10 to-dark-card border-2 border-blue-500/30 shadow-2xl shadow-blue-600/10'
                  : 'bg-dark-card/60 border border-white/10 hover:border-white/20'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-lg shadow-blue-600/30">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-sm text-slate-400 mb-6">{p.desc}</p>
              <div className="mb-6">
                {p.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${p.price}</span>
                    <span className="text-slate-400">{p.period}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-white">Custom</div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full text-center py-3 rounded-xl font-medium transition-all duration-300 ${
                  p.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-900/50 rounded-full blur-3xl" />
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <LottieAnim url={LOTTIE_URLS.logisticsAlt} className="w-24 h-24 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to move at velocity?
            </h2>
            <p className="text-blue-100/80 text-lg max-w-xl mx-auto mb-8">
              Join 500+ companies already using Velocity to streamline their freight operations. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="group inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-xl shadow-black/10 hover:scale-[1.02]">
                Start Free Trial
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 text-white/90 font-medium px-8 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300">
                Schedule Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  const columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'API', 'Changelog'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
    { title: 'Resources', links: ['Documentation', 'Help Center', 'Status', 'Security', 'Terms'] },
    { title: 'Legal', links: ['Privacy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
  ]

  return (
    <footer className="border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Rocket size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Velocity</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-4">
              The modern logistics platform for freight brokers, carriers, and dispatchers.
            </p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
              <span className="text-xs text-slate-500 ml-1">4.9/5</span>
            </div>
          </div>

          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; 2026 Velocity. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {['Twitter', 'GitHub', 'LinkedIn', 'Discord'].map(s => (
              <a key={s} href="#" className="text-xs text-slate-500 hover:text-white transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <Navbar />
      <Hero />
      <MarqueeStrip />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
