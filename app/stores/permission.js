// stores/permission.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const perms    = ref({})
  const loaded   = ref(false)
  const loadedId = ref(null)

  // ── 載入權限 ──────────────────────────────────────────────────────
  // silent=true 時：背景刷新，不重置 loaded（頁面不會閃爍）
  const load = async (customerId, baseUrl, silent = false) => {
    const id = customerId != null ? String(customerId) : null  // ← 統一 string
    if (loaded.value && loadedId.value === id && !silent) return

    try {
      const query = customerId ? `?customerId=${customerId}` : ''
      const res   = await fetch(`${baseUrl}/holy/permission/my-perms${query}`)
      const data  = await res.json()
      perms.value    = (data && typeof data === 'object') ? data : {}
      loadedId.value = id  // ← 統一 string
    } catch {
      if (!silent) perms.value = {}
    } finally {
      loaded.value = true
    }
  }

  // ── 登出清除 ──────────────────────────────────────────────────────
  const clear = () => {
    perms.value    = {}
    loaded.value   = false
    loadedId.value = null
  }

  const can    = (key)      => perms.value[key] === true
  const canAny = (...keys)  => keys.some(k => can(k))
  const canAll = (...keys)  => keys.every(k => can(k))

  return { perms, loaded, loadedId, load, clear, can, canAny, canAll }
}, {
  persist: true  // perms + loaded + loadedId 全部 persist
})
