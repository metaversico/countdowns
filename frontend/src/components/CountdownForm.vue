<template>
  <form @submit.prevent="submit">
    <input v-model="title" placeholder="Title" />
    <input v-model="expiresAt" type="datetime-local" />
    <button type="submit">Create</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits<{ (e: 'created'): void }>()
const title = ref('')
const expiresAt = ref('')

async function submit() {
  if (!title.value || !expiresAt.value) return
  await axios.post('/api/countdowns', {
    title: title.value,
    expiresAt: expiresAt.value
  })
  title.value = ''
  expiresAt.value = ''
  emit('created')
}
</script>
