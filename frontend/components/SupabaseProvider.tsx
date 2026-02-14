'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../lib/database.types'

type SupabaseContext = {
  supabase: ReturnType<typeof createClientComponentClient<Database>>
  user: any
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <Context.Provider value={{ supabase, user, loading }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}
