export interface Ebook {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  size_bytes: number
  price: number
  created_at: string
}

export interface AdminEbook extends Ebook {
  file_name: string
  storage_path?: string
  position: number
  is_visible: boolean
  updated_at: string
  download_count: number
}

export interface EbookDownloadLog {
  id: string
  ebook_id: string
  user_id: string
  ip: string | null
  user_agent: string | null
  created_at: string
  user_name: string
  user_email: string
  ebook_title: string
}
