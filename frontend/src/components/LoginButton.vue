<template>
  <a href="/api/auth/twitter" class="login-button">
    <slot>Login with Twitter</slot>
  </a>
</template>

<style scoped>
.login-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #1da1f2;
  color: white;
  border-radius: 9999px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.login-button:hover {
  background-color: #0c85d0;
}
</style>
