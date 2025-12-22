
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase/client'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
    const user = ref(null)
    const session = ref(null)
    const router = useRouter()
    const loading = ref(false)
    const error = ref(null)

    async function initialize() {
        // Check active session
        const { data } = await supabase.auth.getSession()
        if (data.session) {
            session.value = data.session
            user.value = data.session.user
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, _session) => {
            session.value = _session
            user.value = _session?.user || null

            if (_event === 'SIGNED_OUT') {
                router.push('/login')
            }
        })
    }

    async function signUp(email, password) {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase.auth.signUp({
            email,
            password,
        })
        if (err) error.value = err.message
        loading.value = false
        return { data, error: err }
    }

    async function signIn(email, password) {
        loading.value = true
        error.value = null
        const { data, error: err } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (err) error.value = err.message
        else router.push('/')
        loading.value = false
        return { data, error: err }
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
    }

    return {
        user,
        session,
        loading,
        error,
        initialize,
        signUp,
        signIn,
        signOut
    }
})
