<template>
  <main>
    <section class="hero">
      <h1>Countdowns</h1>
      <p>Create and share countdowns.</p>
      <CountdownForm @created="loadCountdowns" />
    </section>
    <CountdownList :items="countdowns" />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CountdownForm from './components/CountdownForm.vue'
import CountdownList from './components/CountdownList.vue'

interface Countdown {
  id: string
  title: string
  expiresAt: string
}

const countdowns = ref<Countdown[]>([])

async function loadCountdowns() {
  try {
    const res = await axios.get('/api/countdowns')
    countdowns.value = res.data
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadCountdowns)
</script>
