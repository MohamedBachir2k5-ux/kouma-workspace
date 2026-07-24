import { supabase } from '../lib/supabase'
import type { Department } from '../lib/types'
import type { Tables } from '../lib/database.types'

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

  async create(orgId: string, data: { name: string; code: string }): Promise<{ dept: Department | null; error: string | null }> {
    const { data: row, error } = await supabase
      .from('departments')
      .insert({ organization_id: orgId, name: data.name, code: data.code })
      .select()
      .single()
    if (error) return { dept: null, error: error.message }
    return { dept: rowToDepartment(row), error: null }
  },

  async update(id: string, data: { name: string; code: string }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('departments')
      .update({ name: data.name, code: data.code })
      .eq('id', id)
    return { error: error?.message ?? null }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
    return { error: error?.message ?? null }
  },
}
