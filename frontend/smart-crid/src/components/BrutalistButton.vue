<template>
  <VBtn
    class="brutalist-button"
    color="primary"
    variant="outlined"
    :to="$attrs.to"
    v-bind="$attrs"
    :prepend-icon="prependIcon"
  >
    <slot />
  </VBtn>
</template>

<script>
export default {
  name: "BrutalistButton",
  inheritAttrs: false,
  props: {
    text: {
      type: String,
      default: "Button",
    },
    prependIcon: {
      type: String,
      default: "mdi-hand-pointing-right",
    },
  },
};
</script>

<style scoped>
.brutalist-button {
  font-family: "New Amsterdam", sans-serif !important;
  font-size: 1.5rem;
  text-transform: uppercase;
  box-shadow: 5px 5px rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-secondary));
  background-color: rgb(var(--v-theme-background));
}

.brutalist-button:hover {
  box-shadow: 2px 2px rgb(var(--v-theme-primary));
  transform: translate(3px, 3px);
}

.brutalist-button:focus,
.brutalist-button:active {
  box-shadow: 0px 0px rgb(var(--v-theme-background)) !important;
  transform: translate(5px, 5px);
}
</style>
