-- Migration 060: Update handle_new_user trigger to store phone/country/language
-- from raw_user_meta_data. This lets auth.service.ts pass these fields via
-- signUp() options.data and removes the need for a post-signUp client upsert
-- that requires an authenticated session (which is absent when email
-- confirmation is enabled in Supabase Cloud).

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, firstname, lastname, email, phone, country, language, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstname', ''),
    coalesce(new.raw_user_meta_data->>'lastname', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    coalesce(new.raw_user_meta_data->>'language', 'fr'),
    'active'
  )
  on conflict (id) do update set
    phone    = excluded.phone,
    country  = excluded.country,
    language = excluded.language,
    status   = 'active';
  return new;
end;
$$;
