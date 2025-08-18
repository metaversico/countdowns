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
import CountdownForm from './components/CountdownForm.vue'
import CountdownList from './components/CountdownList.vue'
import { listCountdowns, type Countdown } from './services/countdowns'

const countdowns = ref<Countdown[]>([])

async function loadCountdowns() {
  try {
    countdowns.value = await listCountdowns()
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadCountdowns)
</script>
