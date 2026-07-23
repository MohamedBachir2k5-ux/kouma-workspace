import type { Department } from '../lib/types'
import { mockDepartments } from '../lib/mock'

let store: Department[] = [...mockDepartments]

export const DepartmentService = {
  list(orgId: string): Department[] {
    // TODO Phase 3: supabase.from('departments').select('*').eq('organization_id', orgId)
    return store.filter(d => d.organizationId === orgId)
  },

  create(orgId: string, data: { name: string; code: string }): Department {
    // TODO Phase 3: supabase.from('departments').insert({ organization_id: orgId, ...data })
    const dept: Department = { id: `d${Date.now()}`, organizationId: orgId, ...data }
    store = [...store, dept]
    return dept
  },

  update(id: string, data: { name: string; code: string }): void {
    // TODO Phase 3: supabase.from('departments').update(data).eq('id', id)
    store = store.map(d => d.id === id ? { ...d, ...data } : d)
  },

  delete(id: string): void {
    // TODO Phase 3: supabase.from('departments').delete().eq('id', id)
    store = store.filter(d => d.id !== id)
  },
}
