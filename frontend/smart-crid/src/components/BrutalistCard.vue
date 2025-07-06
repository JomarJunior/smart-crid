<template>
  <VCard v-bind="$attrs" class="brutalist-card" variant="outlined">
    <VCardTitle class="brutalist-card-title">
      <slot name="title">
      </slot>
    </VCardTitle>
    <VCardText class="brutalist-card-text">
      <slot name="text">
      </slot>
    </VCardText>
    <VCardActions class="brutalist-card-actions">
      <slot name="actions">
      </slot>
    </VCardActions>
  </VCard>
</template>

<script>
export default {
  name: 'BrutalistCard',
  inheritAttrs: false,
  data: () => ({}),
  computed: {},
  methods: {},
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=New+Amsterdam&display=swap');

.brutalist-card-title {
  font-family: 'New Amsterdam', sans-serif !important;
  margin-bottom: 12px;
  font-size: 2.5rem;
  border-radius: 8px;
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-background));
}

.brutalist-card-text {
  font-family: 'New Amsterdam', sans-serif !important;
  font-size: 1.3rem;
  color: rgb(var(--v-theme-accent));
  text-align: justify;
}

.brutalist-card-actions {
  display: flex;
  justify-content: space-between;
  font-family: 'New Amsterdam', sans-serif !important;
  color: rgb(var(--v-theme-secondary));
}

.brutalist-card {
  background-color: rgb(var(--v-theme-background));
  border: 2px solid rgb(var(--v-theme-primary));
  box-shadow: 8px 8px rgb(var(--v-theme-primary));
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
}
</style>
