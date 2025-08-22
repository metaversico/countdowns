<template>
  <form @submit.prevent="submit" class="p-8 text-text-primary">
    <div class="mb-6">
      <label for="title" class="block mb-2 font-bold text-text-secondary">Title*</label>
      <input 
        id="title"
        v-model="title" 
        placeholder="What are you counting down to?"
        maxlength="100"
        class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
        :class="{ 'border-error': errors.title }"
        :disabled="isRateLimited"
        @blur="validateTitle"
      />
      <div v-if="errors.title" class="text-error text-sm mt-1">{{ errors.title }}</div>
      <div class="text-right text-text-muted text-xs mt-1">{{ title.length }}/100</div>
    </div>

    <div class="mb-6">
      <label for="expiration" class="block mb-2 font-bold text-text-secondary">When does it end?*</label>
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <input 
          id="expiration"
          v-model="expiration" 
          type="datetime-local"
          class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
          :class="{ 'border-error': errors.expiration }"
          :disabled="isRateLimited"
          @blur="validateExpiration"
        />
        <span class="text-text-muted">or</span>
        <select v-model="quickDuration" @change="setQuickDuration" :disabled="isRateLimited" class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none">
          <option value="">Choose preset</option>
          <option value="1">In 1 day</option>
          <option value="7">In 1 week</option>
          <option value="30">In 1 month</option>
          <option value="365">In 1 year</option>
        </select>
      </div>
      <div v-if="errors.expiration" class="text-error text-sm mt-1">{{ errors.expiration }}</div>
    </div>

    <div class="mb-6">
      <label for="text" class="block mb-2 font-bold text-text-secondary">Description</label>
      <textarea 
        id="text"
        v-model="text" 
        placeholder="Add context or excitement..."
        rows="3"
        class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
        :disabled="isRateLimited"
      ></textarea>
    </div>

    <div class="grid sm:grid-cols-2 gap-6 mb-6">
      <div>
        <label for="imageUrl" class="block mb-2 font-bold text-text-secondary">Image URL</label>
        <input
          id="imageUrl"
          v-model="imageUrl"
          placeholder="https://example.com/image.jpg"
          type="url"
          class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
          :disabled="isRateLimited"
        />
      </div>
      <div>
        <label for="ctaUrl" class="block mb-2 font-bold text-text-secondary">Call-to-action Link</label>
        <input
          id="ctaUrl"
          v-model="ctaUrl"
          placeholder="https://example.com"
          type="url"
          class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
          :disabled="isRateLimited"
        />
      </div>
    </div>

    <div class="mb-6 border border-border-light rounded-md p-4">
      <button type="button" @click="showExpiredContent = !showExpiredContent" :disabled="isRateLimited" class="font-bold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
        {{ showExpiredContent ? 'Hide' : 'Show' }} Expired State Content
      </button>
      <div v-if="showExpiredContent" class="mt-4 space-y-4">
        <p class="text-sm text-text-muted">
          Optionally, provide different content to display after the countdown ends.
        </p>
        <div>
          <label for="expiredText" class="block mb-2 font-bold text-text-secondary">Expired Description</label>
          <textarea
            id="expiredText"
            v-model="expiredText"
            placeholder="What happens now that the countdown is over?"
            rows="3"
            class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
            :disabled="isRateLimited"
          ></textarea>
        </div>
        <div class="grid sm:grid-cols-2 gap-6">
          <div>
            <label for="expiredImageUrl" class="block mb-2 font-bold text-text-secondary">Expired Image URL</label>
            <input
              id="expiredImageUrl"
              v-model="expiredImageUrl"
              placeholder="https://example.com/expired-image.jpg"
              type="url"
              class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
              :disabled="isRateLimited"
            />
          </div>
          <div>
            <label for="expiredCtaUrl" class="block mb-2 font-bold text-text-secondary">Expired Call-to-action Link</label>
            <input
              id="expiredCtaUrl"
              v-model="expiredCtaUrl"
              placeholder="https://example.com/expired-action"
              type="url"
              class="w-full p-3 bg-bg-tertiary border-2 border-border-light rounded-md focus:border-primary focus:outline-none"
              :disabled="isRateLimited"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <label class="block mb-2 font-bold text-text-secondary">Theme</label>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div 
          v-for="themeOption in themeOptions"
          :key="themeOption"
          class="cursor-pointer text-center p-2 rounded-lg transition-all"
          :class="{ 
            'bg-primary/20 ring-2 ring-primary': theme === themeOption,
            'opacity-50 cursor-not-allowed': isRateLimited
          }"
          @click="!isRateLimited && (theme = themeOption)"
        >
          <div :class="`theme-preview theme-${themeOption} w-full h-16 rounded-md flex items-center justify-center mb-2 font-mono font-bold`">
            12:34:56
          </div>
          <span class="text-sm font-semibold capitalize">{{ themeOption }}</span>
        </div>
      </div>
    </div>

    <div v-if="preview" class="mb-8 p-4 border border-border-light rounded-md bg-bg-tertiary">
      <h3 class="font-bold mb-4 text-text-secondary">Preview</h3>
      <div :class="`text-center p-4 rounded-md theme-${theme}`">
        <h4 class="font-bold text-2xl">{{ title || 'Your countdown title' }}</h4>
        <CountdownTimer 
          v-if="expiration"
          :expires-at="expiration"
          :show-progress="true"
          class="my-4 scale-75"
        />
        <p v-if="text">{{ text }}</p>
        <img v-if="imageUrl" :src="imageUrl" alt="Countdown image" class="max-w-xs max-h-40 object-cover rounded-md mt-4 mx-auto" />
      </div>
    </div>

    <!-- Rate limit error message -->
    <div v-if="rateLimitError" class="mb-6 p-4 border border-error rounded-md bg-error/10">
      <p class="text-error font-semibold">{{ rateLimitError.message }}</p>
      <p v-if="timeUntilRetry > 0" class="text-error text-sm mt-1">
        You can try again in {{ timeUntilRetry }} seconds.
      </p>
    </div>
    
    <!-- General error message -->
    <div v-if="generalError" class="mb-6 p-4 border border-error rounded-md bg-error/10">
      <p class="text-error">Error: {{ generalError }}</p>
    </div>

    <div v-if="!auth.isAuthenticated" class="my-8 p-6 text-center bg-bg-tertiary rounded-lg border border-border-light">
      <h3 class="font-bold text-xl mb-2">Want to save this countdown to your profile?</h3>
      <p class="text-text-muted mb-4">Log in to manage your countdowns later.</p>
      <LoginButton @click="saveFormState">Login and Continue</LoginButton>
    </div>

    <button type="submit" :disabled="!isValid || isSubmitting || isRateLimited" class="w-full create-btn py-4 px-8 text-lg font-bold uppercase rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
      {{ isSubmitting ? 'Creating...' : 'Create Countdown' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { createCountdown, type CountdownInput, RateLimitExceededError } from '../services/countdowns'
import { useToast } from '../composables/useToast'
import CountdownTimer from './CountdownTimer.vue'
import LoginButton from './LoginButton.vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'

const emit = defineEmits<{ 
  (e: 'created', countdown: any): void 
}>()

const auth = useAuthStore()
const { error } = useToast()
const { theme: currentTheme, themes: themeOptions, setTheme } = useTheme()

const title = ref('')
const expiration = ref('')
const quickDuration = ref('')
const text = ref('')
const imageUrl = ref('')
const ctaUrl = ref('')
const theme = ref(currentTheme.value)
const isSubmitting = ref(false)

const expiredText = ref('')
const expiredImageUrl = ref('')
const expiredCtaUrl = ref('')
const showExpiredContent = ref(false)

// Rate limiting state
const rateLimitError = ref<any>(null)
const generalError = ref<string | null>(null)
const retryAfterTimestamp = ref<number | null>(null)
const timeUntilRetry = ref(0)

let retryTimer: number | null = null

const errors = ref({
  title: '',
  expiration: ''
})

const preview = computed(() => title.value || text.value || imageUrl.value)

const isRateLimited = computed(() => {
  return rateLimitError.value && timeUntilRetry.value > 0
})

const isValid = computed(() => {
  return title.value.length > 0 && 
         title.value.length <= 100 && 
         expiration.value && 
         !errors.value.title && 
         !errors.value.expiration
})

function validateTitle() {
  if (!title.value) {
    errors.value.title = 'Title is required'
  } else if (title.value.length > 100) {
    errors.value.title = 'Title must be 100 characters or less'
  } else {
    errors.value.title = ''
  }
}

function validateExpiration() {
  if (!expiration.value) {
    errors.value.expiration = 'Expiration date is required'
  } else if (new Date(expiration.value) <= new Date()) {
    errors.value.expiration = 'Expiration must be in the future'
  } else {
    errors.value.expiration = ''
  }
}

function setQuickDuration() {
  if (quickDuration.value) {
    const now = new Date()
    now.setDate(now.getDate() + parseInt(quickDuration.value))
    expiration.value = now.toISOString().slice(0, 16)
    validateExpiration()
  }
}

watch([title, expiration], () => {
  validateTitle()
  validateExpiration()
})

watch(theme, (newTheme) => {
  if (newTheme !== 'system') {
    setTheme(newTheme)
  }
})

const FORM_STORAGE_KEY = 'countdown_form_state'

function saveFormState() {
  const state = {
    title: title.value,
    expiration: expiration.value,
    text: text.value,
    imageUrl: imageUrl.value,
    ctaUrl: ctaUrl.value,
    theme: theme.value,
    expiredText: expiredText.value,
    expiredImageUrl: expiredImageUrl.value,
    expiredCtaUrl: expiredCtaUrl.value,
  }
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(state))
}

function restoreFormState() {
  const savedState = localStorage.getItem(FORM_STORAGE_KEY)
  if (savedState) {
    const state = JSON.parse(savedState)
    title.value = state.title
    expiration.value = state.expiration
    text.value = state.text
    imageUrl.value = state.imageUrl
    ctaUrl.value = state.ctaUrl
    theme.value = state.theme
    expiredText.value = state.expiredText
    expiredImageUrl.value = state.expiredImageUrl
    expiredCtaUrl.value = state.expiredCtaUrl
    localStorage.removeItem(FORM_STORAGE_KEY)
  }
}

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

onMounted(restoreFormState)

async function submit() {
  validateTitle()
  validateExpiration()
  
  if (!isValid.value || isSubmitting.value) return
  if (isRateLimited.value) return

  isSubmitting.value = true
  generalError.value = null
  rateLimitError.value = null

  try {
    const countdownData: CountdownInput = {
      title: title.value,
      expiration: expiration.value,
      text: text.value || undefined,
      imageUrl: imageUrl.value || undefined,
      ctaUrl: ctaUrl.value || undefined,
      theme: theme.value,
      socialAccounts: undefined,
      expiredText: expiredText.value || undefined,
      expiredImageUrl: expiredImageUrl.value || undefined,
      expiredCtaUrl: expiredCtaUrl.value || undefined
    }

    const created = await createCountdown(countdownData)
    
    title.value = ''
    expiration.value = ''
    quickDuration.value = ''
    text.value = ''
    imageUrl.value = ''
    ctaUrl.value = ''
    theme.value = 'glamorous'
    expiredText.value = ''
    expiredImageUrl.value = ''
    expiredCtaUrl.value = ''
    
    localStorage.removeItem(FORM_STORAGE_KEY)
    emit('created', created)
  } catch (err) {
    console.error('Failed to create countdown:', err)
    if (err instanceof RateLimitExceededError) {
      rateLimitError.value = err.rateLimitInfo
      startRetryCountdown(err.rateLimitInfo.retryAfter)
    } else {
      generalError.value = err instanceof Error ? err.message : 'Failed to create countdown. Please try again.'
      error('Failed to create countdown. Please try again.')
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
.preview-timer {
  transform: scale(0.8);
}

button:disabled,
input:disabled,
textarea:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
