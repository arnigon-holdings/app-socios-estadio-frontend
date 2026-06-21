export interface User {
  id: number
  rut: string
  phone: string
  phone_verified: boolean
  birth_month: number
  birth_year: number
  teams_ids: number[]
  referral_code: string
  created_at: string
}

export interface Team {
  id: number
  name: string
  short_name: string
  logo_url: string | null
  active: boolean
}

export interface PointTransaction {
  id: number
  point_action_id: number
  amount: number
  reference_id: string | null
  created_at: string
  point_action?: {
    action_key: string
    description: string
  }
}

export interface MeResponse {
  user: User
  points_balance: number
  recent_transactions: PointTransaction[]
}