<template>
  <div class="min-h-screen font-sans bg-bg-primary text-text-primary transition-colors duration-500">
    <Transition name="slide" mode="out-in">
      <div v-if="currentView === 'home'" key="home">
        <header class="relative text-center py-12 px-4 bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div class="absolute top-4 right-4 flex items-center gap-4">
            <div v-if="auth.isAuthenticated" class="flex items-center gap-2 text-white">
              <img :src="auth.user?.avatarUrl" alt="User avatar" class="w-8 h-8 rounded-full border-2 border-white" />
              <span class="font-semibold">{{ auth.user?.displayName }}</span>
              <button @click="auth.logout" class="px-2 py-1 text-sm border border-white rounded hover:bg-white/20 transition">Logout</button>
            </div>
            <LoginButton v-else />
          </div>
          <div class="max-w-3xl mx-auto">
            <h1 class="text-6xl md:text-7xl font-extrabold text-white !text-primary leading-tight">
              ⏰ Countdowns
            </h1>
            <p class="text-xl text-white/90 mt-4 mb-8 font-light">
              Create and share viral countdowns in seconds
            </p>
            <button @click="showCreateForm = true" class="primary-btn create-btn py-4 px-8 text-lg font-bold uppercase rounded-full transition-transform hover:scale-105">
              Start a Countdown
            </button>
          </div>
        </header>

        <main class="max-w-7xl mx-auto p-4 md:p-8">
          <Transition name="modal">
            <div v-if="showCreateForm" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div class="relative bg-bg-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <button @click="showCreateForm = false" class="absolute top-4 right-4 text-text-muted hover:text-text-primary text-3xl z-10">
                  &times;
                </button>
                <CountdownForm @created="onCountdownCreated" />
              </div>
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="createdCountdown && showShare" class="bg-bg-secondary rounded-xl mb-8 shadow-lg">
              <CountdownShare 
                :countdown="createdCountdown" 
                @create-another="startAnother"
              />
            </div>
          </Transition>

          <section class="bg-bg-secondary rounded-xl shadow-lg overflow-hidden">
            <div class="flex bg-bg-tertiary border-b border-border-light">
              <button 
                v-for="feed in feeds" 
                :key="feed.id"
                @click="activeTab = feed.id"
                :class="[
                  'flex-1 py-3 px-4 font-semibold text-text-secondary transition-colors',
                  { '!bg-bg-secondary !text-text-primary border-b-2 border-primary': activeTab === feed.id }
                ]"
              >
                {{ feed.label }}
              </button>
            </div>
            
            <Transition name="fade" mode="out-in">
              <div :key="activeTab" class="p-4">
                <CountdownList 
                  :items="filteredCountdowns" 
                  @view-countdown="viewCountdown"
                  @countdown-expired="onCountdownExpired"
                />
              </div>
            </Transition>
          </section>
        </main>
      </div>

      <div v-else-if="currentView === 'view'" key="view" class="relative">
        <CountdownView 
          :countdown="selectedCountdown!" 
          @create-countdown="goToCreate"
          @countdown-expired="onCountdownExpired"
        />
        <button @click="goHome" class="fixed top-8 left-8 py-2 px-6 bg-bg-secondary/90 backdrop-blur-sm rounded-full font-semibold text-text-primary z-50 transition-transform hover:scale-105">
          &larr; Back to Home
        </button>
      </div>
    </Transition>
    
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CountdownForm from './components/CountdownForm.vue'
import CountdownShare from './components/CountdownShare.vue'
import CountdownView from './components/CountdownView.vue'
import CountdownList from './components/CountdownList.vue'
import Toast from './components/Toast.vue'
import LoginButton from './components/LoginButton.vue'
import { listCountdowns, type Countdown } from './services/countdowns'
import { useToast } from './composables/useToast'
import { useAuthStore } from './stores/auth'
import { useTheme } from './composables/useTheme'
import { analytics } from './services/analytics'

useTheme()

const auth = useAuthStore()
const { success } = useToast()

const countdowns = ref<Countdown[]>([])
const currentView = ref<'home' | 'view'>('home')
const showCreateForm = ref(false)
const showShare = ref(false)
const createdCountdown = ref<Countdown | null>(null)
const selectedCountdown = ref<Countdown | null>(null)
const activeTab = ref('new')

const feeds = [
  { id: 'new', label: 'New' },
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'finished', label: 'Finished' }
]

const filteredCountdowns = computed(() => {
  const now = new Date()
  
  switch (activeTab.value) {
    case 'expiring':
      return countdowns.value
        .filter(c => new Date(c.expiration) > now)
        .sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime())
        .slice(0, 10)
    case 'finished':
      return countdowns.value
        .filter(c => new Date(c.expiration) <= now)
        .sort((a, b) => new Date(b.expiration).getTime() - new Date(a.expiration).getTime())
    case 'new':
    default:
      return countdowns.value
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
})

async function loadCountdowns() {
  try {
    countdowns.value = await listCountdowns()
  } catch (err) {
    console.error('Failed to load countdowns:', err)
  }
}

function onCountdownCreated(countdown: Countdown) {
  createdCountdown.value = countdown
  showCreateForm.value = false
  showShare.value = true
  analytics.countdownCreated(countdown.id, countdown.theme)
  loadCountdowns()
}

function startAnother() {
  showShare.value = false
  createdCountdown.value = null
  showCreateForm.value = true
}

function viewCountdown(countdown: Countdown) {
  selectedCountdown.value = countdown
  currentView.value = 'view'
  analytics.countdownViewed(countdown.id, false)
}

function goToCreate() {
  currentView.value = 'home'
  showCreateForm.value = true
  showShare.value = false
}

function goHome() {
  currentView.value = 'home'
  selectedCountdown.value = null
}

function onCountdownExpired(countdown: Countdown) {
  success(`🎉 "${countdown.title}" has ended!`, 5000)
  // refresh the countdowns to update categories
  loadCountdowns()
}

onMounted(loadCountdowns)
</script>

<style>
/* Vue Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from .relative {
  transform: scale(0.8) translateY(-20px);
  opacity: 0;
}
.modal-leave-to .relative {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}
</style>
