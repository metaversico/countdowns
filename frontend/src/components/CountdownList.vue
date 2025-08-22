<template>
  <div class="w-full">
    <div v-if="items.length === 0" class="text-center py-16 text-text-muted">
      <div class="text-6xl mb-4">🎯</div>
      <h3 class="text-xl font-semibold mb-2 text-text-primary">No countdowns yet</h3>
      <p>Be the first to create a countdown!</p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="bg-bg-secondary rounded-xl p-6 shadow-md transition-all duration-300 cursor-pointer border-2 border-transparent relative overflow-hidden group hover:shadow-xl hover:border-primary"
        :class="{ 'opacity-70 bg-bg-tertiary': isExpired(item) }"
        @click="$emit('view-countdown', item)"
      >
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-xl font-bold text-text-primary flex-1 pr-4">{{ item.title }}</h3>
          <div v-if="item.theme" class="w-5 h-5 rounded-full flex-shrink-0" :class="`theme-indicator-${item.theme}`"></div>
        </div>
        
        <div class="my-4">
          <CountdownTimer
            :expires-at="item.expiration"
            :started-at="item.createdAt"
            compact
            @expired="handleCountdownExpired(item)"
          />
        </div>
        
        <p v-if="item.text" class="text-text-secondary text-sm leading-relaxed mb-4 h-10 overflow-hidden">
          {{ truncateText(item.text, 100) }}
        </p>
        
        <div v-if="item.imageUrl" class="mb-4 h-36 rounded-lg overflow-hidden">
          <img :src="item.imageUrl" :alt="item.title" @error="onImageError" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
        </div>
        
        <div class="flex justify-between items-center pt-4 border-t border-border-light text-sm">
          <span class="text-text-muted">{{ formatCreatedDate(item.createdAt) }}</span>
          <div class="flex items-center gap-2">
            <button @click.stop="copyShareLink(item)" class="py-1 px-2 text-xs bg-bg-tertiary border border-border-light rounded-md hover:bg-bg-primary">
              📋 Share
            </button>
            <span v-if="isExpired(item)" class="py-1 px-2 text-xs bg-error text-white rounded-full font-semibold">Ended</span>
            <span v-else-if="isSoon(item)" class="py-1 px-2 text-xs bg-warning text-black rounded-full font-semibold">Soon</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Countdown } from '../services/countdowns'
import CountdownTimer from './CountdownTimer.vue'

interface Props {
  items: Countdown[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'view-countdown', countdown: Countdown): void
  (e: 'countdown-expired', countdown: Countdown): void
}>()

function isExpired(item: Countdown): boolean {
  return new Date(item.expiration) <= new Date()
}

function isSoon(item: Countdown): boolean {
  const now = new Date()
  const expiration = new Date(item.expiration)
  const diff = expiration.getTime() - now.getTime()
  return diff > 0 && diff <= 24 * 60 * 60 * 1000 // 24 hours
}

function handleCountdownExpired(countdown: Countdown) {
  emit('countdown-expired', countdown)
}

function formatCreatedDate(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return created.toLocaleDateString()
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.parentElement?.remove()
}

async function copyShareLink(item: Countdown) {
  const url = `${window.location.origin}/countdown/${item.id}`
  try {
    await navigator.clipboard.writeText(url)
    // Placeholder for toast notification
    console.log('Link copied!')
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>

<style scoped>
.theme-indicator-glamorous { background: linear-gradient(45deg, #000, #ffd700); }
.theme-indicator-mainframe { background: linear-gradient(45deg, #000, #00ff00); }
.theme-indicator-serious { background: linear-gradient(45deg, #2c3e50, #95a5a6); }
.theme-indicator-playful { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }
.theme-indicator-zen { background: linear-gradient(45deg, #8e9aaf, #a8dadc); }
</style>
