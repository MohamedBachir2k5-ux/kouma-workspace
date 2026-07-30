import { supabase } from '../lib/supabase'
import type { Department } from '../lib/types'
import type { Tables } from '../lib/database.types'
import { friendlyError } from '../lib/errors'

type DepartmentRow = Tables<'departments'>

function rowToDepartment(r: DepartmentRow): Department {
  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    code: r.code,
  }
}

export const DepartmentService = {
  async list(orgId: string): Promise<Department[]> {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', orgId)
      .order('name')
    return (data ?? []).map(rowToDepartment)
  },

  // Used by JoinOrg (public page, unauthenticated).
  // The RPC validates the invitation token and returns only the matching org's departments.
  // This replaces the former anon USING(true) SELECT policy (which exposed all orgs).
  async listByInviteToken(token: string): Promise<Department[]> {
    const { data } = await (supabase.rpc as unknown as (fn: string, args: object) => Promise<{ data: unknown }>)('get_departments_for_invite', { p_token: token })
    if (!data) return []
    return (data as { id: string; name: string; code: string; organization_id: string }[]).map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      code: r.code,
    }))
  },

  async create(orgId: string, data: { name: string; code: string }): Promise<{ dept: Department | null; error: string | null }> {
    const { data: row, error } = await supabase
      .from('departments')
      .insert({ organization_id: orgId, name: data.name, code: data.code })
      .select()
      .single()
    if (error) return { dept: null, error: friendlyError(error.message) }
    return { dept: rowToDepartment(row), error: null }
  },

  async update(id: string, data: { name: string; code: string }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('departments')
      .update({ name: data.name, code: data.code })
      .eq('id', id)
    return { error: friendlyError(error?.message) }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
    return { error: friendlyError(error?.message) }
  },
}
