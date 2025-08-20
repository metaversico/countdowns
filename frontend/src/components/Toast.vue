<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else-if="toast.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" @click.stop="removeToast(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 100%;
  word-wrap: break-word;
}

.toast-success {
  background-color: rgba(40, 167, 69, 0.95);
  color: white;
}

.toast-error {
  background-color: rgba(220, 53, 69, 0.95);
  color: white;
}

.toast-warning {
  background-color: rgba(255, 193, 7, 0.95);
  color: #212529;
}

.toast-info {
  background-color: rgba(23, 162, 184, 0.95);
  color: white;
}

.toast-icon {
  flex-shrink: 0;
  font-weight: bold;
  font-size: 1.1rem;
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.toast-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.toast-error .toast-close:hover,
.toast-success .toast-close:hover,
.toast-info .toast-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.toast-warning .toast-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
  
  .toast {
    padding: 0.75rem;
  }
  
  .toast-message {
    font-size: 0.85rem;
  }
}
</style>