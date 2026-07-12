<script setup lang="ts">
import { ShieldAlertIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types'

// ซ่อน/แสดงตามสิทธิ์ + สถานะ permission-denied ที่ชัดเจน (frontend state matrix)
const props = defineProps<{ permission: Permission }>()
const { can } = usePermissions()

const allowed = can(props.permission)
</script>

<template>
  <slot v-if="allowed" />
  <Alert v-else variant="destructive">
    <ShieldAlertIcon aria-hidden="true" />
    <AlertTitle>ไม่มีสิทธิ์เข้าถึงส่วนนี้</AlertTitle>
    <AlertDescription>
      ต้องมีสิทธิ์ <code class="font-mono text-xs">{{ permission }}</code> — สิทธิ์แต่ละด้านแยกอิสระตาม RBAC
      หากต้องใช้งานให้ติดต่อผู้ดูแลระบบกองบริการหอพัก
    </AlertDescription>
  </Alert>
</template>
