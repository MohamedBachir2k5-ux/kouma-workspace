// Database types — mirrors the Supabase schema exactly.
// Regenerate with: supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ── Row types (what you get back from SELECT) ────────────────────────────────

export interface ProfileRow {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string | null
  avatar_url: string | null
  country: string | null
  language: string
  status: 'active' | 'invited' | 'suspended' | 'deleted'
  created_at: string
}

export interface OrganizationRow {
  id: string
  name: string
  logo_url: string | null
  email: string
  phone: string | null
  website: string | null
  country: string
  city: string | null
  currency: string
  language: string
  sector: string | null
  size: string | null
  plan: 'starter' | 'business'
  created_at: string
}

export interface OrganizationMemberRow {
  id: string
  organization_id: string
  user_id: string
  role: string
  status: 'active' | 'invited' | 'suspended' | 'deleted'
}

export interface DepartmentRow {
  id: string
  organization_id: string
  name: string
  code: string
}

export interface TeamRow {
  id: string
  organization_id: string
  name: string
  description: string | null
  color: string
  owner_id: string | null
  created_at: string
}

export interface TeamMemberRow {
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
}

export interface TeamPermissionRow {
  team_id: string
  permission_name: string
  enabled: boolean
}

export interface GroupRow {
  id: string
  creator_id: string
  name: string
  avatar_url: string | null
  private: boolean
  created_at: string
}

export interface GroupMemberRow {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
}

export interface ConversationRow {
  id: string
  type: 'direct' | 'group' | 'team' | 'org'
  organization_id: string
  reference_id: string | null
  created_at: string
}

export interface ConversationMemberRow {
  conversation_id: string
  user_id: string
  last_read_at: string | null
}

export interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  status: 'sent' | 'received' | 'read'
  reply_to_id: string | null
  edited_at: string | null
  created_at: string
}

export interface FileRow {
  id: string
  owner_id: string
  organization_id: string
  storage_path: string
  name: string
  type: string
  size: number
  category: 'attachment' | 'document'
  created_at: string
}

export interface FolderRow {
  id: string
  organization_id: string
  parent_id: string | null
  team_id: string | null
  name: string
  created_at: string
}

export interface DocumentRow {
  id: string
  organization_id: string
  folder_id: string | null
  owner_id: string
  title: string
  file_id: string
  created_at: string
}

export interface MeetingRow {
  id: string
  creator_id: string
  organization_id: string
  title: string
  description: string | null
  date: string
  end_date: string | null
  location: string | null
  link: string | null
  status: 'scheduled' | 'modified' | 'cancelled' | 'done'
  created_at: string
}

export interface MeetingParticipantRow {
  meeting_id: string
  user_id: string | null
  team_id: string | null
  group_id: string | null
}

export interface InvitationRow {
  id: string
  organization_id: string
  email: string
  token: string
  status: 'sent' | 'accepted' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
}

export interface SubscriptionRow {
  id: string
  organization_id: string
  plan: 'starter' | 'business'
  status: 'trial' | 'active' | 'expired' | 'payment_failed' | 'cancelled'
  currency: string
  amount: number
  trial_ends_at: string | null
  start_date: string | null
  end_date: string | null
  renews_at: string | null
  discount_percent: number
  discount_ends_at: string | null
  created_at: string
}

export interface PaymentRow {
  id: string
  organization_id: string
  provider: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  provider_reference: string | null
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  type: string
  payload: Json | null
  read: boolean
  created_at: string
}

export interface AuditLogRow {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  target_name: string | null
  detail: string | null
  created_at: string
}

// ── Database interface (for typed Supabase client) ───────────────────────────

type R = []

export interface Database {
  public: {
    Tables: {
      profiles:             { Row: ProfileRow;             Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'firstname' | 'lastname' | 'email'>; Update: Partial<ProfileRow>;             Relationships: R }
      organizations:        { Row: OrganizationRow;        Insert: Omit<OrganizationRow, 'id' | 'created_at'>;                                        Update: Partial<OrganizationRow>;        Relationships: R }
      organization_members: { Row: OrganizationMemberRow;  Insert: Omit<OrganizationMemberRow, 'id'>;                                                 Update: Partial<OrganizationMemberRow>;  Relationships: R }
      departments:          { Row: DepartmentRow;          Insert: Omit<DepartmentRow, 'id'>;                                                          Update: Partial<DepartmentRow>;          Relationships: R }
      teams:                { Row: TeamRow;                 Insert: Omit<TeamRow, 'id' | 'created_at'>;                                                Update: Partial<TeamRow>;                Relationships: R }
      team_members:         { Row: TeamMemberRow;           Insert: TeamMemberRow;                                                                     Update: Partial<TeamMemberRow>;          Relationships: R }
      team_permissions:     { Row: TeamPermissionRow;       Insert: TeamPermissionRow;                                                                 Update: Partial<TeamPermissionRow>;      Relationships: R }
      groups:               { Row: GroupRow;                Insert: Omit<GroupRow, 'id' | 'created_at'>;                                               Update: Partial<GroupRow>;               Relationships: R }
      group_members:        { Row: GroupMemberRow;          Insert: GroupMemberRow;                                                                    Update: Partial<GroupMemberRow>;         Relationships: R }
      conversations:        { Row: ConversationRow;         Insert: Omit<ConversationRow, 'id' | 'created_at'>;                                        Update: Partial<ConversationRow>;        Relationships: R }
      conversation_members: { Row: ConversationMemberRow;   Insert: ConversationMemberRow;                                                             Update: Partial<ConversationMemberRow>;  Relationships: R }
      messages:             { Row: MessageRow;              Insert: Omit<MessageRow, 'id' | 'created_at' | 'status' | 'edited_at'>;                   Update: Partial<MessageRow>;             Relationships: R }
      files:                { Row: FileRow;                 Insert: Omit<FileRow, 'id' | 'created_at'>;                                                Update: Partial<FileRow>;                Relationships: R }
      folders:              { Row: FolderRow;               Insert: Omit<FolderRow, 'id' | 'created_at'>;                                              Update: Partial<FolderRow>;              Relationships: R }
      documents:            { Row: DocumentRow;             Insert: Omit<DocumentRow, 'id' | 'created_at'>;                                            Update: Partial<DocumentRow>;            Relationships: R }
      meetings:             { Row: MeetingRow;              Insert: Omit<MeetingRow, 'id' | 'created_at'>;                                             Update: Partial<MeetingRow>;             Relationships: R }
      meeting_participants: { Row: MeetingParticipantRow;   Insert: MeetingParticipantRow;                                                             Update: Partial<MeetingParticipantRow>;  Relationships: R }
      invitations:          { Row: InvitationRow;           Insert: Omit<InvitationRow, 'id' | 'token' | 'created_at'>;                               Update: Partial<InvitationRow>;          Relationships: R }
      subscriptions:        { Row: SubscriptionRow;         Insert: Omit<SubscriptionRow, 'id' | 'created_at'>;                                        Update: Partial<SubscriptionRow>;        Relationships: R }
      payments:             { Row: PaymentRow;              Insert: Omit<PaymentRow, 'id' | 'created_at'>;                                             Update: Partial<PaymentRow>;             Relationships: R }
      notifications:        { Row: NotificationRow;         Insert: Omit<NotificationRow, 'id' | 'created_at'>;                                        Update: Partial<NotificationRow>;        Relationships: R }
      audit_logs:           { Row: AuditLogRow;             Insert: Omit<AuditLogRow, 'id'>;                                                           Update: never;                           Relationships: R }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}
