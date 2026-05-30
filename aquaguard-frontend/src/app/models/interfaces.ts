export interface User {
  id: number;
  full_name: string;
  email?: string;
  phone: string;
  role: 'citizen' | 'responder' | 'admin';
  health_status: 'safe' | 'danger' | 'injured' | 'unknown';
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  latitude?: number;
  longitude?: number;
  relationship?: string;
  created_at: string;
  updated_at?: string;
}

export interface SosRequest {
  id: number;
  user_id: number;
  responder_id?: number;
  team_id?: number;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  num_people: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  created_at: string;
  citizen_name?: string;
  citizen_phone?: string;
  responder_name?: string;
  responder_phone?: string;
  responder_latitude?: number | null;
  responder_longitude?: number | null;
  responder_status?: string;
  team_name?: string;
  images?: SosImage[];
}

export interface SosImage {
  id: number;
  sos_id: number;
  image_url: string;
}

export interface Alert {
  id: number;
  created_by: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  center_lat?: number;
  center_lng?: number;
  radius_km?: number;
  created_at: string;
  created_by_name?: string;
}

export interface Shelter {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_count: number;
  status: 'open' | 'full' | 'closed';
  address?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  alert_id?: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  severity?: string;
}

export interface RescueTeam {
  id: number;
  name: string;
  phone?: string;
  area?: string;
  members?: User[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
