<template>
  <VAppBar app color="primary" density="default" dark>
    <template v-for="(item, index) in items" :key="index">
      <VBtn
        v-if="item.path"
        :to="item.path"
        text
        class="ma-2 app-bar-items brutalist-shadow-animated"
      >
        {{ item.name }}
      </VBtn>
      <span v-else class="ma-2 app-bar-items">{{ item.name }}</span>
    </template>

    <VSpacer />

    <VBtn class="mb-3" to="/" variant="plain">
      <VAppBarTitle class="ml-4 app-bar-title">
        <VIcon size="36" icon="mdi-school" class="mr-2" />
        {{ title }}
        <VIcon v-if="developmentEnvironment" size="48" icon="mdi-dev-to" class="ml-2" />
      </VAppBarTitle>
    </VBtn>

    <AddressImpersonator />

    <VBtn
      :icon="isLightTheme ? 'mdi-weather-night' : 'mdi-weather-sunny'"
      @click="toggleDarkTheme"
      size="compact"
    >
    </VBtn>
  </VAppBar>
</template>

<script>
import { useSmartCridStore } from '@/stores/smart-crid';
import AddressImpersonator from './AddressImpersonator.vue';

export default {
  name: 'AppBar',
  components: {
    AddressImpersonator,
  },
  props: {
    title: {
      type: String,
      default: 'Smart CRID',
    },
    items: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    smartCridStore: useSmartCridStore(),
  }),
  computed: {
    developmentEnvironment() {
      // Check if the app is running in development mode
      return import.meta.env.MODE === 'development'
    },
    isLightTheme() {
      // Check if the current theme is light
      return this.smartCridStore.isLightTheme;
    },
  },
  methods: {
    toggleDarkTheme() {
      // Toggle dark theme logic
      this.smartCridStore.toggleTheme();
    },
  },
  mounted() {
    // Initialize the theme
    this.smartCridStore.initialize();
  },
}
</script>

<style scoped>
.app-bar-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
  text-align: right;
  margin-right: 16px;
}

.app-bar-items {
  font-size: 2rem;
}
</style>
