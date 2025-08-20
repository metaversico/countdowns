<template>
  <div class="countdown-timer" :class="{ expired: isExpired, 'ending-soon': isEndingSoon }">
    <div v-if="isExpired" class="expired-message">
      {{ expiredMessage || 'Time\'s up!' }}
    </div>
    <div v-else class="time-display">
      <div v-if="showDays && timeLeft.days > 0" class="time-unit">
        <span class="time-value">{{ timeLeft.days }}</span>
        <span class="time-label">{{ timeLeft.days === 1 ? 'day' : 'days' }}</span>
      </div>
      <div v-if="showHours && (timeLeft.days > 0 || timeLeft.hours > 0)" class="time-unit">
        <span class="time-value">{{ formatNumber(timeLeft.hours) }}</span>
        <span class="time-label">{{ timeLeft.hours === 1 ? 'hr' : 'hrs' }}</span>
      </div>
      <div v-if="showMinutes && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0)" class="time-unit">
        <span class="time-value">{{ formatNumber(timeLeft.minutes) }}</span>
        <span class="time-label">{{ timeLeft.minutes === 1 ? 'min' : 'mins' }}</span>
      </div>
      <div v-if="showSeconds" class="time-unit">
        <span class="time-value">{{ formatNumber(timeLeft.seconds) }}</span>
        <span class="time-label">{{ timeLeft.seconds === 1 ? 'sec' : 'secs' }}</span>
      </div>
    </div>
    <div v-if="showProgress" class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  expiresAt: string | Date
  startedAt?: string | Date
  expiredMessage?: string
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  showProgress?: boolean
  compact?: boolean
  updateInterval?: number // milliseconds
}

const props = withDefaults(defineProps<Props>(), {
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  showProgress: false,
  compact: false,
  updateInterval: 1000 // Update every second
})

const emit = defineEmits<{
  expired: []
  tick: [timeLeft: TimeLeft]
}>()

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

const currentTime = ref(Date.now())
let intervalId: number | null = null

const expirationTime = computed(() => {
  return new Date(props.expiresAt).getTime()
})

const startTime = computed(() => {
  return props.startedAt ? new Date(props.startedAt).getTime() : Date.now()
})

const timeLeft = computed((): TimeLeft => {
  const diff = Math.max(0, expirationTime.value - currentTime.value)
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff
  }
})

const isExpired = computed(() => timeLeft.value.totalMs <= 0)

const isEndingSoon = computed(() => {
  const threshold = 24 * 60 * 60 * 1000 // 24 hours
  return timeLeft.value.totalMs > 0 && timeLeft.value.totalMs <= threshold
})

const progressPercentage = computed(() => {
  if (!props.showProgress) return 0
  
  const total = expirationTime.value - startTime.value
  const remaining = timeLeft.value.totalMs
  const elapsed = total - remaining
  
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

function formatNumber(num: number): string {
  return props.compact ? num.toString() : num.toString().padStart(2, '0')
}

function updateCurrentTime() {
  currentTime.value = Date.now()
}

function startTimer() {
  if (intervalId) return
  
  intervalId = window.setInterval(() => {
    updateCurrentTime()
    emit('tick', timeLeft.value)
    
    if (isExpired.value) {
      emit('expired')
      stopTimer() // Stop the timer when expired
    }
  }, props.updateInterval)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Watch for changes in expiration time
watch(() => props.expiresAt, () => {
  updateCurrentTime()
  if (!isExpired.value) {
    startTimer()
  }
})

// Lifecycle
onMounted(() => {
  updateCurrentTime()
  if (!isExpired.value) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})

// Expose methods for parent components
defineExpose({
  startTimer,
  stopTimer,
  isExpired: computed(() => isExpired.value),
  timeLeft: computed(() => timeLeft.value)
})
</script>

<style scoped>
.countdown-timer {
  text-align: center;
  font-family: 'Courier New', Monaco, monospace;
  user-select: none;
}

.time-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  padding: 0.5rem;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.time-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
  color: #007bff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.time-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  margin-top: 0.25rem;
  font-weight: 500;
}

.expired .time-unit,
.expired-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.expired .time-value {
  color: #dc3545;
}

.ending-soon .time-unit {
  background: rgba(255, 193, 7, 0.1);
  border-color: #ffc107;
  animation: pulse 2s ease-in-out infinite;
}

.ending-soon .time-value {
  color: #e67e22;
}

.expired-message {
  font-size: 1.5rem;
  font-weight: bold;
  color: #dc3545;
  padding: 1rem;
  border-radius: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Compact mode */
.countdown-timer.compact .time-unit {
  min-width: 40px;
  padding: 0.25rem;
}

.countdown-timer.compact .time-value {
  font-size: 1.25rem;
}

.countdown-timer.compact .time-label {
  font-size: 0.625rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .time-display {
    gap: 0.25rem;
  }
  
  .time-unit {
    min-width: 50px;
    padding: 0.375rem;
  }
  
  .time-value {
    font-size: 1.5rem;
  }
  
  .time-label {
    font-size: 0.625rem;
  }
}

@media (max-width: 480px) {
  .time-display {
    flex-direction: row;
    justify-content: space-around;
  }
  
  .time-unit {
    min-width: 45px;
    padding: 0.25rem;
  }
  
  .time-value {
    font-size: 1.25rem;
  }
  
  .countdown-timer.compact .time-value {
    font-size: 1rem;
  }
}

/* Theme variants */
.countdown-timer.theme-minimal .time-unit {
  background: transparent;
  border: 1px solid #dee2e6;
}

.countdown-timer.theme-dark .time-unit {
  background: rgba(52, 58, 64, 0.9);
  border-color: #495057;
}

.countdown-timer.theme-dark .time-value {
  color: #ffffff;
}

.countdown-timer.theme-dark .time-label {
  color: #adb5bd;
}

.countdown-timer.theme-neon .time-unit {
  background: rgba(0, 255, 127, 0.1);
  border-color: #00ff7f;
  box-shadow: 0 0 10px rgba(0, 255, 127, 0.3);
}

.countdown-timer.theme-neon .time-value {
  color: #00ff7f;
  text-shadow: 0 0 10px rgba(0, 255, 127, 0.5);
}
</style>