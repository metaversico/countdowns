<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm w-full">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="[
            'flex items-center gap-3 p-4 rounded-lg shadow-lg cursor-pointer backdrop-blur-lg border break-words',
            toastClasses[toast.type]
          ]"
          @click="removeToast(toast.id)"
        >
          <div class="flex-shrink-0 font-bold text-xl">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else-if="toast.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>
          <div class="flex-1 text-sm leading-snug">{{ toast.message }}</div>
          <button
            class="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
            :class="[toast.type === 'warning' ? 'hover:bg-black/10' : 'hover:bg-white/20']"
            @click.stop="removeToast(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { computed } from 'vue'

const { toasts, removeToast } = useToast()

const toastClasses = computed(() => ({
  success: 'bg-success/95 text-white border-white/20',
  error: 'bg-error/95 text-white border-white/20',
  warning: 'bg-warning/95 text-black border-black/20',
  info: 'bg-secondary/95 text-white border-white/20',
}))
</script>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>