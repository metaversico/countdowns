<template>
  <form @submit.prevent="submit" class="countdown-form">
    <div class="form-group">
      <label for="title">Title*</label>
      <input 
        id="title"
        v-model="title" 
        placeholder="What are you counting down to?"
        maxlength="100"
        :class="{ error: errors.title }"
        @blur="validateTitle"
      />
      <div v-if="errors.title" class="error-text">{{ errors.title }}</div>
      <div class="char-count">{{ title.length }}/100</div>
    </div>

    <div class="form-group">
      <label for="expiration">When does it end?*</label>
      <div class="date-input-group">
        <input 
          id="expiration"
          v-model="expiration" 
          type="datetime-local"
          :class="{ error: errors.expiration }"
          @blur="validateExpiration"
        />
        <span class="or">or</span>
        <select v-model="quickDuration" @change="setQuickDuration">
          <option value="">Choose preset</option>
          <option value="1">In 1 day</option>
          <option value="7">In 1 week</option>
          <option value="30">In 1 month</option>
          <option value="365">In 1 year</option>
        </select>
      </div>
      <div v-if="errors.expiration" class="error-text">{{ errors.expiration }}</div>
    </div>

    <div class="form-group">
      <label for="text">Description</label>
      <textarea 
        id="text"
        v-model="text" 
        placeholder="Add context or excitement..."
        rows="3"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="imageUrl">Image URL</label>
      <input 
        id="imageUrl"
        v-model="imageUrl" 
        placeholder="https://example.com/image.jpg"
        type="url"
      />
    </div>

    <div class="form-group">
      <label for="ctaUrl">Call-to-action Link</label>
      <input 
        id="ctaUrl"
        v-model="ctaUrl" 
        placeholder="https://example.com"
        type="url"
      />
    </div>

    <div class="advanced-options">
      <button type="button" @click="showExpiredContent = !showExpiredContent" class="advanced-options-toggle">
        {{ showExpiredContent ? 'Hide' : 'Show' }} Expired State Content
      </button>
      <div v-if="showExpiredContent" class="expired-content-fields">
        <p class="options-description">
          Optionally, provide different content to display after the countdown ends.
        </p>
        <div class="form-group">
          <label for="expiredText">Expired Description</label>
          <textarea
            id="expiredText"
            v-model="expiredText"
            placeholder="What happens now that the countdown is over?"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="expiredImageUrl">Expired Image URL</label>
          <input
            id="expiredImageUrl"
            v-model="expiredImageUrl"
            placeholder="https://example.com/expired-image.jpg"
            type="url"
          />
        </div>

        <div class="form-group">
          <label for="expiredCtaUrl">Expired Call-to-action Link</label>
          <input
            id="expiredCtaUrl"
            v-model="expiredCtaUrl"
            placeholder="https://example.com/expired-action"
            type="url"
          />
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Theme</label>
      <div class="theme-gallery">
        <div 
          v-for="themeOption in themes" 
          :key="themeOption.name"
          class="theme-option"
          :class="{ selected: theme === themeOption.name }"
          @click="theme = themeOption.name"
        >
          <div :class="`theme-preview theme-${themeOption.name}`">
            <div class="preview-timer">12:34:56</div>
          </div>
          <span class="theme-name">{{ themeOption.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="preview" class="preview-section">
      <h3>Preview</h3>
      <div :class="`countdown-preview theme-${theme}`">
        <h2>{{ title || 'Your countdown title' }}</h2>
        <CountdownTimer 
          v-if="expiration"
          :expires-at="expiration"
          :show-progress="true"
          class="preview-timer"
        />
        <p v-if="text">{{ text }}</p>
        <img v-if="imageUrl" :src="imageUrl" alt="Countdown image" class="preview-image" />
      </div>
    </div>

    <div v-if="!auth.isAuthenticated" class="auth-prompt">
      <h3>Want to save this countdown to your profile?</h3>
      <p>Log in with Twitter to manage your countdowns later.</p>
      <LoginButton @click="saveFormState">Login and Continue</LoginButton>
    </div>

    <button type="submit" :disabled="!isValid || isSubmitting" class="create-btn">
      {{ isSubmitting ? 'Creating...' : 'Create Countdown' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { createCountdown, type CountdownInput } from '../services/countdowns'
import { useToast } from '../composables/useToast'
import CountdownTimer from './CountdownTimer.vue'
import LoginButton from './LoginButton.vue'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{ 
  (e: 'created', countdown: any): void 
}>()

const auth = useAuthStore()
const { error } = useToast()

const title = ref('')
const expiration = ref('')
const quickDuration = ref('')
const text = ref('')
const imageUrl = ref('')
const ctaUrl = ref('')
const theme = ref('glamorous')
const isSubmitting = ref(false)

const expiredText = ref('')
const expiredImageUrl = ref('')
const expiredCtaUrl = ref('')
const showExpiredContent = ref(false)

const errors = ref({
  title: '',
  expiration: ''
})

const themes = [
  { name: 'glamorous', label: 'Glamorous' },
  { name: 'mainframe', label: 'Mainframe' },
  { name: 'serious', label: 'Serious' },
  { name: 'playful', label: 'Playful' },
  { name: 'zen', label: 'Zen' }
]

const preview = computed(() => title.value || text.value || imageUrl.value)

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

// Removed formatTimeLeft function - now using CountdownTimer component

watch([title, expiration], () => {
  validateTitle()
  validateExpiration()
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

onMounted(restoreFormState)

async function submit() {
  validateTitle()
  validateExpiration()
  
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const countdownData: CountdownInput = {
      title: title.value,
      expiration: expiration.value,
      text: text.value || undefined,
      imageUrl: imageUrl.value || undefined,
      ctaUrl: ctaUrl.value || undefined,
      theme: theme.value,
      socialAccounts: undefined, // For now, we don't collect social accounts in the form
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
    error('Failed to create countdown. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.countdown-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary, #333);
}

input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--accent-color, #007bff);
}

input.error, textarea.error, select.error {
  border-color: var(--error-color, #dc3545);
}

.error-text {
  color: var(--error-color, #dc3545);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-secondary, #666);
  text-align: right;
  margin-top: 0.25rem;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-input-group input {
  flex: 1;
}

.or {
  color: var(--text-secondary, #666);
  font-size: 0.875rem;
}

.date-input-group select {
  flex: 1;
}

.advanced-options {
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  padding: 1rem;
}

.advanced-options-toggle {
  background: none;
  border: none;
  color: var(--primary-color, #007bff);
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.expired-content-fields {
  margin-top: 1rem;
}

.options-description {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-bottom: 1rem;
}

.theme-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.theme-option {
  cursor: pointer;
  text-align: center;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.theme-option:hover {
  background-color: var(--hover-bg, #f8f9fa);
}

.theme-option.selected {
  background-color: var(--selected-bg, #e3f2fd);
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  font-family: monospace;
  font-weight: bold;
}

.theme-name {
  font-size: 0.875rem;
  color: var(--text-primary, #333);
}

.preview-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  background-color: var(--preview-bg, #f8f9fa);
}

.countdown-preview {
  text-align: center;
  padding: 1rem;
  border-radius: 4px;
}

/* CountdownTimer component handles its own styling */
.preview-timer {
  margin: 1rem 0;
  transform: scale(0.8);
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 1rem;
}

.create-btn {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  background-color: var(--primary-hover, #0056b3);
}

.create-btn:disabled {
  background-color: var(--disabled-color, #6c757d);
  cursor: not-allowed;
}

.auth-prompt {
  margin: 2rem 0;
  padding: 1.5rem;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.auth-prompt h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.auth-prompt p {
  margin-bottom: 1rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .countdown-form {
    padding: 1rem;
  }
  
  .date-input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .theme-gallery {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>
