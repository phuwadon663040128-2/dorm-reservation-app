<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/composables/useTheme'

const { theme, isThemeSwitching, toggle } = useTheme()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :disabled="isThemeSwitching"
    :aria-busy="isThemeSwitching"
    :aria-label="isThemeSwitching
      ? 'กำลังสลับธีม'
      : theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'"
    @click="toggle"
  >
    <Skeleton v-if="isThemeSwitching" class="size-5 rounded-full" aria-hidden="true" />
    <SunIcon v-else-if="theme === 'dark'" aria-hidden="true" />
    <MoonIcon v-else aria-hidden="true" />
  </Button>
</template>
