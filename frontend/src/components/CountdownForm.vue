<template>
  <form @submit.prevent="submit">
    <input v-model="title" placeholder="Title" />
    <input v-model="expiration" type="datetime-local" />
    <button type="submit">Create</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createCountdown } from '../services/countdowns'

const emit = defineEmits<{ (e: 'created'): void }>()
const title = ref('')
const expiration = ref('')

async function submit() {
  if (!title.value || !expiration.value) return
  await createCountdown({
    title: title.value,
    expiration: expiration.value
  })
  title.value = ''
  expiration.value = ''
  emit('created')
}
</script>
