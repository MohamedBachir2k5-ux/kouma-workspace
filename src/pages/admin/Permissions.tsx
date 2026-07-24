import { useState, useEffect } from 'react'
import { Info, Users, ShieldCheck } from 'lucide-react'
import { TeamService } from '../../services/team.service'
import { PermissionService } from '../../services/permission.service'
import { UserService } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import type { Team, User } from '../../lib/types'

const TEAM_PERMS: { key: string; label: string; desc: string }[] = [
  { key: 'invite_members',   label: 'Inviter',    desc: "Inviter de nouveaux membres dans l'équipe" },
  { key: 'manage_documents', label: 'Documents',  desc: "Gérer les documents de l'espace équipe" },
  { key: 'manage_events',    label: 'Agenda',     desc: 'Créer et modifier les événements' },
  { key: 'admin_space',      label: 'Administrer',desc: "Modifier les paramètres de l'équipe" },
]

export function AdminPermissions() {
  const { currentOrg } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [orgUsers, setOrgUsers] = useState<User[]>([])
  const [permsMap, setPermsMap] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    async function load() {
      const [loadedTeams, loadedUsers] = await Promise.all([
        TeamService.getByOrganizationWithMembers(currentOrg.id),
        UserService.getByOrganizationWithRole(currentOrg.id),
      ])
      setTeams(loadedTeams)
      setOrgUsers(loadedUsers)

      const entries = await Promise.all(
        loadedTeams.map(async t => {
          const perms = await PermissionService.getTeamPerms(t.id)
          return [t.id, perms] as [string, Record<string, boolean>]
        })
      )
      setPermsMap(Object.fromEntries(entries))
    }
    load()
  }, [currentOrg.id])

  function getResponsable(id: string): User | undefined {
    return orgUsers.find(u => u.id === id)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Permissions</h1>
        <p className="text-sm text-muted mt-0.5">Vue d'ensemble des droits par équipe.</p>
      </div>

      <div className="bg-indigo-pale border border-indigo/10 rounded-xl p-4 mb-5 flex items-start gap-3">
        <Info size={16} className="text-indigo mt-0.5 shrink-0" />
        <p className="text-xs text-indigo leading-relaxed">
          Les permissions s'appliquent au niveau de chaque équipe. Pour modifier les droits d'une équipe, rendez-vous dans <strong>Équipes</strong> et sélectionnez l'équipe concernée.
        </p>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Équipe</th>
              {TEAM_PERMS.map(p => (
                <th key={p.key} className="px-3 py-3 text-center">
                  <span className="text-[11px] font-semibold text-ink">{p.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const perms = permsMap[team.id] ?? {}
              const resp = getResponsable(team.responsableId)
              return (
                <tr key={team.id} className={`${idx < teams.length - 1 ? 'border-b border-border' : ''} hover:bg-bg transition-colors`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + '22' }}>
                        <Users size={13} style={{ color: team.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{team.name}</div>
                        {resp && <div className="text-[10px] text-muted truncate">{resp.firstName} {resp.lastName}</div>}
                      </div>
                    </div>
                  </td>
                  {TEAM_PERMS.map(perm => (
                    <td key={perm.key} className="px-3 py-3.5 text-center">
                      <div className="flex justify-center">
                        <ShieldCheck size={16} className={perms[perm.key] ? 'text-success' : 'text-border'} />
                      </div>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card per team */}
      <div className="md:hidden space-y-4">
        {teams.map(team => {
          const perms = permsMap[team.id] ?? {}
          const resp = getResponsable(team.responsableId)
          return (
            <div key={team.id} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + '22' }}>
                  <Users size={14} style={{ color: team.color }} />
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">{team.name}</div>
                  {resp && <div className="text-xs text-muted">{resp.firstName} {resp.lastName}</div>}
                </div>
              </div>
              <div className="space-y-3">
                {TEAM_PERMS.map(perm => (
                  <div key={perm.key} className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-ink">{perm.label}</div>
                      <div className="text-[10px] text-muted">{perm.desc}</div>
                    </div>
                    <ShieldCheck size={16} className={perms[perm.key] ? 'text-success' : 'text-border'} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
