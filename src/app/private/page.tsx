import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

import { logout } from '../login/actions'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }


  return (
    <div>
      <h1>Welcome, {data.user.email}</h1>
      <button onClick={logout}>Logout</button>
    {data.user.email}
    </div>
  )
}