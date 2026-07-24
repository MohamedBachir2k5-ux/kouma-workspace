// Application-level types — UI-friendly interfaces.
// Database-level types (matching Supabase rows) live in database.types.ts.

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  logoUrl: string | null
  email: string
  phone: string | null
  website: string | null
  country: string
  city: string | null
  currency: string
  language: string
  sector: string | null
  size: string | null          // null — computed from member count, never stored
  plan: 'starter' | 'business'
  createdAt: string
}

export interface User {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  department?: string
  avatarUrl?: string
  country?: string
  language?: string
  // 'invited' = sent invite, not yet signed up
  // 'deleted' = gone through offboarding (7-day recovery window)
  status: 'active' | 'invited' | 'suspended' | 'deleted'
  createdAt: string
}

export interface Department {
  id: string
  organizationId: string
  name: string
  code: string
}

export interface Team {
  id: string
  organizationId: string
  name: string
  description?: string
  responsableId: string       // maps to owner_id in DB
  members: string[]           // user IDs (from team_members join)
  color: string
  createdAt: string
}

export interface Group {
  id: string
  creatorId: string
  name: string
  avatarUrl: string | null
  members: string[]
  createdAt: string
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export type ChannelType = 'direct' | 'group' | 'team'

export interface Channel {
  id: string
  organizationId: string
  name: string
  type: ChannelType
  teamId?: string
  groupId?: string
  members: string[]
  lastMessage?: Message
  unreadCount?: number
}

export interface Message {
  id: string
  channelId: string
  senderId: string
  content: string
  status: 'sent' | 'received' | 'read'
  replyToId?: string
  editedAt?: string
  files?: string[]
  createdAt: string
}

// ── Documents ─────────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  organizationId: string
  parentId: string | null
  teamId: string | null
  name: string
  createdAt: string
}

export interface Document {
  id: string
  organizationId: string
  folderId?: string
  teamId?: string
  ownerId: string
  name: string
  type: string
  size: number
  createdAt: string
}

// ── Meetings / Agenda ─────────────────────────────────────────────────────────

export type EventStatus = 'scheduled' | 'modified' | 'cancelled' | 'done'

export interface Event {
  id: string
  organizationId: string
  title: string
  description?: string
  location?: string
  externalLink?: string
  startAt: string
  endAt: string
  participants: string[]
  createdById: string
  createdAt: string
  status: EventStatus
  modifiedAt?: string
  cancelReason?: string
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'payment_failed' | 'cancelled'

export interface Subscription {
  id: string
  organizationId: string
  plan: 'starter' | 'business'
  status: SubscriptionStatus
  currency: string
  amount: number
  trialEndsAt: string | null
  startDate: string | null
  renewsAt: string | null      // next billing date from payment provider
  endDate: string | null
  discountPercent: number
  discountEndsAt: string | null
}

// ── Invitations ───────────────────────────────────────────────────────────────

export interface Invitation {
  id: string
  organizationId: string
  email: string
  token: string
  status: 'sent' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: string
  createdAt: string
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: string
  payload: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'organization_created'
  | 'user_joined'
  | 'user_suspended'
  | 'user_revoked'
  | 'user_activated'
  | 'invite_generated'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'document_added'
  | 'document_deleted'
  | 'subscription_changed'
  | 'permission_changed'

export interface AuditLog {
  id: string
  organizationId: string
  userId: string | null
  action: AuditAction
  targetType: string | null
  targetId: string | null
  targetName: string | null
  detail: string | null
  createdAt: string
}

// ── Team permissions ──────────────────────────────────────────────────────────

export interface TeamPermission {
  teamId: string
  permissionName: string
  enabled: boolean
}
