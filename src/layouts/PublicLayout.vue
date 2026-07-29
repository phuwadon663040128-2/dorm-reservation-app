<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import GlobalHeader from '@/components/domain/GlobalHeader.vue'
import LoginDialog from '@/components/domain/LoginDialog.vue'

const router = useRouter()
const route = useRoute()

function internalRedirect(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) return undefined
  return candidate
}

const loginAuth = computed<'login' | 'register' | 'verify' | undefined>(() => {
  const value = Array.isArray(route.query.auth) ? route.query.auth[0] : route.query.auth
  return value === 'login' || value === 'register' || value === 'verify' ? value : undefined
})
const loginOpen = computed(() => loginAuth.value !== undefined)
const loginInitialView = computed(() => loginAuth.value ?? 'login')
const loginRedirect = computed(() => internalRedirect(route.query.redirect))
const loginReset = computed(() => route.query.reset === '1')
const loginEmail = computed(() => {
  const value = Array.isArray(route.query.authEmail) ? route.query.authEmail[0] : route.query.authEmail
  return typeof value === 'string' ? value : undefined
})

function roomSelectionRedirect() {
  if (route.name !== 'public-rooms') return undefined
  const query: LocationQueryRaw = { ...route.query }
  delete query.auth
  delete query.redirect
  delete query.reset
  delete query.authEmail
  return router.resolve({ name: 'app-rooms', query, hash: route.hash }).fullPath
}

function openLogin(redirect?: string) {
  const query: LocationQueryRaw = { ...route.query, auth: 'login' }
  delete query.redirect
  delete query.reset
  delete query.authEmail
  const safeRedirect = internalRedirect(redirect) ?? roomSelectionRedirect()
  if (safeRedirect) query.redirect = safeRedirect
  router.push({ path: route.path, query, hash: route.hash })
}

function closeLogin() {
  const query: LocationQueryRaw = { ...route.query }
  delete query.auth
  delete query.redirect
  delete query.reset
  delete query.authEmail
  router.replace({ path: route.path, query, hash: route.hash })
}

function handleLoginOpenChange(isOpen: boolean) {
  if (!isOpen) closeLogin()
}

function finishLogin(destination: string) {
  router.replace(destination)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <GlobalHeader context="public" @request-login="openLogin()" />

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t">
      <div class="mx-auto flex w-full max-w-352 flex-col gap-2 px-3 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p>
          <span class="font-bold">หอพักในกำกับ มหาวิทยาลัยขอนแก่น</span>
          <span class="ml-3 text-muted-foreground">กองบริการหอพักนักศึกษา</span>
        </p>
        <p class="text-muted-foreground">043-204-303 · dormitory@kku.ac.th · จันทร์–ศุกร์ 08:30–16:30 น.</p>
      </div>
      <p class="pb-4 text-center text-xs text-muted-foreground/70">
        ต้นแบบระบบ (Interactive Prototype) — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ
      </p>
    </footer>

    <LoginDialog
      :open="loginOpen"
      :redirect="loginRedirect"
      :reset="loginReset"
      :initial-view="loginInitialView"
      :email="loginEmail"
      @update:open="handleLoginOpenChange"
      @signed-in="finishLogin"
    />
  </div>
</template>
