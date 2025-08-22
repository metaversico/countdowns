<template>
  <div
    :class="`min-h-screen flex flex-col items-center p-4 sm:p-8 theme-${countdown.theme || 'glamorous'}`"
  >
    <div class="w-full max-w-4xl text-center mb-12">
      <div class="p-8 sm:p-12 rounded-2xl mb-8 relative overflow-hidden">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 leading-tight break-words">
          {{ countdown.title }}
        </h1>
        
        <CountdownTimer 
          :expires-at="countdown.expiration"
          :started-at="countdown.createdAt"
          :show-progress="true"
          class="my-8 scale-125"
          @expired="onCountdownExpired"
        />
        
        <div v-if="isExpired" class="text-2xl font-bold text-success my-4 animate-celebrateExpired">
          🎉 This countdown has ended!
        </div>
        
        <p v-if="currentText" class="text-lg sm:text-xl leading-relaxed my-8 max-w-2xl mx-auto">
          {{ currentText }}
        </p>
        
        <div v-if="currentImageUrl" class="my-8">
          <img 
            :src="currentImageUrl"
            :alt="countdown.title"
            class="max-w-full max-h-96 object-cover rounded-lg shadow-lg mx-auto"
            @error="onImageError"
          />
        </div>
        
        <div v-if="currentCtaUrl" class="my-8">
          <a 
            :href="currentCtaUrl"
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-block primary-btn py-3 px-8 text-lg font-bold rounded-lg transition-transform hover:scale-105"
          >
            Take Action
          </a>
        </div>
        
        <div class="mt-8 opacity-70">
          <p class="text-sm text-text-secondary mb-1">
            Created {{ formatCreatedDate() }}
          </p>
          <p v-if="!countdown.userId" class="text-xs text-text-muted italic">
            by an anonymous creator
          </p>
        </div>

        <div v-if="isOwner" class="mt-8">
          <button @click="deleteCountdown" :disabled="isDeleting" class="bg-error text-white py-2 px-4 rounded-md transition hover:bg-opacity-80 disabled:bg-gray-500 disabled:cursor-not-allowed">
            {{ isDeleting ? 'Deleting...' : 'Delete Countdown' }}
          </button>
        </div>
      </div>
      
      <div class="bg-bg-tertiary/50 p-8 rounded-lg border-2 border-dashed border-border-light">
        <h3 class="text-2xl font-bold mb-2">Create Your Own Countdown</h3>
        <p class="text-text-secondary mb-6">Make your own countdown in seconds!</p>
        <button @click="$emit('create-countdown')" class="create-btn py-3 px-6 text-lg font-bold rounded-lg transition-transform hover:scale-105">
          Make Your Own
        </button>
      </div>
    </div>
    
    <div class="w-full max-w-4xl text-center mt-8">
      <h3 class="text-2xl font-bold mb-4">Share This Countdown</h3>
      <div class="flex justify-center gap-4 flex-wrap">
        <button @click="shareOn('twitter')" class="flex items-center gap-2 py-2 px-4 bg-black text-white rounded-lg font-semibold transition-transform hover:scale-105">
          <span class="text-xl">𝕏</span>
          Share
        </button>
        <button @click="shareOn('facebook')" class="flex items-center gap-2 py-2 px-4 bg-[#1877f2] text-white rounded-lg font-semibold transition-transform hover:scale-105">
          <span class="text-xl font-bold">f</span>
          Share
        </button>
        <button @click="shareOn('whatsapp')" class="flex items-center gap-2 py-2 px-4 bg-[#25d366] text-white rounded-lg font-semibold transition-transform hover:scale-105">
          <span class="text-xl">📱</span>
          Share
        </button>
        <button @click="copyUrl" class="flex items-center gap-2 py-2 px-4 bg-secondary text-white rounded-lg font-semibold transition-colors" :class="{ 'bg-success': copied }">
          <span class="text-xl">📋</span>
          {{ copied ? 'Copied!' : 'Copy Link' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Countdown } from '../services/countdowns'
import { deleteCountdown as apiDeleteCountdown } from '../services/countdowns'
import CountdownTimer from './CountdownTimer.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useTheme } from '../composables/useTheme'

interface Props {
  countdown: Countdown
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'create-countdown'): void
  (e: 'countdown-expired'): void
  (e: 'deleted'): void
}>()

const auth = useAuthStore()
const { success, error } = useToast()
const { setTheme } = useTheme()
const copied = ref(false)
const imageError = ref(false)
const isDeleting = ref(false)

const isOwner = computed(() => {
  return auth.isAuthenticated && auth.user?.id === props.countdown.userId
})

const isExpired = computed(() => {
  return new Date(props.countdown.expiration) <= new Date()
})

const currentText = computed(() => {
  if (isExpired.value && props.countdown.expiredText) {
    return props.countdown.expiredText
  }
  return props.countdown.text
})

const currentImageUrl = computed(() => {
  if (isExpired.value && props.countdown.expiredImageUrl) {
    return props.countdown.expiredImageUrl
  }
  return props.countdown.imageUrl
})

const currentCtaUrl = computed(() => {
  if (isExpired.value && props.countdown.expiredCtaUrl) {
    return props.countdown.expiredCtaUrl
  }
  return props.countdown.ctaUrl
})

function onCountdownExpired() {
  emit('countdown-expired')
}

function formatCreatedDate(): string {
  if (!props.countdown.createdAt) return ''
  
  const created = new Date(props.countdown.createdAt)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'today'
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return created.toLocaleDateString()
  }
}

function onImageError() {
  imageError.value = true
}

function shareOn(platform: string) {
  const text = `Check out this countdown: ${props.countdown.title}`
  const url = window.location.href
  
  let shareUrl = ''
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      break
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
      break
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy URL:', err)
  }
}

async function deleteCountdown() {
  if (!isOwner.value) return

  if (confirm('Are you sure you want to delete this countdown?')) {
    isDeleting.value = true
    try {
      await apiDeleteCountdown(props.countdown.id)
      success('Countdown deleted successfully')
      emit('deleted')
    } catch (err) {
      error('Failed to delete countdown')
      console.error(err)
    } finally {
      isDeleting.value = false
    }
  }
}

onMounted(() => {
  setTheme(props.countdown.theme || 'glamorous');
})

watch(() => props.countdown.theme, (newTheme) => {
  setTheme(newTheme || 'glamorous');
});
</script>

<style scoped>
.main-countdown-timer :deep(.time-value) {
  font-size: 2.5rem;
}

.main-countdown-timer :deep(.time-label) {
  font-size: 1rem;
}

@keyframes celebrateExpired {
  0%, 100% { transform: scale(1); }
  25%, 75% { transform: scale(1.1); }
  50% { transform: scale(1.05); }
}
.animate-celebrateExpired {
  animation: celebrateExpired 2s ease-in-out;
}
</style>