import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Pricing } from './pages/Pricing'
import { Security } from './pages/Security'
import { Resources } from './pages/Resources'
import { SolutionCommunication } from './pages/solutions/Communication'
import { SolutionDocuments } from './pages/solutions/Documents'
import { SolutionAgenda } from './pages/solutions/Agenda'
import { MentionsLegales, CGU, Confidentialite, Cookies } from './pages/legal/LegalPage'
import { LoginSelector } from './pages/auth/LoginSelector'
import { UserLogin } from './pages/auth/UserLogin'
import { AdminLogin } from './pages/auth/AdminLogin'
import { CreateOrg } from './pages/auth/CreateOrg'
import { JoinOrg } from './pages/auth/JoinOrg'
import { AdminRecovery } from './pages/auth/AdminRecovery'
import { CollaboratorRecovery } from './pages/auth/CollaboratorRecovery'
import { ResetPassword } from './pages/auth/ResetPassword'
import { PaymentCallback } from './pages/auth/PaymentCallback'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { Messages } from './pages/app/Messages'
import { Documents } from './pages/app/Documents'
import { Agenda } from './pages/app/Agenda'
import { Teams } from './pages/app/Teams'
import { Profile } from './pages/app/Profile'
import { Announcements } from './pages/app/Announcements'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminUsers } from './pages/admin/Users'
import { AdminDepartments } from './pages/admin/Departments'
import { AdminTeams } from './pages/admin/Teams'
import { AdminStorage } from './pages/admin/Storage'
import { AdminSecurity } from './pages/admin/Security'
import { AdminJournal } from './pages/admin/Journal'
import { AdminSettings } from './pages/admin/Settings'
import { AdminPermissions } from './pages/admin/Permissions'
import { AdminAnnouncements } from './pages/admin/Announcements'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/tarifs" element={<Pricing />} />
        <Route path="/security" element={<Security />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />

        {/* Solutions */}
        <Route path="/solutions/communication" element={<SolutionCommunication />} />
        <Route path="/solutions/documents" element={<SolutionDocuments />} />
        <Route path="/solutions/agenda" element={<SolutionAgenda />} />

        {/* Légal */}
        <Route path="/legal/mentions" element={<MentionsLegales />} />
        <Route path="/legal/cgu" element={<CGU />} />
        <Route path="/legal/confidentialite" element={<Confidentialite />} />
        <Route path="/legal/cookies" element={<Cookies />} />

        {/* ── Auth ── */}
        <Route path="/connexion" element={<LoginSelector />} />
        <Route path="/connexion/utilisateur" element={<UserLogin />} />
        <Route path="/connexion/admin" element={<AdminLogin />} />
        <Route path="/creer" element={<CreateOrg />} />
        <Route path="/rejoindre/:token" element={<JoinOrg />} />
        <Route path="/recuperation/admin" element={<AdminRecovery />} />
        <Route path="/recuperation/utilisateur" element={<CollaboratorRecovery />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        {/* ── App collaborateur ── */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/messages" replace />} />
          <Route path="messages" element={<Messages />} />
          <Route path="annonces" element={<Announcements />} />
          <Route path="documents" element={<Documents />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="equipes" element={<Teams />} />
          <Route path="profil" element={<Profile />} />
        </Route>

        {/* ── Console admin ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/tableau-de-bord" replace />} />
          <Route path="tableau-de-bord" element={<AdminDashboard />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="departements" element={<AdminDepartments />} />
          <Route path="equipes" element={<AdminTeams />} />
          <Route path="stockage" element={<AdminStorage />} />
          <Route path="securite" element={<AdminSecurity />} />
          <Route path="journal" element={<AdminJournal />} />
          <Route path="permissions" element={<AdminPermissions />} />
          <Route path="annonces" element={<AdminAnnouncements />} />
          <Route path="parametres" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
