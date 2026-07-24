<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import ApplicantNavigation from '@/components/domain/ApplicantNavigation.vue'
import GlobalHeader from '@/components/domain/GlobalHeader.vue'

const router = useRouter()

function openLogin() {
  router.replace({ path: '/', query: { auth: 'login', redirect: '/app' } })
}
</script>

<template>
  <div class="flex min-h-dvh flex-col overflow-x-clip bg-background text-foreground">
    <GlobalHeader context="applicant" @request-login="openLogin" />
    <ApplicantNavigation />

    <main
      class="mx-auto w-full max-w-352 flex-1 px-3 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-5 lg:pb-6"
    >
      <RouterView />
    </main>
  </div>
</template>
