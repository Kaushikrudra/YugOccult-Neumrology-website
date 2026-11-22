import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BookMarked,
  MessageSquare,
  ShoppingBag,
  Quote,
  Calendar,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  SlidersHorizontal,
  Globe,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo'

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Enforce noindex, nofollow for all administrative pages
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    const hadExistingMeta = !!metaRobots

    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.name = 'robots'
      document.head.appendChild(metaRobots)
    }

    const previousContent = metaRobots.getAttribute('content') || ''
    metaRobots.setAttribute('content', 'noindex, nofollow')

    return () => {
      if (hadExistingMeta) {
        metaRobots?.setAttribute('content', previousContent)
      } else {
        metaRobots?.remove()
      }
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Clients', path: '/admin/students', icon: GraduationCap, end: false },
    { name: 'Courses CMS', path: '/admin/courses', icon: BookOpen, end: false },
    { name: 'Ebooks', path: '/admin/ebooks', icon: BookMarked, end: false },
    { name: 'Reports CMS', path: '/admin/reports', icon: FileText, end: false },
    { name: 'Report Orders', path: '/admin/report-orders', icon: ClipboardList, end: false },
    { name: 'Testimonials', path: '/admin/testimonials', icon: Quote, end: false },
    { name: 'Bookings', path: '/admin/bookings', icon: Calendar, end: false },
    { name: 'Consultation', path: '/admin/consultation', icon: Calendar, end: false },
    { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare, end: false },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, end: false },
    { name: 'Site Settings', path: '/admin/site-settings', icon: SlidersHorizontal, end: false },
  ]

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#2B2A3D] flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#2E2A5C] text-[#FBF7EE] border-b border-[#C9A227]/30 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Logo variant="light" className="h-7 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
            Admin Portal
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-white/10 text-[#FBF7EE] focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#2E2A5C]/95 flex flex-col pt-16 px-6 pb-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-[#FBF7EE] hover:bg-white/10 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C9A227] uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticated as {admin?.email}</span>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-[#C9A227] text-[#2E2A5C] font-semibold shadow-sm'
                      : 'text-[#EFEAF8] hover:bg-white/10'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="space-y-2 pt-3 border-t border-white/10 mt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF7EE] text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
            >
              <Globe className="w-4 h-4 text-[#C9A227]" />
              <span>View Website</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF7EE] text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#2E2A5C] text-[#FBF7EE] border-r border-[#C9A227]/20 shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex flex-col gap-2">
          <Logo variant="light" className="h-10 w-auto" />
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#C9A227]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#C9A227] text-[#2E2A5C] font-semibold shadow-md'
                    : 'text-[#EFEAF8] hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Button */}
        <div className="p-4 border-t border-white/10 bg-[#25224A]/60">
          <div className="flex items-center justify-between mb-3">
            <div className="overflow-hidden pr-2">
              <p className="text-[11px] text-[#EFEAF8]/60 uppercase tracking-wider font-semibold">
                Signed In
              </p>
              <p className="text-xs font-medium text-[#FBF7EE] truncate" title={admin?.email}>
                {admin?.email}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#FBF7EE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
              title="Return to public website"
            >
              <Globe className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>View Website</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-semibold text-[#FBF7EE]/80 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-[#5B3E96]/10 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-medium text-[#2B2A3D]/70">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#2E2A5C] font-semibold capitalize">Yug Skill Institute Portal</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5B3E96] bg-[#EFEAF8] hover:bg-[#E2D9F3] border border-[#5B3E96]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5B3E96]/40"
              title="View public website"
            >
              <Globe className="w-3.5 h-3.5 text-[#5B3E96]" />
              <span>View Website</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A227]" />
              <span className="text-[#2B2A3D]/70">Secure Admin Session</span>
              <span className="px-2.5 py-1 rounded-full bg-[#EFEAF8] text-[#5B3E96] font-medium border border-[#5B3E96]/20">
                {admin?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Routed Admin Subpages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
