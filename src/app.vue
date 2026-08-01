<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'

const Toaster = defineAsyncComponent(() =>
  import('@/components/ui/sonner').then(module => module.Toaster),
)
const toasterReady = ref(false)

onMounted(() => {
  const mountToaster = () => {
    toasterReady.value = true
  }
  if (window.requestIdleCallback) {
    window.requestIdleCallback(mountToaster, { timeout: 1_500 })
  } else {
    window.setTimeout(mountToaster, 1_000)
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster v-if="toasterReady" position="top-center" rich-colors />
  </ClientOnly>
</template>
