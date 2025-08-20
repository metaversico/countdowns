<template>
  <div class="app">
    <Transition name="slide" mode="out-in">
      <div v-if="currentView === 'home'" key="home" class="home-view">
        <header class="app-header">
          <div class="hero-section">
            <h1 class="app-title">⏰ Countdowns</h1>
            <p class="app-subtitle">Create and share viral countdowns in seconds</p>
            <button @click="showCreateForm = true" class="cta-button">
              Start a Countdown
            </button>
          </div>
        </header>

        <main class="main-content">
          <Transition name="modal">
            <div v-if="showCreateForm" class="create-section">
              <div class="form-container">
                <button @click="showCreateForm = false" class="close-btn">×</button>
                <CountdownForm @created="onCountdownCreated" />
              </div>
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="createdCountdown && showShare" class="share-section">
              <CountdownShare 
                :countdown="createdCountdown" 
                @create-another="startAnother"
              />
            </div>
          </Transition>

          <section class="countdown-feeds">
            <div class="feed-tabs">
              <button 
                v-for="feed in feeds" 
                :key="feed.id"
                @click="activeTab = feed.id"
                :class="['tab', { active: activeTab === feed.id }]"
              >
                {{ feed.label }}
              </button>
            </div>
            
            <Transition name="fade" mode="out-in">
              <div :key="activeTab" class="feed-content">
                <CountdownList 
                  :items="filteredCountdowns" 
                  @view-countdown="viewCountdown"
                />
              </div>
            </Transition>
          </section>
        </main>
      </div>

      <div v-else-if="currentView === 'view'" key="view" class="view-section">
        <CountdownView 
          :countdown="selectedCountdown!" 
          @create-countdown="goToCreate"
        />
        <button @click="goHome" class="back-btn">← Back to Home</button>
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
import { listCountdowns, type Countdown } from './services/countdowns'
import { useToast } from './composables/useToast'
import { analytics } from './services/analytics'

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

onMounted(loadCountdowns)
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-view {
  min-height: 100vh;
}

.app-header {
  text-align: center;
  padding: 3rem 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-section {
  max-width: 800px;
  margin: 0 auto;
}

.app-title {
  font-size: 4rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.app-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  font-weight: 300;
}

.cta-button {
  padding: 1.5rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.create-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.form-container {
  position: relative;
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  z-index: 10;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.share-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.countdown-feeds {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feed-tabs {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s ease;
  position: relative;
}

.tab:hover {
  background-color: #e9ecef;
  color: #495057;
}

.tab.active {
  color: #007bff;
  background-color: white;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #007bff;
}

.feed-content {
  padding: 1rem;
}

.view-section {
  position: relative;
}

.back-btn {
  position: fixed;
  top: 2rem;
  left: 2rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  z-index: 100;
}

.back-btn:hover {
  background: white;
  transform: translateX(-2px);
}

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .app-title {
    font-size: 2.5rem;
  }
  
  .app-subtitle {
    font-size: 1.2rem;
  }
  
  .cta-button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
  
  .app-header {
    padding: 2rem 1rem 1rem;
  }
  
  .main-content {
    padding: 1rem 0.5rem;
  }
  
  .create-section {
    padding: 0.5rem;
  }
  
  .form-container {
    margin: 0;
    border-radius: 8px;
  }
  
  .feed-tabs {
    flex-direction: column;
  }
  
  .tab {
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }
  
  .tab:last-child {
    border-bottom: none;
  }
  
  .back-btn {
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 2rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .cta-button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

/* 320px support for very small devices */
@media (max-width: 320px) {
  .app-header {
    padding: 1rem 0.5rem;
  }
  
  .app-title {
    font-size: 1.75rem;
  }
  
  .main-content {
    padding: 0.5rem 0.25rem;
  }
  
  .create-section {
    padding: 0.25rem;
  }
}

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

.modal-enter-active .form-container,
.modal-leave-active .form-container {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .form-container {
  transform: scale(0.8) translateY(-20px);
  opacity: 0;
}

.modal-leave-to .form-container {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}
</style>
