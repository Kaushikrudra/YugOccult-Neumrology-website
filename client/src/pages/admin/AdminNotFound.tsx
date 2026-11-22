import { Link } from 'react-router-dom'
import { LayoutDashboard, AlertCircle } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#2E2A5C]/10 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#5B3E96]/10 text-[#5B3E96] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#2E2A5C] mb-2">Admin page not found</h2>
        <p className="text-sm text-[#2B2A3D]/70 mb-6">
          The administration view or resource you are trying to access does not exist.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E2A5C] text-[#FBF7EE] text-sm font-medium hover:bg-[#5B3E96] transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
