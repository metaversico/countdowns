<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.title }} - {{ new Date(item.expiration).toLocaleString() }}
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ items: { id: string; title: string; expiration: string }[] }>()
</script>
