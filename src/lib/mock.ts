// DEV FIXTURES — never imported in production paths.
// These exist solely to allow the prototype UI to render without a live Supabase project.
// Replace each consumer with the corresponding service call (AuthService, UserService, etc.)
// before shipping to real users.

import type { User, Organization, Subscription, Channel, Message, Document, Event, Team, AuditLog, Department } from './types'
import { PRICING, STORAGE_BYTES } from '../config/pricing'

export const mockUser: User = {
  id: 'u1',
  organizationId: 'org1',
  firstName: 'Fatou',
  lastName: 'Diallo',
  email: 'fatou.diallo@nimba-industries.gn',
  role: 'Responsable RH',
  department: 'RH',
  status: 'active',
  createdAt: '2025-01-15',
}

export const mockOrgName = 'Nimba Industries'

export const MOCK_ORG: Organization = {
  id: 'org1',
  name: mockOrgName,
  logoUrl: null,
  email: 'admin@nimba-industries.gn',
  phone: '+224 620 00 00 00',
  website: 'https://www.nimba-industries.gn',
  country: 'Guinée',
  city: 'Conakry',
  currency: 'GNF',
  language: 'fr',
  sector: 'Secteur privé',
  size: null,
  plan: 'starter',
  createdAt: '2025-01-10',
}

export const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub1',
  organizationId: 'org1',
  plan: 'starter',
  status: 'active',
  currency: 'GNF',
  amount: PRICING.GNF.starter.monthly,
  trialEndsAt: null,
  startDate: '2026-01-23',
  renewsAt: '2026-08-23',
  endDate: null,
  discountPercent: PRICING.GNF.starter.discountPercent,
  discountEndsAt: '2027-07-23',
}

export const mockStorageQuotaBytes = STORAGE_BYTES[MOCK_SUBSCRIPTION.plan]

export const mockOrgUsers: User[] = [
  { id: 'u1', organizationId: 'org1', firstName: 'Fatou', lastName: 'Diallo', email: 'fatou.diallo@nimba-industries.gn', role: 'Responsable RH', department: 'RH', status: 'active', createdAt: '2025-01-15' },
  { id: 'u2', organizationId: 'org1', firstName: 'Amadou', lastName: 'Kouyaté', email: 'amadou.kouyate@nimba-industries.gn', role: 'Directeur Général', department: 'Direction', status: 'active', createdAt: '2025-01-10' },
  { id: 'u3', organizationId: 'org1', firstName: 'Ibrahim', lastName: 'Bah', email: 'ibrahim.bah@nimba-industries.gn', role: 'DAF', department: 'Finance', status: 'active', createdAt: '2025-01-10' },
  { id: 'u4', organizationId: 'org1', firstName: 'Mariama', lastName: 'Condé', email: 'mariama.conde@nimba-industries.gn', role: 'Comptable', department: 'Finance', status: 'active', createdAt: '2025-02-01' },
  { id: 'u5', organizationId: 'org1', firstName: 'Mariam', lastName: 'Soumah', email: 'mariam.soumah@nimba-industries.gn', role: 'Assistante RH', department: 'RH', status: 'active', createdAt: '2025-02-15' },
  { id: 'u6', organizationId: 'org1', firstName: 'Oumar', lastName: 'Traoré', email: 'oumar.traore@nimba-industries.gn', role: 'Responsable IT', department: 'Informatique', status: 'suspended', createdAt: '2025-03-01' },
  { id: 'u7', organizationId: 'org1', firstName: 'Aïssatou', lastName: 'Barry', email: 'aissatou.barry@nimba-industries.gn', role: 'Juriste', department: 'Juridique', status: 'active', createdAt: '2025-03-10' },
  { id: 'u8', organizationId: 'org1', firstName: 'Sékou', lastName: 'Camara', email: 'sekou.camara@nimba-industries.gn', role: 'Commercial', department: 'Commercial', status: 'active', createdAt: '2025-04-01' },
]

export const mockDepartments: Department[] = [
  { id: 'd1', organizationId: 'org1', name: 'Direction Générale',   code: 'DG'  },
  { id: 'd2', organizationId: 'org1', name: 'Finance',              code: 'FIN' },
  { id: 'd3', organizationId: 'org1', name: 'Ressources Humaines',  code: 'RH'  },
  { id: 'd4', organizationId: 'org1', name: 'Informatique',         code: 'IT'  },
  { id: 'd5', organizationId: 'org1', name: 'Juridique',            code: 'JUR' },
  { id: 'd6', organizationId: 'org1', name: 'Commercial',           code: 'COM' },
]

export const mockTeams: Team[] = [
  {
    id: 't1', organizationId: 'org1',
    name: 'Direction Générale', description: 'Comité de direction et décisions stratégiques.',
    responsableId: 'u2',
    members: ['u2', 'u3', 'u1'],
    color: '#0f1628', createdAt: '2025-01-10',
  },
  {
    id: 't2', organizationId: 'org1',
    name: 'Finance', description: 'Comptabilité, budget et reporting financier.',
    responsableId: 'u3',
    members: ['u3', 'u4'],
    color: '#f59e0b', createdAt: '2025-01-10',
  },
  {
    id: 't3', organizationId: 'org1',
    name: 'Ressources Humaines', description: 'Recrutement, formation et gestion du personnel.',
    responsableId: 'u1',
    members: ['u1', 'u5'],
    color: '#4f46e5', createdAt: '2025-01-15',
  },
  {
    id: 't4', organizationId: 'org1',
    name: 'Projet Bauxite 2026', description: 'Équipe dédiée au projet d\'expansion minière.',
    responsableId: 'u2',
    members: ['u2', 'u3', 'u7', 'u8'],
    color: '#10b981', createdAt: '2025-03-15',
  },
  {
    id: 't5', organizationId: 'org1',
    name: 'Juridique', description: 'Conseil juridique et conformité réglementaire.',
    responsableId: 'u7',
    members: ['u7'],
    color: '#8b5cf6', createdAt: '2025-03-10',
  },
]

export const mockAuditLogs: AuditLog[] = [
  { id: 'l1',  organizationId: 'org1', userId: 'u6', action: 'user_joined',       targetType: 'user', targetId: 'u8', targetName: 'Sékou Camara',      detail: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'l2',  organizationId: 'org1', userId: 'u6', action: 'user_suspended',    targetType: 'user', targetId: 'u6', targetName: 'Oumar Traoré',       detail: 'Suspension temporaire', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: 'l3',  organizationId: 'org1', userId: 'u3', action: 'document_added',    targetType: 'document', targetId: null, targetName: 'Rapport Q2 2025.pdf', detail: 'Dossier Finance', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
  { id: 'l4',  organizationId: 'org1', userId: 'u6', action: 'team_created',      targetType: 'team', targetId: 't4', targetName: 'Projet Bauxite 2026', detail: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'l5',  organizationId: 'org1', userId: 'u6', action: 'user_joined',       targetType: 'user', targetId: 'u7', targetName: 'Aïssatou Barry',     detail: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString() },
  { id: 'l6',  organizationId: 'org1', userId: 'u6', action: 'permission_changed',targetType: 'user', targetId: 'u3', targetName: 'Ibrahim Bah',        detail: 'Rôle mis à jour : Administrateur d\'équipe', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
  { id: 'l7',  organizationId: 'org1', userId: 'u6', action: 'invite_generated',  targetType: null, targetId: null, targetName: null, detail: 'Lien d\'invitation généré', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString() },
  { id: 'l8',  organizationId: 'org1', userId: 'u1', action: 'document_added',    targetType: 'document', targetId: null, targetName: 'Organigramme 2025.docx', detail: 'Dossier RH', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString() },
  { id: 'l9',  organizationId: 'org1', userId: 'u6', action: 'team_updated',      targetType: 'team', targetId: 't3', targetName: 'Ressources Humaines', detail: 'Ajout de Mariam Soumah', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 'l10', organizationId: 'org1', userId: 'u6', action: 'user_joined',       targetType: 'user', targetId: 'u5', targetName: 'Mariam Soumah',      detail: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString() },
]

export const mockChannels: Channel[] = [
  { id: 'c1',   organizationId: 'org1', name: 'Direction Générale',    type: 'team',   teamId: 't1', members: ['u2', 'u3', 'u1'],    unreadCount: 3, lastMessage: { id: 'm1',   channelId: 'c1',   senderId: 'u2', content: "Réunion budget confirmée pour vendredi 10h00.",            status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() } },
  { id: 'c3',   organizationId: 'org1', name: 'Finance',               type: 'team',   teamId: 't2', members: ['u3', 'u4'],           unreadCount: 0, lastMessage: { id: 'm3',   channelId: 'c3',   senderId: 'u3', content: "Les chiffres du trimestre ont été validés.",              status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() } },
  { id: 'c4',   organizationId: 'org1', name: 'Ressources Humaines',   type: 'team',   teamId: 't3', members: ['u1', 'u5'],           unreadCount: 0, lastMessage: { id: 'm4',   channelId: 'c4',   senderId: 'u1', content: "Convocations envoyées pour les entretiens annuels.",       status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() } },
  { id: 'c_d1', organizationId: 'org1', name: 'Amadou Kouyaté',        type: 'direct',               members: ['u1', 'u2'],           unreadCount: 1, lastMessage: { id: 'm_d1', channelId: 'c_d1', senderId: 'u2', content: "Le rapport est prêt, je te l'envoie.",                      status: 'sent', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() } },
  { id: 'c_d2', organizationId: 'org1', name: 'Mariam Soumah',         type: 'direct',               members: ['u1', 'u5'],           unreadCount: 0, lastMessage: { id: 'm_d2', channelId: 'c_d2', senderId: 'u5', content: "Merci, à demain !",                                         status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() } },
  { id: 'c_g1', organizationId: 'org1', name: 'Coordination événement', type: 'group',               members: ['u1', 'u5', 'u8'],     unreadCount: 0, lastMessage: { id: 'm_g1', channelId: 'c_g1', senderId: 'u8', content: "Confirmé pour jeudi soir.",                                  status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() } },
]

export const mockMessages: Message[] = [
  { id: 'm10', channelId: 'c1',   senderId: 'u2', content: "Bonjour à tous. La réunion de budget est confirmée pour vendredi à 10h00.", status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: 'm11', channelId: 'c1',   senderId: 'u3', content: "Confirmé. Je prépare les slides de synthèse d'ici jeudi soir.",             status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
  { id: 'm12', channelId: 'c1',   senderId: 'u1', content: "Parfait. J'enverrai les convocations officielles ce soir.",                 status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { id: 'm20', channelId: 'c_d1', senderId: 'u1', content: "Amadou, tu as eu le temps de regarder le rapport de la semaine dernière ?", status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'm21', channelId: 'c_d1', senderId: 'u2', content: "Oui, je le finalise. Je te l'envoie d'ici ce soir.",                       status: 'sent', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 'm30', channelId: 'c_g1', senderId: 'u5', content: "Qui est disponible jeudi soir pour l'événement d'équipe ?",                 status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: 'm31', channelId: 'c_g1', senderId: 'u1', content: "Je suis disponible.",                                                        status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString() },
  { id: 'm32', channelId: 'c_g1', senderId: 'u8', content: "Confirmé pour jeudi soir.",                                                  status: 'read', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
]

export const mockDocuments: Document[] = [
  { id: 'd1', organizationId: 'org1', name: 'Rapport Q2 2025.pdf',              type: 'pdf',  size: 2400000, folderId: 'f1', teamId: 't2', ownerId: 'u3', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: 'd2', organizationId: 'org1', name: 'Organigramme 2025.docx',           type: 'docx', size: 450000,  folderId: 'f2', teamId: 't3', ownerId: 'u1', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'd3', organizationId: 'org1', name: 'Budget prévisionnel.xlsx',         type: 'xlsx', size: 890000,  folderId: 'f1', teamId: 't2', ownerId: 'u3', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
  { id: 'd4', organizationId: 'org1', name: 'Contrat fournisseur Bauxite SA.pdf', type: 'pdf', size: 1200000,            teamId: 't4', ownerId: 'u2', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 'd5', organizationId: 'org1', name: 'Procédure onboarding.pdf',         type: 'pdf',  size: 320000,  folderId: 'f2', teamId: 't3', ownerId: 'u1', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() },
]

export const mockEvents: Event[] = [
  { id: 'e1', organizationId: 'org1', title: 'Réunion budget annuel', description: 'Présentation et validation du budget prévisionnel 2026.', startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 10).toISOString(), endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 12).toISOString(), participants: ['u1', 'u2', 'u3'], createdById: 'u2', status: 'scheduled' },
  { id: 'e2', organizationId: 'org1', title: 'Entretiens annuels RH', description: "Cycle d'entretiens individuels avec les équipes.", startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(), participants: ['u1', 'u5'], createdById: 'u1', status: 'scheduled' },
  { id: 'e3', organizationId: 'org1', title: 'Comité de direction', startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14 + 1000 * 60 * 60 * 9).toISOString(), endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14 + 1000 * 60 * 60 * 11).toISOString(), participants: ['u1', 'u2', 'u3', 'u4'], createdById: 'u2', status: 'modified', modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), description: 'Horaire décalé à 9h (était 10h).' },
  { id: 'e4', organizationId: 'org1', title: 'Réunion partenaires externes', startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), endAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 90).toISOString(), participants: ['u2', 'u7'], createdById: 'u2', status: 'done' },
  { id: 'e5', organizationId: 'org1', title: 'Formation sécurité incendie', startAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), endAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 120).toISOString(), participants: ['u1', 'u2', 'u3', 'u4', 'u5'], createdById: 'u6', status: 'cancelled', cancelReason: 'Formateur indisponible — reporté.' },
]
