<template>
  <div class="countdown-view">
    <div :class="`countdown-container theme-${countdown.theme || 'glamorous'}`">
      <div class="countdown-content">
        <h1 class="countdown-title">{{ countdown.title }}</h1>
        
        <CountdownTimer 
          :expires-at="countdown.expiration"
          :started-at="countdown.createdAt"
          :show-progress="true"
          class="main-countdown-timer"
          @expired="onCountdownExpired"
        />
        
        <div v-if="isExpired" class="expired-message">
          🎉 This countdown has ended!
        </div>
        
        <p v-if="countdown.text" class="countdown-description">
          {{ countdown.text }}
        </p>
        
        <div v-if="countdown.imageUrl" class="countdown-image-container">
          <img 
            :src="countdown.imageUrl" 
            :alt="countdown.title"
            class="countdown-image"
            @error="onImageError"
          />
        </div>
        
        <div v-if="countdown.ctaUrl" class="cta-container">
          <a 
            :href="countdown.ctaUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="cta-button"
          >
            Take Action
          </a>
        </div>
        
        <div class="creator-info">
          <p class="created-text">
            Created {{ formatCreatedDate() }}
          </p>
          <p class="creator-note">
            by an anonymous creator
          </p>
        </div>
      </div>
      
      <div class="call-to-action">
        <h3>Create Your Own Countdown</h3>
        <p>Make your own countdown in seconds!</p>
        <button @click="$emit('create-countdown')" class="create-btn">
          Make Your Own
        </button>
      </div>
    </div>
    
    <div class="share-actions">
      <h3>Share This Countdown</h3>
      <div class="share-buttons">
        <button @click="shareOn('twitter')" class="share-btn twitter">
          <span class="share-icon">𝕏</span>
          Share
        </button>
        <button @click="shareOn('facebook')" class="share-btn facebook">
          <span class="share-icon">f</span>
          Share
        </button>
        <button @click="shareOn('whatsapp')" class="share-btn whatsapp">
          <span class="share-icon">📱</span>
          Share
        </button>
        <button @click="copyUrl" class="share-btn copy" :class="{ copied: copied }">
          <span class="share-icon">📋</span>
          {{ copied ? 'Copied!' : 'Copy Link' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Countdown } from '../services/countdowns'
import CountdownTimer from './CountdownTimer.vue'

interface Props {
  countdown: Countdown
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'create-countdown'): void
  (e: 'countdown-expired'): void
}>()

const copied = ref(false)
const imageError = ref(false)

const isExpired = computed(() => {
  return new Date(props.countdown.expiration) <= new Date()
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

// Timer handling now done by CountdownTimer component
</script>

<style scoped>
.countdown-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.countdown-container {
  max-width: 800px;
  width: 100%;
  text-align: center;
  margin-bottom: 3rem;
}

.countdown-content {
  padding: 3rem 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.countdown-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 2rem;
  line-height: 1.2;
  word-break: break-word;
}

/* CountdownTimer component handles its own styling */
.main-countdown-timer {
  margin: 2rem 0;
  transform: scale(1.2);
}

.main-countdown-timer :deep(.time-value) {
  font-size: 2.5rem;
}

.main-countdown-timer :deep(.time-label) {
  font-size: 1rem;
}

.expired-message {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--success-color, #28a745);
  margin: 1rem 0;
  animation: celebrateExpired 2s ease-in-out;
}

@keyframes celebrateExpired {
  0%, 100% { transform: scale(1); }
  25%, 75% { transform: scale(1.1); }
  50% { transform: scale(1.05); }
}

.countdown-description {
  font-size: 1.25rem;
  line-height: 1.6;
  margin: 2rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.countdown-image-container {
  margin: 2rem 0;
}

.countdown-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.cta-container {
  margin: 2rem 0;
}

.cta-button {
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.creator-info {
  margin-top: 2rem;
  opacity: 0.7;
}

.created-text {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-bottom: 0.25rem;
}

.creator-note {
  font-size: 0.8rem;
  color: var(--text-muted, #999);
  font-style: italic;
}

.call-to-action {
  background-color: var(--cta-bg, #f8f9fa);
  padding: 2rem;
  border-radius: 8px;
  border: 2px dashed var(--border-color, #e1e5e9);
}

.call-to-action h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.call-to-action p {
  margin-bottom: 1.5rem;
  color: var(--text-secondary, #666);
}

.create-btn {
  padding: 1rem 2rem;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
}

.create-btn:hover {
  background-color: var(--primary-hover, #0056b3);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.4);
}

.share-actions {
  margin-top: 2rem;
  text-align: center;
}

.share-actions h3 {
  margin-bottom: 1rem;
  color: var(--text-primary, #333);
}

.share-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.share-btn.twitter {
  background-color: #000;
  color: white;
}

.share-btn.facebook {
  background-color: #1877f2;
  color: white;
}

.share-btn.whatsapp {
  background-color: #25d366;
  color: white;
}

.share-btn.copy {
  background-color: var(--secondary-color, #6c757d);
  color: white;
}

.share-btn.copy.copied {
  background-color: var(--success-color, #28a745);
}

.share-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.share-icon {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .countdown-view {
    padding: 1rem 0.5rem;
  }
  
  .countdown-content {
    padding: 2rem 1rem;
  }
  
  .countdown-title {
    font-size: 2rem;
  }
  
  .countdown-timer {
    font-size: 2.5rem;
  }
  
  .countdown-description {
    font-size: 1.1rem;
  }
  
  .share-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .share-btn {
    width: 200px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .countdown-title {
    font-size: 1.5rem;
  }
  
  .countdown-timer {
    font-size: 2rem;
  }
}
</style>