import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Instagram, Youtube, Facebook, Linkedin, Clock } from 'lucide-react'
import Container from './Container'
import Logo from './Logo'
import { useSiteSettings } from '../context/SiteSettingsContext'

export const Footer: React.FC = () => {
  const { settings } = useSiteSettings()
  const social = settings.social_links || {}
  const hasSocial = Boolean(
    social.instagram || social.youtube || social.facebook || social.linkedin
  )
  const hasAnyContact = Boolean(
    settings.address || settings.phone || settings.email || settings.timings
  )

  return (
    <footer className="bg-primary text-ivory pt-12 sm:pt-16 pb-8 sm:pb-10 border-t border-secondary/40">
      <Container>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            hasAnyContact ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          } gap-8 lg:gap-10 mb-8 sm:mb-12`}
        >
          {/* Brand info */}
          <div className="space-y-3.5 sm:space-y-4">
            <div>
              <Link to="/" className="inline-block" aria-label="YugOccult Learning Academy Home">
                <Logo
                  variant="light"
                  className="h-14 sm:h-18 md:h-20 w-auto mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform"
                />
              </Link>
              <p className="text-accent text-[11px] sm:text-xs tracking-[0.2em] uppercase font-bold">
                ASTROLOGY • NUMEROLOGY • TAROT
              </p>
            </div>
            <p className="text-ivory/80 text-xs sm:text-sm leading-relaxed">
              Empowering your journey with Vedic astrology, numerological insights, and transformational sacred wisdom.
            </p>
            {/* Social Icons (Rendered only when URLs are configured) */}
            {hasSocial && (
              <div className="flex items-center gap-3 pt-1 sm:pt-2">
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary text-accent hover:text-ivory flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {social.youtube && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary text-accent hover:text-ivory flex items-center justify-center transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary text-accent hover:text-ivory flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {social.linkedin && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary text-accent hover:text-ivory flex items-center justify-center transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  to="/"
                  className="text-ivory/80 hover:text-accent transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/consultation"
                  className="text-ivory/80 hover:text-accent transition-colors"
                >
                  Consultation & About
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-ivory/80 hover:text-accent transition-colors"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/reports"
                  className="text-ivory/80 hover:text-accent transition-colors"
                >
                  Personalised Reports
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-ivory/80 hover:text-accent transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services & Offerings Placeholder */}
          <div>
            <h4 className="font-heading text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4">
              Offerings
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-ivory/80">
              <li>Kundali & Birth Chart Analysis</li>
              <li>Vedic Numerology Blueprint</li>
              <li>Career & Relationship Guidance</li>
              <li>Certified Astrological Courses</li>
              <li>Gemstone & Yantra Remedies</li>
            </ul>
          </div>

          {/* Contact info (Rendered only if at least one contact item exists) */}
          {hasAnyContact && (
            <div>
              <h4 className="font-heading text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4">
                Contact Info
              </h4>
              <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-ivory/80">
                {settings.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{settings.address}</span>
                  </li>
                )}
                {settings.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-accent shrink-0" />
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="hover:text-accent transition-colors"
                    >
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-accent shrink-0" />
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:text-accent transition-colors"
                    >
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings.timings && (
                  <li className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{settings.timings}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 sm:pt-8 border-t border-secondary/30 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory/60 gap-3 sm:gap-4 text-center sm:text-left">
          <p>© 2026 YugOccult Learning Academy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-accent transition-colors">
              Portal Login
            </Link>
            <span className="text-ivory/30">•</span>
            <p className="text-ivory/50">Designed with Spiritual Wisdom & Elegance</p>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
