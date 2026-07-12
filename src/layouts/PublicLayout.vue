<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { BuildingIcon, LogInIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

function goToPortal() {
  router.push(session.isStaff ? '/staff' : '/app')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <RouterLink to="/" class="flex items-center gap-2 font-bold">
          <BuildingIcon class="size-5 text-primary" aria-hidden="true" />
          <span>ระบบจองหอพักในกำกับ มข.</span>
        </RouterLink>
        <nav class="flex items-center gap-1 text-sm">
          <RouterLink to="/rooms" class="rounded-md px-3 py-2 hover:bg-muted">ดูห้องพัก</RouterLink>
          <Button v-if="!session.isLoggedIn" size="sm" @click="router.push('/login')">
            <LogInIcon aria-hidden="true" />
            เข้าสู่ระบบ
          </Button>
          <Button v-else size="sm" variant="outline" @click="goToPortal">
            {{ session.isStaff ? 'พื้นที่เจ้าหน้าที่' : 'การจองของฉัน' }}
          </Button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <RouterView />
    </main>

    <footer class="border-t py-6 text-center text-xs text-muted-foreground">
      ต้นแบบระบบ (Interactive Prototype) — ข้อมูลทั้งหมดเป็นข้อมูลสมมติ ·
      Pilot: วรเรสซิเดนซ์ / หอ 8 หลัง + หอพักวรอินเตอร์ · กองบริการหอพักนักศึกษา มหาวิทยาลัยขอนแก่น
    </footer>
  </div>
</template>
