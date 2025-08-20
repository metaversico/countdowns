<template>
  <div class="countdown-share">
    <div class="share-header">
      <h2>🎉 Countdown Created!</h2>
      <p>Share your countdown with the world</p>
    </div>

    <div class="countdown-preview">
      <div :class="`countdown-display theme-${countdown.theme || 'glamorous'}`">
        <h3>{{ countdown.title }}</h3>
        <div class="countdown-timer">{{ formatTimeLeft() }}</div>
        <p v-if="countdown.text">{{ countdown.text }}</p>
        <img v-if="countdown.imageUrl" :src="countdown.imageUrl" alt="Countdown image" class="countdown-image" />
        <a v-if="countdown.ctaUrl" :href="countdown.ctaUrl" class="cta-button" target="_blank" rel="noopener">
          Take Action
        </a>
      </div>
    </div>

    <div class="share-actions">
      <div class="share-link">
        <label for="countdown-url">Share Link</label>
        <div class="url-input-group">
          <input 
            id="countdown-url"
            ref="urlInput"
            :value="shareUrl" 
            readonly
            @click="selectUrl"
          />
          <button @click="copyUrl" class="copy-btn" :class="{ copied: copied }">
            {{ copied ? '✓ Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <div class="social-share">
        <h3>Share on Social Media</h3>
        <div class="social-buttons">
          <button @click="shareOn('twitter')" class="social-btn twitter">
            <span class="social-icon">𝕏</span>
            Share on X
          </button>
          <button @click="shareOn('facebook')" class="social-btn facebook">
            <span class="social-icon">f</span>
            Share on Facebook
          </button>
          <button @click="shareOn('whatsapp')" class="social-btn whatsapp">
            <span class="social-icon">📱</span>
            Share on WhatsApp
          </button>
          <button v-if="canUseNativeShare" @click="nativeShare" class="social-btn native">
            <span class="social-icon">📤</span>
            Share
          </button>
        </div>
      </div>
    </div>

    <div class="next-steps">
      <div class="stats-suggestion">
        <h3>Track Your Countdown</h3>
        <p>Sign in to see how many people view your countdown and get notified when it expires.</p>
        <button class="secondary-btn">Sign In to Track Stats</button>
      </div>
      
      <div class="create-another">
        <button @click="$emit('create-another')" class="primary-btn">
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

const shareUrl = computed(() => {
  return `${window.location.origin}/countdown/${props.countdown.id}`
})

const canUseNativeShare = computed(() => {
  return 'share' in navigator
})

let timerInterval: number | null = null

function formatTimeLeft(): string {
  if (!props.countdown.expiration) return '00:00:00'
  
  const now = new Date().getTime()
  const target = new Date(props.countdown.expiration).getTime()
  const diff = target - now

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
  if (urlInput.value) {
    urlInput.value.select()
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    success('Link copied to clipboard!')
    analytics.linkCopied(props.countdown.id)
    setTimeout(() => {
      copied.value = false
    }, 2000)
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
      shareUrlForPlatform = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
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

<style scoped>
.countdown-share {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.share-header {
  text-align: center;
  margin-bottom: 2rem;
}

.share-header h2 {
  color: var(--success-color, #28a745);
  margin-bottom: 0.5rem;
}

.countdown-preview {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  background-color: var(--preview-bg, #f8f9fa);
}

.countdown-display {
  text-align: center;
  padding: 1rem;
  border-radius: 4px;
}

.countdown-timer {
  font-family: monospace;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
  color: var(--timer-color, #333);
}

.countdown-image {
  max-width: 300px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin: 1rem 0;
}

.cta-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--cta-bg, #007bff);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.cta-button:hover {
  background-color: var(--cta-hover, #0056b3);
}

.share-actions {
  margin-bottom: 2rem;
}

.share-link {
  margin-bottom: 2rem;
}

.share-link label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
}

.url-input-group input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: var(--input-bg, #f8f9fa);
  cursor: pointer;
}

.copy-btn {
  padding: 0.75rem 1rem;
  background-color: var(--secondary-color, #6c757d);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  background-color: var(--secondary-hover, #545b62);
}

.copy-btn.copied {
  background-color: var(--success-color, #28a745);
}

.social-share h3 {
  margin-bottom: 1rem;
  color: var(--text-primary, #333);
}

.social-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.social-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.social-btn.twitter {
  background-color: #000;
  color: white;
}

.social-btn.twitter:hover {
  background-color: #333;
}

.social-btn.facebook {
  background-color: #1877f2;
  color: white;
}

.social-btn.facebook:hover {
  background-color: #166fe5;
}

.social-btn.whatsapp {
  background-color: #25d366;
  color: white;
}

.social-btn.whatsapp:hover {
  background-color: #128c7e;
}

.social-btn.native {
  background-color: var(--accent-color, #007bff);
  color: white;
}

.social-btn.native:hover {
  background-color: var(--accent-hover, #0056b3);
}

.social-icon {
  font-size: 1.2rem;
}

.next-steps {
  border-top: 1px solid var(--border-color, #e1e5e9);
  padding-top: 2rem;
}

.stats-suggestion {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--info-bg, #e3f2fd);
  border-radius: 4px;
}

.stats-suggestion h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.stats-suggestion p {
  margin-bottom: 1rem;
  color: var(--text-secondary, #666);
}

.create-another {
  text-align: center;
}

.primary-btn {
  padding: 1rem 2rem;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.primary-btn:hover {
  background-color: var(--primary-hover, #0056b3);
}

.secondary-btn {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--accent-color, #007bff);
  border: 2px solid var(--accent-color, #007bff);
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background-color: var(--accent-color, #007bff);
  color: white;
}

@media (max-width: 768px) {
  .countdown-share {
    padding: 1rem;
  }
  
  .url-input-group {
    flex-direction: column;
  }
  
  .social-buttons {
    grid-template-columns: 1fr;
  }
  
  .countdown-timer {
    font-size: 2rem;
  }
}
</style>