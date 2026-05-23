// SAMPURNA Database Types
// Auto-generated types for Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trash_bins: {
        Row: {
          id: string
          bin_id: string
          location: string
          capacity_percentage: number | null
          status: 'normal' | 'warning' | 'critical' | 'offline' | null
          last_updated: string | null
          device_id: string | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bin_id: string
          location: string
          capacity_percentage?: number | null
          status?: 'normal' | 'warning' | 'critical' | 'offline' | null
          last_updated?: string | null
          device_id?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bin_id?: string
          location?: string
          capacity_percentage?: number | null
          status?: 'normal' | 'warning' | 'critical' | 'offline' | null
          last_updated?: string | null
          device_id?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      iot_devices: {
        Row: {
          id: string
          device_id: string
          location: string
          battery_level: number | null
          network_status: 'online' | 'offline' | null
          threshold_limit: number | null
          firmware_version: string | null
          ip_address: string | null
          last_ping: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          device_id: string
          location: string
          battery_level?: number | null
          network_status?: 'online' | 'offline' | null
          threshold_limit?: number | null
          firmware_version?: string | null
          ip_address?: string | null
          last_ping?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          device_id?: string
          location?: string
          battery_level?: number | null
          network_status?: 'online' | 'offline' | null
          threshold_limit?: number | null
          firmware_version?: string | null
          ip_address?: string | null
          last_ping?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      capacity_history: {
        Row: {
          id: string
          bin_id: string
          capacity_percentage: number | null
          recorded_at: string | null
          device_id: string | null
        }
        Insert: {
          id?: string
          bin_id: string
          capacity_percentage?: number | null
          recorded_at?: string | null
          device_id?: string | null
        }
        Update: {
          id?: string
          bin_id?: string
          capacity_percentage?: number | null
          recorded_at?: string | null
          device_id?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          bin_id: string
          alert_type: 'warning' | 'critical' | 'offline' | null
          message: string | null
          is_resolved: boolean | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          bin_id: string
          alert_type?: 'warning' | 'critical' | 'offline' | null
          message?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          bin_id?: string
          alert_type?: 'warning' | 'critical' | 'offline' | null
          message?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
