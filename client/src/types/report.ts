export type ReportBadge = 'new' | 'popular' | 'trending' | 'best_seller'
export type ReportSection = 'personalized' | 'additional'

export interface Report {
  id: string
  slug: string
  title: string
  tagline: string | null
  description: string | null
  included: string[]
  price: number
  original_price: number | null
  discount_percent: number | null
  cover_image_url: string | null
  badge: ReportBadge | null
  section: ReportSection
}

export interface AdminReport extends Report {
  is_visible: boolean
  position: number
  created_at: string
  updated_at: string
  orders_count: number
}

export type ReportOrderStatus = 'new' | 'paid' | 'in_progress' | 'delivered' | 'cancelled'
export type ReportOrderSource = 'online' | 'manual'
export type ReportOrderGender = 'male' | 'female' | 'other'

export interface ReportOrder {
  id: string
  report_id: string | null
  report_title: string
  order_id: string | null
  user_id: string | null
  source: ReportOrderSource
  name: string
  email: string | null
  whatsapp_number: string
  gender: ReportOrderGender | null
  birth_date: string | null
  birth_time: string | null
  birth_time_unknown: boolean
  birth_place: string | null
  notes: string | null
  amount: number
  status: ReportOrderStatus
  delivered_pdf_path: string | null
  delivered_file_name: string | null
  delivered_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  user_account_name?: string | null
  user_account_email?: string | null
}
