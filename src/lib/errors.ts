// Converts raw Supabase/PostgreSQL error messages to user-friendly strings.
// Never exposes internal DB error details to the end user.
export function friendlyError(raw: string | null | undefined): string | null {
  if (!raw) return null

  const r = raw.toLowerCase()

  if (r.includes('row-level security') || r.includes('rls') || r.includes('violates row')) {
    return "Vous n'avez pas les droits nécessaires pour cette action."
  }
  if (r.includes('permission denied')) {
    return 'Accès refusé.'
  }
  if (r.includes('duplicate key') || r.includes('already exists') || r.includes('unique constraint')) {
    return 'Cet élément existe déjà.'
  }
  if (r.includes('foreign key') || r.includes('violates foreign')) {
    return 'Suppression impossible : des éléments associés existent encore.'
  }
  if (r.includes('null value in column') || r.includes('not-null constraint')) {
    return 'Données incomplètes. Veuillez remplir tous les champs requis.'
  }
  if (r.includes('invalid input syntax for type uuid') || r.includes('invalid uuid')) {
    return 'Identifiant invalide.'
  }
  if (r.includes('failed to fetch') || r.includes('networkerror') || r.includes('network request failed')) {
    return 'Erreur de connexion. Vérifiez votre réseau.'
  }
  if (r.includes('jwt') || r.includes('token') || r.includes('session')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }
  if (r.includes('too large') || r.includes('file size') || r.includes('payload too large')) {
    return 'Fichier trop volumineux.'
  }

  // Return as-is if it's already a friendly French message (doesn't start with DB keywords)
  return raw
}

// Wraps error?.message through friendlyError for consistent service usage
export function serviceError(err: { message: string } | null | undefined): string | null {
  return friendlyError(err?.message ?? null)
}
