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

export async function GetAllUsersVerifications() {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from('IdentityVerifications')
    .select(`
      *,
      users:user_id (
        id,
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteVerificationFile(file_url: string) {
  const supabase = createClient()
  
  // Extract the file path from the URL
  const urlParts = file_url.split('/storage/v1/object/public/verifications/')
  if (urlParts.length !== 2) {
    throw new Error('Invalid file URL format')
  }
  
  const filePath = urlParts[1]
  
  const { error } = await (await supabase)
    .storage
    .from('verifications')
    .remove([filePath])
  
  if (error) throw error
  return true
}

export async function SetUserVerification(verification_id: string, status: 'approved' | 'rejected' | 'pending') {
  const supabase = createClient()
  
  // First, get the verification record to access the file_url
  const { data: verification, error: fetchError } = await (await supabase)
    .from('IdentityVerifications')
    .select('file_url')
    .eq('id', verification_id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Update the verification status
  const { data, error } = await (await supabase)
    .from('IdentityVerifications')
    .update({ 
      status, 
      updated_at: new Date().toISOString()
    })
    .eq('id', verification_id)
    .select()
  
  if (error) throw error
  
  // If verification is completed (approved or rejected), delete the file
  if (status === 'approved' || status === 'rejected') {
    try {
      await deleteVerificationFile(verification.file_url)
      console.log(`Verification file deleted for verification ID: ${verification_id}`)
    } catch (deleteError) {
      console.error(`Failed to delete verification file: ${deleteError}`)
      // Don't throw error here as the verification status was already updated
    }
  }
  
  return data
}
