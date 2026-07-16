<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'"
    @click="toggle"
  >
    <SunIcon v-if="theme === 'dark'" aria-hidden="true" />
    <MoonIcon v-else aria-hidden="true" />
  </Button>
</template>
