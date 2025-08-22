<template>
  <div
    class="text-center select-none"
    :class="{ 'text-error': isExpired, 'ending-soon': isEndingSoon }"
  >
    <div v-if="isExpired" class="text-2xl font-bold p-4 rounded-lg">
      {{ expiredMessage || 'Time\'s up!' }}
    </div>
    <div v-else class="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
      <div v-if="showDays && timeLeft.days > 0" class="flex flex-col items-center min-w-[60px] p-2 bg-timer/10 rounded-lg transition-all duration-300">
        <span class="text-3xl sm:text-4xl font-bold leading-none text-timer time-value">{{ timeLeft.days }}</span>
        <span class="text-xs uppercase tracking-wider text-text-muted time-label">{{ timeLeft.days === 1 ? 'day' : 'days' }}</span>
      </div>
      <div v-if="showHours && (timeLeft.days > 0 || timeLeft.hours > 0)" class="flex flex-col items-center min-w-[60px] p-2 bg-timer/10 rounded-lg transition-all duration-300">
        <span class="text-3xl sm:text-4xl font-bold leading-none text-timer time-value">{{ formatNumber(timeLeft.hours) }}</span>
        <span class="text-xs uppercase tracking-wider text-text-muted time-label">{{ timeLeft.hours === 1 ? 'hr' : 'hrs' }}</span>
      </div>
      <div v-if="showMinutes && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0)" class="flex flex-col items-center min-w-[60px] p-2 bg-timer/10 rounded-lg transition-all duration-300">
        <span class="text-3xl sm:text-4xl font-bold leading-none text-timer time-value">{{ formatNumber(timeLeft.minutes) }}</span>
        <span class="text-xs uppercase tracking-wider text-text-muted time-label">{{ timeLeft.minutes === 1 ? 'min' : 'mins' }}</span>
      </div>
      <div v-if="showSeconds" class="flex flex-col items-center min-w-[60px] p-2 bg-timer/10 rounded-lg transition-all duration-300">
        <span class="text-3xl sm:text-4xl font-bold leading-none text-timer time-value">{{ formatNumber(timeLeft.seconds) }}</span>
        <span class="text-xs uppercase tracking-wider text-text-muted time-label">{{ timeLeft.seconds === 1 ? 'sec' : 'secs' }}</span>
      </div>
    </div>
    <div v-if="showProgress" class="w-full h-1 bg-bg-tertiary rounded-full mt-4 overflow-hidden">
      <div class="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300" :style="{ width: progressPercentage + '%' }"></div>
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
  updateInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  showProgress: false,
  compact: false,
  updateInterval: 1000
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

const expirationTime = computed(() => new Date(props.expiresAt).getTime())
const startTime = computed(() => props.startedAt ? new Date(props.startedAt).getTime() : Date.now())

const timeLeft = computed((): TimeLeft => {
  const diff = Math.max(0, expirationTime.value - currentTime.value)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
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
  if (total <= 0) return 100
  const elapsed = total - timeLeft.value.totalMs
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
      stopTimer()
    }
  }, props.updateInterval)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

watch(() => props.expiresAt, () => {
  updateCurrentTime()
  if (!isExpired.value) {
    startTimer()
  } else {
    stopTimer()
  }
})

onMounted(() => {
  updateCurrentTime()
  if (!isExpired.value) {
    startTimer()
  }
})

onUnmounted(stopTimer)

defineExpose({
  startTimer,
  stopTimer,
  isExpired,
  timeLeft
})
</script>

<style scoped>
.ending-soon .time-unit {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>