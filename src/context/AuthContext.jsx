import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchRole = async (userId) => {
        const { data } = await supabase
            .from('user_roles')
            .select('role, full_name')
            .eq('user_id', userId)
            .single()
        if (data) {
            setRole(data.role)
        } else {
            // First-time user, default to admin
            const { error } = await supabase.from('user_roles').insert({
                user_id: userId,
                role: 'admin',
                full_name: '',
            })
            if (!error) setRole('admin')
        }
    }

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                const u = session?.user ?? null
                setUser(u)
                if (u) fetchRole(u.id)
            })
            .catch(console.error)
            .finally(() => setLoading(false))

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) fetchRole(u.id)
            else setRole(null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        setRole(null)
    }

    const isAdmin = role === 'admin'
    const isDoctor = role === 'doctor' || role === 'admin'

    return (
        <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut, isAdmin, isDoctor }}>
            {children}
        </AuthContext.Provider>
    )
}
