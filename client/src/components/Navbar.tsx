import React, { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X, User, ShieldCheck } from 'lucide-react'
import Container from './Container'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Consultation', path: '/consultation' },
  { name: 'Courses', path: '/courses' },
  { name: 'Reports', path: '/reports' },
  { name: 'Contact', path: '/contact' },
]

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, admin } = useAuth()

  const toggleMenu = () => setIsOpen((prev) => !prev)
  const closeMenu = () => setIsOpen(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const accountLink = admin ? '/admin' : user ? '/account' : '/login'
  const accountLabel = admin ? 'Dashboard' : user ? 'Account' : 'Login'

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-secondary/10 shadow-sm transition-all duration-200">
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-22 lg:h-24">
          {/* Logo - Full variant (emblem + YugSkills Learning Institute wordmark) across all screen sizes */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center group focus:outline-none py-1.5 shrink min-w-0"
            aria-label="YugSkills Learning Institute Home"
          >
            <Logo
              variant="full"
              className="h-8 min-[360px]:h-9 min-[400px]:h-10 sm:h-12 md:h-14 lg:h-20 w-auto max-w-[200px] min-[360px]:max-w-[230px] sm:max-w-none group-hover:scale-[1.01] transition-transform"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-9 px-1 lg:px-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-[14px] xl:text-[15px] font-semibold tracking-[0.01em] transition-all relative py-1.5 px-1 whitespace-nowrap ${
                    isActive
                      ? 'text-secondary font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-accent after:rounded-full'
                      : 'text-ink/85 hover:text-secondary'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right CTA: Account / Login Option + Book Consultation */}
          <div className="hidden lg:flex items-center gap-3 lg:gap-4 shrink-0">
            <Link
              to={accountLink}
              className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-ink/80 hover:text-secondary px-3.5 py-2 rounded-xl border border-secondary/20 hover:bg-mist/70 transition-all shadow-sm"
              aria-label={accountLabel}
            >
              {admin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-secondary" />
                  <span>{accountLabel}</span>
                </>
              )}
            </Link>

            <Link
              to="/consultation"
              className="inline-flex items-center justify-center text-sm px-5 py-2.5 rounded-full font-semibold bg-cta text-ivory hover:opacity-95 shadow-md active:scale-95 transition-all"
            >
              Book Consultation
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              onClick={toggleMenu}
              aria-label="Toggle Navigation Menu"
              className="p-2 sm:p-2.5 rounded-xl text-primary hover:bg-mist focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden bg-ivory border-b border-secondary/15 px-4 pt-3.5 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Top branding inside mobile drawer */}
          <div className="pb-3 mb-3 border-b border-secondary/10 flex items-center justify-between">
            <div className="flex flex-col">
              <Logo variant="full" className="h-8 sm:h-9 w-auto max-w-[200px]" />
              <span className="text-[10px] tracking-[0.16em] uppercase text-primary font-bold mt-1">
                Astrology • Numerology • Tarot
              </span>
            </div>
            <span className="text-[10px] tracking-widest uppercase text-secondary font-semibold bg-mist px-2.5 py-1 rounded-full">
              Menu
            </span>
          </div>

          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-mist text-secondary font-semibold'
                      : 'text-ink/80 hover:bg-mist/60 hover:text-secondary'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Mobile CTAs: Account / Login Button + Consultation Button */}
            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                to={accountLink}
                onClick={closeMenu}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold bg-mist text-secondary hover:bg-mist/80 transition-colors"
              >
                {admin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Admin Dashboard</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-secondary" />
                    <span>{accountLabel}</span>
                  </>
                )}
              </Link>

              <Link
                to="/consultation"
                onClick={closeMenu}
                className="min-h-[44px] w-full inline-flex items-center justify-center text-sm px-5 py-3 rounded-full font-semibold bg-cta text-ivory hover:opacity-95 shadow-md active:scale-95 transition-all"
              >
                Book Consultation
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
