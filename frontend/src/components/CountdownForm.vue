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
        <div class="countdown-timer">{{ formatTimeLeft() }}</div>
        <p v-if="text">{{ text }}</p>
        <img v-if="imageUrl" :src="imageUrl" alt="Countdown image" class="preview-image" />
      </div>
    </div>

    <button type="submit" :disabled="!isValid || isSubmitting" class="create-btn">
      {{ isSubmitting ? 'Creating...' : 'Create Countdown' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createCountdown, type CountdownInput } from '../services/countdowns'
import { useToast } from '../composables/useToast'

const emit = defineEmits<{ 
  (e: 'created', countdown: any): void 
}>()

const { error } = useToast()

const title = ref('')
const expiration = ref('')
const quickDuration = ref('')
const text = ref('')
const imageUrl = ref('')
const ctaUrl = ref('')
const theme = ref('glamorous')
const isSubmitting = ref(false)

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

function formatTimeLeft(): string {
  if (!expiration.value) return '00:00:00'
  
  const now = new Date().getTime()
  const target = new Date(expiration.value).getTime()
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

watch([title, expiration], () => {
  validateTitle()
  validateExpiration()
})

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
      socialAccounts: undefined // For now, we don't collect social accounts in the form
    }

    const created = await createCountdown(countdownData)
    
    title.value = ''
    expiration.value = ''
    quickDuration.value = ''
    text.value = ''
    imageUrl.value = ''
    ctaUrl.value = ''
    theme.value = 'glamorous'
    
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

.countdown-timer {
  font-family: monospace;
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
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
