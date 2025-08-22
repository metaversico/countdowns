<template>
  <div class="max-w-2xl mx-auto p-4 sm:p-8 text-text-primary">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-success mb-2">🎉 Countdown Created!</h2>
      <p class="text-text-secondary">Share your countdown with the world</p>
    </div>

    <div class="mb-8 p-6 border border-border-light rounded-lg bg-bg-tertiary">
      <div :class="`text-center p-4 rounded-lg theme-${countdown.theme || 'glamorous'}`">
        <h3 class="text-2xl font-bold">{{ countdown.title }}</h3>
        <div class="font-mono text-4xl font-bold my-4 text-timer">{{ timeLeft }}</div>
        <p v-if="countdown.text" class="text-text-secondary">{{ countdown.text }}</p>
        <img v-if="countdown.imageUrl" :src="countdown.imageUrl" alt="Countdown image" class="max-w-sm max-h-48 object-cover rounded-md my-4 mx-auto" />
        <a v-if="countdown.ctaUrl" :href="countdown.ctaUrl" class="inline-block primary-btn mt-4 py-2 px-6 rounded-lg font-semibold" target="_blank" rel="noopener">
          Take Action
        </a>
      </div>
    </div>

    <div class="space-y-8 mb-8">
      <div>
        <label for="countdown-url" class="block mb-2 font-bold text-text-secondary">Share Link</label>
        <div class="flex gap-2">
          <input 
            id="countdown-url"
            ref="urlInput"
            :value="shareUrl" 
            readonly
            @click="selectUrl"
            class="flex-1 p-3 bg-bg-tertiary border-2 border-border-light rounded-md cursor-pointer"
          />
          <button @click="copyUrl" class="px-6 bg-secondary text-white font-semibold rounded-md transition-colors" :class="{ 'bg-success': copied }">
            {{ copied ? '✓ Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="mb-4 font-bold text-text-secondary">Share on Social Media</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button @click="shareOn('twitter')" class="flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-lg font-semibold transition-opacity hover:opacity-80">
            <span class="text-xl">𝕏</span> Share on X
          </button>
          <button @click="shareOn('facebook')" class="flex items-center justify-center gap-2 py-3 px-4 bg-[#1877f2] text-white rounded-lg font-semibold transition-opacity hover:opacity-80">
            <span class="text-xl font-bold">f</span> Share on Facebook
          </button>
          <button @click="shareOn('whatsapp')" class="flex items-center justify-center gap-2 py-3 px-4 bg-[#25d366] text-white rounded-lg font-semibold transition-opacity hover:opacity-80">
            <span class="text-xl">📱</span> Share on WhatsApp
          </button>
          <button v-if="canUseNativeShare" @click="nativeShare" class="flex items-center justify-center gap-2 py-3 px-4 bg-accent text-white rounded-lg font-semibold transition-opacity hover:opacity-80">
            <span class="text-xl">📤</span> Share
          </button>
        </div>
      </div>
    </div>

    <div class="border-t border-border-light pt-8 space-y-8">
      <div class="text-center p-6 bg-bg-tertiary/50 rounded-lg">
        <h3 class="text-xl font-bold mb-2">Track Your Countdown</h3>
        <p class="text-text-secondary mb-4">Sign in to see how many people view your countdown and get notified when it expires.</p>
        <button class="font-bold py-2 px-6 rounded-lg text-primary border-2 border-primary transition-colors hover:bg-primary hover:text-bg-primary">Sign In to Track Stats</button>
      </div>
      
      <div class="text-center">
        <button @click="$emit('create-another')" class="primary-btn py-3 px-8 text-lg font-bold uppercase rounded-full">
          Create Another Countdown
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Countdown } from '../services/countdowns'
import { useToast } from '../composables/useToast'
import { analytics } from '../services/analytics'

interface Props {
  countdown: Countdown
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'create-another'): void
}>()

const urlInput = ref<HTMLInputElement>()
const copied = ref(false)
const timeLeft = ref('')
const { success } = useToast()

const shareUrl = computed(() => `${window.location.origin}/countdown/${props.countdown.id}`)
const canUseNativeShare = computed(() => 'share' in navigator)

let timerInterval: number | null = null

function formatTimeLeft(): string {
  if (!props.countdown.expiration) return '00:00:00'
  
  const diff = new Date(props.countdown.expiration).getTime() - Date.now()
  if (diff <= 0) return '00:00:00'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function updateTimer() {
  timeLeft.value = formatTimeLeft()
}

function selectUrl() {
  urlInput.value?.select()
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    success('Link copied to clipboard!')
    analytics.linkCopied(props.countdown.id)
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    selectUrl()
  }
}

function shareOn(platform: string) {
  const text = `Check out this countdown: ${props.countdown.title}`
  const url = shareUrl.value
  let shareUrlForPlatform = ''
  
  switch (platform) {
    case 'twitter':
      shareUrlForPlatform = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      break
    case 'facebook':
      shareUrlForPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
    case 'whatsapp':
      shareUrlForPlatform = `https-wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
      break
  }
  
  if (shareUrlForPlatform) {
    analytics.countdownShared(props.countdown.id, platform)
    window.open(shareUrlForPlatform, '_blank', 'width=600,height=400')
  }
}

async function nativeShare() {
  if (!canUseNativeShare.value) return
  try {
    await navigator.share({
      title: props.countdown.title,
      text: `Check out this countdown: ${props.countdown.title}`,
      url: shareUrl.value
    })
    analytics.countdownShared(props.countdown.id, 'native_share')
  } catch (err) {
    console.log('Native sharing cancelled or failed')
  }
}

onMounted(() => {
  updateTimer()
  timerInterval = window.setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>