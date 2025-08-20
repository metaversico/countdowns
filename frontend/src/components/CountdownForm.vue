<template>
  <form @submit.prevent="submit">
    <input 
      v-model="title" 
      placeholder="Title" 
      :disabled="isRateLimited" 
    />
    <input 
      v-model="expiration" 
      type="datetime-local" 
      :disabled="isRateLimited" 
    />
    <button 
      type="submit" 
      :disabled="isRateLimited || isSubmitting"
    >
      {{ isSubmitting ? 'Creating...' : 'Create' }}
    </button>
    
    <!-- Rate limit error message -->
    <div v-if="rateLimitError" class="error-message">
      <p>{{ rateLimitError.message }}</p>
      <p v-if="timeUntilRetry > 0">
        You can try again in {{ timeUntilRetry }} seconds.
      </p>
    </div>
    
    <!-- General error message -->
    <div v-if="generalError" class="error-message">
      <p>Error: {{ generalError }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { createCountdown, RateLimitExceededError } from '../services/countdowns'

const emit = defineEmits<{ (e: 'created'): void }>()
const title = ref('')
const expiration = ref('')
const isSubmitting = ref(false)
const rateLimitError = ref<any>(null)
const generalError = ref<string | null>(null)
const retryAfterTimestamp = ref<number | null>(null)
const timeUntilRetry = ref(0)

let retryTimer: number | null = null

const isRateLimited = computed(() => {
  return rateLimitError.value && timeUntilRetry.value > 0
})

function startRetryCountdown(retryAfterSeconds: number) {
  retryAfterTimestamp.value = Date.now() + (retryAfterSeconds * 1000)
  timeUntilRetry.value = retryAfterSeconds
  
  retryTimer = setInterval(() => {
    const now = Date.now()
    if (retryAfterTimestamp.value && now < retryAfterTimestamp.value) {
      timeUntilRetry.value = Math.ceil((retryAfterTimestamp.value - now) / 1000)
    } else {
      timeUntilRetry.value = 0
      rateLimitError.value = null
      if (retryTimer) {
        clearInterval(retryTimer)
        retryTimer = null
      }
    }
  }, 1000)
}

async function submit() {
  if (!title.value || !expiration.value) return
  if (isRateLimited.value) return
  
  isSubmitting.value = true
  generalError.value = null
  rateLimitError.value = null
  
  try {
    await createCountdown({
      title: title.value,
      expiration: expiration.value
    })
    
    title.value = ''
    expiration.value = ''
    emit('created')
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      rateLimitError.value = error.rateLimitInfo
      startRetryCountdown(error.rateLimitInfo.retryAfter)
    } else {
      generalError.value = error instanceof Error ? error.message : 'An unknown error occurred'
    }
  } finally {
    isSubmitting.value = false
  }
}

onUnmounted(() => {
  if (retryTimer) {
    clearInterval(retryTimer)
  }
})
</script>

<style scoped>
.error-message {
  color: #e74c3c;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background-color: #fdf2f2;
}

button:disabled,
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
