// stores/permission.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const perms    = ref({})
  const loaded   = ref(false)
  const loadedId = ref(null)

  // ── 單次 fetch（內部用）──────────────────────────────────────────
  const fetchPerms = async (customerId, baseUrl) => {
    const query = customerId ? `?customerId=${customerId}` : ''
    const res   = await fetch(`${baseUrl}/holy/permission/my-perms${query}`)

    if (!res.ok) {
      const err = new Error(`my-perms ${res.status}`)
      err.status = res.status
      throw err
    }

    const data = await res.json()
    return (data && typeof data === 'object') ? data : {}
  }

  // ── 載入權限 ──────────────────────────────────────────────────────
  // silent=true 時：背景刷新，失敗不動舊資料、不擋畫面
  //
  // 舊版寫法有兩個問題：
  //   1. 完全沒有重試——手機在訊號差的地方，fetch 逾時或伺服器暫時
  //      回傳非 JSON 的 502 錯誤頁，都會讓 res.json() 直接 throw，
  //      非 silent 呼叫就立刻把 perms 清空。
  //   2. finally 區塊無條件把 loaded 設成 true，且 loaded 會被
  //      persist 下來。失敗一次之後，下次同一個 customerId 進來，
  //      load() 一開頭就因為「已經 loaded 過」直接 return，
  //      永遠不會再重新抓權限，除非登出重新登入。
  //
  // 現在的策略：
  //   1. 任何失敗（含 401/403/404）先重試一次（等一下讓網路恢復）
  //   2. 兩次都失敗，且都是 401/403/404 → 後端明確表示「真的沒有
  //      權限資料」，才把 perms 設為空物件
  //   3. 兩次都失敗，但不是 401/403/404（網路斷線、5xx、逾時）
  //      → 保留舊的 perms（persist 下來的快取），loaded 維持 false，
  //      讓下一次（換頁 / 重新整理）還能再重試，不會永久卡死
  const load = async (customerId, baseUrl, silent = false) => {
    const id = customerId != null ? String(customerId) : null
    if (loaded.value && loadedId.value === id && !silent) return

    let lastErr = null

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 1) {
        // 第一次失敗後，稍等一下再試一次
        await new Promise(resolve => setTimeout(resolve, 1200))
      }
      try {
        const data = await fetchPerms(customerId, baseUrl)
        perms.value    = data
        loadedId.value = id
        loaded.value   = true
        return
      } catch (err) {
        lastErr = err
      }
    }

    // 兩次都失敗
    const status = lastErr?.status
    if (status === 401 || status === 403 || status === 404) {
      // 連續兩次都明確表示沒有權限資料，才真的視為空的
      perms.value    = {}
      loadedId.value = id
      loaded.value   = true
    } else {
      // 網路斷線 / 5xx 等暫時性錯誤：不清空既有 perms，維持 loaded = false
      // 讓下次進頁面時還能再拉一次，不會永久卡在錯的空狀態
      loaded.value = false
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
  persist: {
    // loaded 不 persist：每次重開頁面/重新整理都會嘗試重拉一次確保新鮮，
    //   也避免「失敗一次就永久卡死」的舊 bug
    // perms persist：重整/重開時 navbar 有舊值先撐著，拉完再更新；
    //   即使這次拉取失敗也不會被清空，避免畫面突然變空
    // loadedId persist：load() 的去重判斷需要知道上次是誰
    pick: ['perms', 'loadedId']
  }
})