import { Link } from 'react-router-dom'
import { Home, BookOpen, Compass } from 'lucide-react'
import { usePageMeta } from '../lib/usePageMeta'

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The requested page could not be found on YugOccult Learning Academy.',
    noindex: true,
  })

  return (
    <main className="min-h-[75vh] bg-[#FBF7EE] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Subtle Decorative Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2E2A5C]/5 border border-[#2E2A5C]/15 mb-6 text-[#5B3E96]">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <p className="text-sm font-semibold tracking-widest text-[#C9A227] uppercase mb-2">
          Error 404
        </p>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E2A5C] mb-4">
          Page not found
        </h1>

        <p className="text-base text-[#2B2A3D]/75 leading-relaxed max-w-md mx-auto mb-8">
          The page you are looking for does not exist or has moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] font-medium shadow-sm hover:bg-[#5B3E96] transition-colors"
          >
            <Home className="w-4 h-4" /> Go to Home
          </Link>
          <Link
            to="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F08A24] text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      </div>
    </main>
  )
}
