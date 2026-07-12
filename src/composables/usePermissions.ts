import type { Permission } from '@/types'
import { useSessionStore } from '@/stores/session'

/** Permission-aware UI — deny by default (doc 16) */
export function usePermissions() {
  const session = useSessionStore()
  function can(permission: Permission): boolean {
    return session.can(permission)
  }
  return { can }
}
