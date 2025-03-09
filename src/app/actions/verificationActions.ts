'use server'
import { createClient } from "@/utils/supabase/server"

export async function uploadVerificationFile(user_id: string, file: File, type: string) {
  const supabase = createClient()
  const fileName = `${user_id}/${Date.now()}_${file.name}`
  const { error: storageError } = await (await supabase)
    .storage
    .from('verifications')
    .upload(fileName, file)
  if (storageError) throw storageError
  const file_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/verifications/${fileName}`
  const { data, error } = await (await supabase)
    .from('IdentityVerifications')
    .insert([{ user_id, type, file_url, status: 'pending' }])
  if (error) throw error
  return data
}

export async function getVerificationStatus(user_id: string) {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from('IdentityVerifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data ? data[0] : null
}
