
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CharacterCreation from '../views/CharacterCreation.vue'
import { supabase } from '../supabase/client'
import { useCharacterStore } from '../stores/character'
import { useUserStore } from '../stores/user'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { requiresAuth: true }
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/create-character',
            name: 'create-character',
            component: CharacterCreation,
            meta: { requiresAuth: true }
        },
        {
            path: '/map',
            name: 'map',
            component: () => import('../views/MapView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/combat',
            name: 'combat',
            component: () => import('../views/CombatView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/inventory',
            name: 'inventory',
            component: () => import('../views/InventoryView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/quests',
            name: 'quests',
            component: () => import('../views/QuestView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/shop',
            name: 'shop',
            component: () => import('../views/ShopView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/inn',
            name: 'inn',
            component: () => import('../views/InnView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/leaderboard',
            name: 'leaderboard',
            component: () => import('../views/LeaderboardView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/test',
            name: 'test',
            component: () => import('../views/TestView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/dantian',
            name: 'dantian',
            component: () => import('../views/DantianView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/attribute',
            name: 'attribute',
            component: () => import('../views/AttributeView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sect',
            name: 'sect',
            component: () => import('../views/SectView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/exploration/:mapId',
            name: 'exploration',
            component: () => import('../views/ExplorationMapView.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !session) {
        next('/login')
    } else if (to.path === '/login' && session) {
        next('/')
    } else if (requiresAuth && session) {
        // Check if user has character
        const userStore = useUserStore()
        const characterStore = useCharacterStore()

        // Ensure stores are synced with session
        if (!userStore.user) {
            userStore.session = session
            userStore.user = session.user
        }

        if (!characterStore.character) {
            // Try fetch
            await characterStore.fetchCharacter()
        }

        if (!characterStore.character && to.path !== '/create-character') {
            next('/create-character')
        } else if (characterStore.character && to.path === '/create-character') {
            next('/')
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router
