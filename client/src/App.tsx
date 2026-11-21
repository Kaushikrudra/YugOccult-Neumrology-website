import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import ScrollToTop from './components/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Lazy-loaded public seeker views for optimized initial bundle & faster TTI
const Home = lazy(() => import('./pages/Home'))
const Consultation = lazy(() => import('./pages/Consultation'))
const Courses = lazy(() => import('./pages/Courses'))
const Reports = lazy(() => import('./pages/Reports'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Account = lazy(() => import('./pages/Account'))
const PaymentStatus = lazy(() => import('./pages/PaymentStatus'))

// Lazy-loaded administrative views
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminEbooks = lazy(() => import('./pages/admin/AdminEbooks'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminReportOrders = lazy(() => import('./pages/admin/AdminReportOrders'))
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminConsultation = lazy(() => import('./pages/admin/AdminConsultation'))
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'))

// Branded loading fallback for lazy bundles
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
    <div className="w-10 h-10 rounded-full border-3 border-[#EFEAF8] border-t-[#2E2A5C] animate-spin mb-4" />
    <p className="text-xs font-semibold tracking-widest uppercase text-[#2E2A5C]/70">
      Loading...
    </p>
  </div>
)

// Public Layout: houses public Navbar, Footer, and Floating WhatsApp
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-ink selection:bg-accent/30 selection:text-primary">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating WhatsApp Quick Action Button (Bottom Left) */}
      <FloatingWhatsApp />

      {/* Global Footer */}
      <Footer />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public & Seeker Portal Routes wrapped in PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/account" element={<Account />} />
              <Route path="/payment/status" element={<PaymentStatus />} />
            </Route>

            {/* Admin Authentication Route (No Navbar/Footer/WhatsApp) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Secure Administrative Area */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="ebooks" element={<AdminEbooks />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="report-orders" element={<AdminReportOrders />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="consultation" element={<AdminConsultation />} />
                <Route path="enquiries" element={<AdminEnquiries />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="site-settings" element={<AdminSiteSettings />} />
              </Route>
            </Route>

            {/* Fallback route back to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SiteSettingsProvider>
    </AuthProvider>
  )
}

export default App
