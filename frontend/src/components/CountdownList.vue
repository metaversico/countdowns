<template>
  <div class="countdown-list">
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-icon">🎯</div>
      <h3>No countdowns yet</h3>
      <p>Be the first to create a countdown!</p>
    </div>
    
    <div v-else class="countdown-grid">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="countdown-card"
        :class="{ expired: isExpired(item) }"
        @click="$emit('view-countdown', item)"
      >
        <div class="card-header">
          <h3 class="countdown-title">{{ item.title }}</h3>
          <div v-if="item.theme" class="theme-indicator" :class="`theme-${item.theme}`"></div>
        </div>
        
        <CountdownTimer 
          :expires-at="item.expiration"
          :started-at="item.createdAt"
          compact
          @expired="handleCountdownExpired(item)"
        />
        
        <div v-if="item.text" class="countdown-description">
          {{ truncateText(item.text, 100) }}
        </div>
        
        <div v-if="item.imageUrl" class="card-image">
          <img :src="item.imageUrl" :alt="item.title" @error="onImageError" />
        </div>
        
        <div class="card-footer">
          <span class="created-date">{{ formatCreatedDate(item.createdAt) }}</span>
          <div class="card-actions">
            <button @click.stop="copyShareLink(item)" class="action-btn">
              📋 Share
            </button>
            <span v-if="isExpired(item)" class="expired-badge">Ended</span>
            <span v-else-if="isSoon(item)" class="soon-badge">Soon</span>
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
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return created.toLocaleDateString()
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

async function copyShareLink(item: Countdown) {
  const url = `${window.location.origin}/countdown/${item.id}`
  try {
    await navigator.clipboard.writeText(url)
    // Note: Toast notifications would need to be injected or use a global store
    console.log('Link copied!')
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>

<style scoped>
.countdown-list {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #495057;
}

.countdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.countdown-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.countdown-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.countdown-card.expired {
  opacity: 0.7;
  background-color: #f8f9fa;
}

.countdown-card.expired:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.countdown-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
  flex: 1;
  margin-right: 1rem;
}

.theme-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.theme-indicator.theme-glamorous {
  background: linear-gradient(45deg, #000, #ffd700);
}

.theme-indicator.theme-mainframe {
  background: linear-gradient(45deg, #000, #00ff00);
}

.theme-indicator.theme-serious {
  background: linear-gradient(45deg, #2c3e50, #95a5a6);
}

.theme-indicator.theme-playful {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
}

.theme-indicator.theme-zen {
  background: linear-gradient(45deg, #8e9aaf, #a8dadc);
}

/* CountdownTimer component now handles its own styling */

.countdown-description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.card-image {
  margin-bottom: 1rem;
}

.card-image img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.875rem;
}

.created-date {
  color: #6c757d;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #6c757d;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
  color: #495057;
}

.expired-badge {
  background-color: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.soon-badge {
  background-color: #ffc107;
  color: #212529;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .countdown-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem 0;
  }
  
  .countdown-card {
    padding: 1rem;
  }
  
  .countdown-timer {
    font-size: 1.5rem;
    padding: 0.75rem;
  }
  
  .countdown-title {
    font-size: 1.1rem;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .card-actions {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .countdown-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .countdown-title {
    margin-right: 0;
  }
  
  .countdown-timer {
    font-size: 1.25rem;
  }
}
</style>
