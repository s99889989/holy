// stores/customer.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCustomerStore = defineStore('customer', () => {
  const customer = ref(null)

  // ── 基本操作 ──────────────────────────────────────────────────
  const setCustomer = (data) => { customer.value = data }
  const clearCustomer = () => { customer.value = null }

  // ── 狀態 computed ─────────────────────────────────────────────
  const isLoggedIn = computed(() => !!customer.value)
  const role       = computed(() => customer.value?.role ?? null)

  // ── 權限 computed ─────────────────────────────────────────────
  // CUSTOMER：一般登入用戶，只能查看 front、訂位、訂便當
  // STAFF   ：員工，可進入 staff 區域查看資料
  // EDITOR  ：可編輯內容（例如新增活動、修改菜單）
  // ADMIN   ：最高權限，可管理所有人的 role

  const isCustomer = computed(() => isLoggedIn.value)  // 有登入就算
  const isStaff    = computed(() => ['STAFF', 'EDITOR', 'ADMIN'].includes(role.value))
  const isEditor   = computed(() => ['EDITOR', 'ADMIN'].includes(role.value))
  const isAdmin    = computed(() => role.value === 'ADMIN')

  return {
    customer,
    setCustomer,
    clearCustomer,
    isLoggedIn,
    role,
    isCustomer,
    isStaff,
    isEditor,
    isAdmin
  }
}, {
  persist: true // 自動存到 localStorage，重整後恢復
})
