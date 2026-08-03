import i18n from '../i18n'

// Converts raw Supabase/PostgreSQL error messages to user-friendly translated strings.
// Never exposes internal DB error details to the end user.
export function friendlyError(raw: string | null | undefined): string | null {
  if (!raw) return null

  const r = raw.toLowerCase()
  const t = i18n.t.bind(i18n)

  if (r.includes('row-level security') || r.includes('rls') || r.includes('violates row')) {
    return t('errors.noPermission')
  }
  if (r.includes('permission denied')) {
    return t('errors.accessDenied')
  }
  if (r.includes('duplicate key') || r.includes('already exists') || r.includes('unique constraint')) {
    return t('errors.alreadyExists')
  }
  if (r.includes('foreign key') || r.includes('violates foreign')) {
    return t('errors.deleteBlocked')
  }
  if (r.includes('null value in column') || r.includes('not-null constraint')) {
    return t('errors.incompleteData')
  }
  if (r.includes('invalid input syntax for type uuid') || r.includes('invalid uuid')) {
    return t('errors.invalidId')
  }
  if (r.includes('failed to fetch') || r.includes('networkerror') || r.includes('network request failed')) {
    return t('errors.networkError')
  }
  if (r.includes('jwt') || r.includes('token') || r.includes('session')) {
    return t('errors.sessionExpired')
  }
  if (r.includes('too large') || r.includes('file size') || r.includes('payload too large')) {
    return t('errors.fileTooLarge')
  }

  // Return as-is if it's already a friendly message (doesn't start with DB keywords)
  return raw
}

// Wraps error?.message through friendlyError for consistent service usage
export function serviceError(err: { message: string } | null | undefined): string | null {
  return friendlyError(err?.message ?? null)
}
