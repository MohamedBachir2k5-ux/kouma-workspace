export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          organization_id: string
          pinned: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          organization_id: string
          pinned?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          pinned?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_actions: {
        Row: {
          created_at: string
          created_by: string
          description: string
          done: boolean
          due_date: string | null
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          done?: boolean
          due_date?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          done?: boolean
          due_date?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          organization_id: string
          target_id: string | null
          target_name: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          organization_id: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          organization_id?: string
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_errors: {
        Row: {
          created_at: string
          id: string
          message: string
          organization_id: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          organization_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          organization_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_errors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_keys: {
        Row: {
          conversation_id: string
          created_at: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          ecies_iv?: string
          encrypted_key?: string
          eph_public_key?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_keys_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_recovery_keys: {
        Row: {
          conversation_id: string
          created_at: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id: string
          organization_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id?: string
          organization_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          ecies_iv?: string
          encrypted_key?: string
          eph_public_key?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_recovery_keys_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_recovery_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          code: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_logs: {
        Row: {
          accessed_at: string
          action: string
          document_id: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          action?: string
          document_id: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          document_id?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          conversation_id: string | null
          created_at: string
          file_id: string
          folder_id: string | null
          id: string
          organization_id: string
          owner_id: string
          team_id: string | null
          title: string
          visibility: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          file_id: string
          folder_id?: string | null
          id?: string
          organization_id: string
          owner_id: string
          team_id?: string | null
          title: string
          visibility?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          file_id?: string
          folder_id?: string | null
          id?: string
          organization_id?: string
          owner_id?: string
          team_id?: string | null
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          remind_at: string
          sent: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          remind_at: string
          sent?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          remind_at?: string
          sent?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancel_reason: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string
          external_link: string | null
          id: string
          location: string | null
          modified_at: string | null
          organization_id: string
          participants: string[]
          rsvp: Json
          start_at: string
          status: string
          title: string
        }
        Insert: {
          cancel_reason?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at: string
          external_link?: string | null
          id?: string
          location?: string | null
          modified_at?: string | null
          organization_id: string
          participants?: string[]
          rsvp?: Json
          start_at: string
          status?: string
          title: string
        }
        Update: {
          cancel_reason?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string
          external_link?: string | null
          id?: string
          location?: string | null
          modified_at?: string | null
          organization_id?: string
          participants?: string[]
          rsvp?: Json
          start_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      file_keys: {
        Row: {
          created_at: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          ecies_iv?: string
          encrypted_key?: string
          eph_public_key?: string
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_recovery_keys: {
        Row: {
          created_at: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id: string
          organization_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          ecies_iv: string
          encrypted_key: string
          eph_public_key: string
          id?: string
          organization_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          ecies_iv?: string
          encrypted_key?: string
          eph_public_key?: string
          id?: string
          organization_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_recovery_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_id: string
          size: number
          storage_path: string
          type: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          owner_id: string
          size: number
          storage_path: string
          type: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          size?: number
          storage_path?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          team_id: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          team_id?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          team_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          id: string
          organization_id: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          organization_id: string
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          organization_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_actions: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string
          done: boolean
          due_date: string | null
          id: string
          minutes_id: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description: string
          done?: boolean
          due_date?: string | null
          id?: string
          minutes_id: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string
          done?: boolean
          due_date?: string | null
          id?: string
          minutes_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_actions_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_actions_minutes_id_fkey"
            columns: ["minutes_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          conversation_id: string | null
          created_at: string
          created_by: string
          decisions: string | null
          event_id: string
          id: string
          notes: string | null
          objective: string | null
          organization_id: string
          participants: string[]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          created_by: string
          decisions?: string | null
          event_id: string
          id?: string
          notes?: string | null
          objective?: string | null
          organization_id: string
          participants?: string[]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          created_by?: string
          decisions?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          objective?: string | null
          organization_id?: string
          participants?: string[]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_encrypted: boolean
          conversation_id: string
          created_at: string
          edited_at: string | null
          files: string[] | null
          id: string
          reply_to_id: string | null
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          content_encrypted?: boolean
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          files?: string[] | null
          id?: string
          reply_to_id?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          content_encrypted?: boolean
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          files?: string[] | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_recovery_keys: {
        Row: {
          admin_user_id: string
          bg_encrypted_key: string | null
          bg_iv: string | null
          bg_kdf_salt: string | null
          created_at: string
          ecies_iv: string
          encrypted_recovery_private_key: string
          eph_public_key: string
          id: string
          organization_id: string
          recovery_public_key: string
        }
        Insert: {
          admin_user_id: string
          bg_encrypted_key?: string | null
          bg_iv?: string | null
          bg_kdf_salt?: string | null
          created_at?: string
          ecies_iv: string
          encrypted_recovery_private_key: string
          eph_public_key: string
          id?: string
          organization_id: string
          recovery_public_key: string
        }
        Update: {
          admin_user_id?: string
          bg_encrypted_key?: string | null
          bg_iv?: string | null
          bg_kdf_salt?: string | null
          created_at?: string
          ecies_iv?: string
          encrypted_recovery_private_key?: string
          eph_public_key?: string
          id?: string
          organization_id?: string
          recovery_public_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_recovery_keys_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_recovery_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_security_settings: {
        Row: {
          invite_expiry_days: number | null
          organization_id: string
          session_duration_days: number
          updated_at: string
        }
        Insert: {
          invite_expiry_days?: number | null
          organization_id: string
          session_duration_days?: number
          updated_at?: string
        }
        Update: {
          invite_expiry_days?: number | null
          organization_id?: string
          session_duration_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_security_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          deleted_at: string | null
          department_id: string | null
          id: string
          job_title: string | null
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          job_title?: string | null
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          country: string
          created_at: string
          currency: string
          email: string
          id: string
          language: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string
          primary_color: string | null
          sector: string | null
          size: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          currency?: string
          email: string
          id?: string
          language?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          sector?: string | null
          size?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string
          id?: string
          language?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string
          primary_color?: string | null
          sector?: string | null
          size?: string | null
          website?: string | null
        }
        Relationships: []
      }
      otp_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          provider: string
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          organization_id: string
          provider?: string
          provider_reference?: string | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          position: number
          text: string
        }
        Insert: {
          id?: string
          poll_id: string
          position?: number
          text: string
        }
        Update: {
          id?: string
          poll_id?: string
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          conversation_id: string
          created_at: string
          creator_id: string
          ends_at: string | null
          id: string
          multiple_choice: boolean
          organization_id: string
          question: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          creator_id: string
          ends_at?: string | null
          id?: string
          multiple_choice?: boolean
          organization_id: string
          question: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          creator_id?: string
          ends_at?: string | null
          id?: string
          multiple_choice?: boolean
          organization_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string
          firstname: string | null
          id: string
          language: string
          lastname: string | null
          phone: string | null
          status: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email: string
          firstname?: string | null
          id: string
          language?: string
          lastname?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          firstname?: string | null
          id?: string
          language?: string
          lastname?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          discount_ends_at: string | null
          discount_percent: number
          end_date: string | null
          id: string
          organization_id: string
          plan: string
          renews_at: string | null
          start_date: string | null
          status: string
          trial_ends_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          discount_ends_at?: string | null
          discount_percent?: number
          end_date?: string | null
          id?: string
          organization_id: string
          plan: string
          renews_at?: string | null
          start_date?: string | null
          status: string
          trial_ends_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          discount_ends_at?: string | null
          discount_percent?: number
          end_date?: string | null
          id?: string
          organization_id?: string
          plan?: string
          renews_at?: string | null
          start_date?: string | null
          status?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_permissions: {
        Row: {
          granted: boolean
          member_id: string
          permission_key: string
          team_id: string
          updated_at: string
        }
        Insert: {
          granted?: boolean
          member_id: string
          permission_key: string
          team_id: string
          updated_at?: string
        }
        Update: {
          granted?: boolean
          member_id?: string
          permission_key?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_permissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_permissions: {
        Row: {
          enabled: boolean
          permission_name: string
          team_id: string
        }
        Insert: {
          enabled?: boolean
          permission_name: string
          team_id: string
        }
        Update: {
          enabled?: boolean
          permission_name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_key_pairs: {
        Row: {
          created_at: string
          encrypted_private_key: string
          id: string
          kdf_iterations: number
          kdf_iv: string
          kdf_salt: string
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_private_key: string
          id?: string
          kdf_iterations?: number
          kdf_iv: string
          kdf_salt: string
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_private_key?: string
          id?: string
          kdf_iterations?: number
          kdf_iv?: string
          kdf_salt?: string
          public_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_key_pairs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          inapp: boolean
          org_id: string
          push: boolean
          type: string
          user_id: string
        }
        Insert: {
          inapp?: boolean
          org_id: string
          push?: boolean
          type: string
          user_id: string
        }
        Update: {
          inapp?: boolean
          org_id?: string
          push?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string | null
          device_name: string | null
          id: string
          last_seen_at: string
          platform: string | null
          revoked: boolean
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          revoked?: boolean
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          revoked?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_member_invite: {
        Args: {
          p_department_id?: string
          p_job_title?: string
          p_token: string
          p_user_id: string
        }
        Returns: Json
      }
      add_user_conversation_key: {
        Args: {
          p_conversation_id: string
          p_ecies_iv: string
          p_encrypted_key: string
          p_eph_public_key: string
          p_user_id: string
        }
        Returns: undefined
      }
      check_otp_rate_limit: { Args: { p_email: string }; Returns: string }
      cleanup_all_org_sessions: { Args: never; Returns: undefined }
      cleanup_expired_sessions: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      create_direct_conversation: {
        Args: { p_org_id: string; p_user1: string; p_user2: string }
        Returns: string
      }
      create_group_conversation: {
        Args: { p_members: string[]; p_org_id: string }
        Returns: string
      }
      create_organization_with_admin: {
        Args: {
          p_admin_id?: string
          p_city?: string
          p_country?: string
          p_currency?: string
          p_email: string
          p_language?: string
          p_name: string
          p_phone?: string
          p_plan?: string
          p_sector?: string
          p_trial_days?: number
          p_website?: string
        }
        Returns: string
      }
      ensure_team_conversation: {
        Args: { p_members: string[]; p_org_id: string; p_team_id: string }
        Returns: string
      }
      get_departments_for_invite: {
        Args: { p_token: string }
        Returns: {
          code: string
          id: string
          name: string
          organization_id: string
        }[]
      }
      get_org_for_invite: { Args: { p_token: string }; Returns: string }
      get_unread_counts: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: {
          conversation_id: string
          unread_count: number
        }[]
      }
      init_conversation_keys: {
        Args: { p_conversation_id: string; p_key_rows: Json }
        Returns: undefined
      }
      is_conversation_member: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_group_admin_fn: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member_fn: { Args: { p_group_id: string }; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_team_member: { Args: { t_id: string }; Returns: boolean }
      is_team_owner_or_admin: { Args: { p_team_id: string }; Returns: boolean }
      log_client_error: {
        Args: {
          p_message: string
          p_stack?: string
          p_url?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      notify_users: {
        Args: { p_payload?: Json; p_type: string; p_user_ids: string[] }
        Returns: undefined
      }
      rsvp_to_event: {
        Args: { p_event_id: string; p_response: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Convenience Row aliases
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type OrganizationRow = Database['public']['Tables']['organizations']['Row']
export type OrganizationMemberRow = Database['public']['Tables']['organization_members']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type TeamRow = Database['public']['Tables']['teams']['Row']
export type TeamMemberRow = Database['public']['Tables']['team_members']['Row']
export type TeamPermissionRow = Database['public']['Tables']['team_permissions']['Row']
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
