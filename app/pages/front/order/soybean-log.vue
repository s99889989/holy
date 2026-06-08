<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCommonStore } from '~/stores/common.js'

definePageMeta({ layout: 'staff' })

const commonStore = useCommonStore()
const BASE = computed(() => commonStore.data.main_url + '/holy/soybean')

// ── 月份選擇 ──────────────────────────────────────────────────────
function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const selectedMonth = ref(thisMonth())

// 產生前後 6 個月的選項
const monthOptions = computed(() => {
  const opts = []
  const now = new Date()
  for (let i = 0; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
    opts.push({val, label})
  }
  return opts
})

// ── 資料 ──────────────────────────────────────────────────────────
const loading = ref(false)
const totalSoymilk = ref(0)
const totalTofu = ref(0)
const orders = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetch(`${BASE.value}/admin/list?month=${selectedMonth.value}`, {
      credentials: 'include',
    })
    const data = await res.json()
    totalSoymilk.value = data.totalSoymilk ?? 0
    totalTofu.value = data.totalTofu ?? 0
    orders.value = data.orders ?? []
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// ── 篩選 ──────────────────────────────────────────────────────────
const filterDay = ref('')   // '' | 'tue' | 'fri'
const filterStatus = ref('')   // '' | 待確認 | 已確認 | 已取貨 | 已取消

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    if (filterDay.value && o.pickupDay !== filterDay.value) return false
    if (filterStatus.value && o.status !== filterStatus.value) return false
    return true
  })
})

// 篩選後的彙總
const filteredSoymilk = computed(() =>
    filteredOrders.value.reduce((s, o) => s + (o.soymilkQty || 0), 0))
const filteredTofu = computed(() =>
    filteredOrders.value.reduce((s, o) => s + (o.tofuQty || 0), 0))

// ── 狀態更新 ──────────────────────────────────────────────────────
const updatingId = ref('')

const updateStatus = async (order, newStatus) => {
  updatingId.value = order.id
  try {
    await fetch(`${BASE.value}/admin/status/${order.month}/${order.id}?status=${encodeURIComponent(newStatus)}`, {
      method: 'PATCH',
      credentials: 'include',
    })
    order.status = newStatus
  } catch {
    alert('更新失敗')
  } finally {
    updatingId.value = ''
  }
}

// ── 狀態樣式 ──────────────────────────────────────────────────────
const statusClass = (s) => ({
  '待確認': 'sl-badge sl-badge--warn',
  '已確認': 'sl-badge sl-badge--info',
  '已取貨': 'sl-badge sl-badge--success',
  '已取消': 'sl-badge sl-badge--danger',
}[s] || 'sl-badge sl-badge--muted')

const pickupLabel = (d) => d === 'tue' ? '週二' : d === 'fri' ? '週五' : d

const STATUSES = ['待確認', '已確認', '已取貨', '已取消']

// ── 刪除 ──────────────────────────────────────────────────────────
const deleteModal = ref({show: false, order: null, submitting: false})

const openDeleteModal = (order) => {
  deleteModal.value = {show: true, order, submitting: false}
}
const closeDeleteModal = () => {
  deleteModal.value = {show: false, order: null, submitting: false}
}

const confirmDelete = async () => {
  const {order} = deleteModal.value
  if (!order) return
  deleteModal.value.submitting = true
  try {
    const res = await fetch(`${BASE.value}/admin/order/${order.month}/${order.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (data.error) {
      alert('刪除失敗：' + data.error);
      return
    }
    orders.value = orders.value.filter(o => o.id !== order.id)
    closeDeleteModal()
  } catch {
    alert('刪除失敗')
  } finally {
    deleteModal.value.submitting = false
  }
}
</script>

<template>
  <div class="sl-page">

    <!-- Page Title -->
    <div class="sl-head">
      <h1 class="sl-head__title">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             class="sl-head__icon">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
        豆製品訂購管理
      </h1>
    </div>

    <!-- 月份選擇 + 查詢 -->
    <div class="sl-toolbar">
      <select v-model="selectedMonth" class="sl-select" @change="fetchData">
        <option v-for="o in monthOptions" :key="o.val" :value="o.val">{{ o.label }}</option>
      </select>
      <button class="sl-btn sl-btn--primary" @click="fetchData" :disabled="loading">
        <svg v-if="loading" class="sl-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {{ loading ? '載入中…' : '重新整理' }}
      </button>
    </div>

    <!-- 彙總卡片 -->
    <div class="sl-summary-row">
      <div class="sl-summary-card">
        <div class="sl-summary-card__label">本月訂單</div>
        <div class="sl-summary-card__value">{{ orders.length }}</div>
        <div class="sl-summary-card__sub">筆</div>
      </div>
      <div class="sl-summary-card sl-summary-card--green">
        <div class="sl-summary-card__label">豆漿（本月）</div>
        <div class="sl-summary-card__value">{{ totalSoymilk }}</div>
        <div class="sl-summary-card__sub">袋</div>
      </div>
      <div class="sl-summary-card sl-summary-card--amber">
        <div class="sl-summary-card__label">豆腐（本月）</div>
        <div class="sl-summary-card__value">{{ totalTofu }}</div>
        <div class="sl-summary-card__sub">塊</div>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="sl-filter-row">
      <div class="sl-filter-group">
        <label class="sl-filter-label">取貨日</label>
        <div class="sl-filter-chips">
          <button class="sl-chip" :class="{ active: filterDay === '' }" @click="filterDay = ''">全部</button>
          <button class="sl-chip" :class="{ active: filterDay === 'tue' }" @click="filterDay = 'tue'">週二</button>
          <button class="sl-chip" :class="{ active: filterDay === 'fri' }" @click="filterDay = 'fri'">週五</button>
        </div>
      </div>
      <div class="sl-filter-group">
        <label class="sl-filter-label">狀態</label>
        <div class="sl-filter-chips">
          <button class="sl-chip" :class="{ active: filterStatus === '' }" @click="filterStatus = ''">全部</button>
          <button v-for="s in STATUSES" :key="s"
                  class="sl-chip" :class="{ active: filterStatus === s }"
                  @click="filterStatus = s">{{ s }}
          </button>
        </div>
      </div>
      <div v-if="filterDay || filterStatus" class="sl-filter-summary">
        篩選結果：豆漿 <strong>{{ filteredSoymilk }}</strong> 袋 ／ 豆腐 <strong>{{ filteredTofu }}</strong> 塊（共
        {{ filteredOrders.length }} 筆）
      </div>
    </div>

    <!-- 訂單列表 -->
    <div v-if="loading" class="sl-empty">載入中…</div>
    <div v-else-if="filteredOrders.length === 0" class="sl-empty">本月尚無訂購紀錄</div>
    <div v-else class="sl-table-wrap">
      <table class="sl-table">
        <thead>
        <tr>
          <th>訂購時間</th>
          <th>姓名</th>
          <th>聯絡</th>
          <th>取貨日</th>
          <th>豆漿</th>
          <th>豆腐</th>
          <th>金額</th>
          <th>備註</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in filteredOrders" :key="o.id" :class="{ 'sl-row--cancelled': o.status === '已取消' }">
          <td class="sl-td-time">{{ o.createdAt?.substring(0, 16) }}</td>
          <td class="sl-td-name">{{ o.name }}</td>
          <td class="sl-td-contact">{{ o.contact }}</td>
          <td>
              <span class="sl-day-badge" :class="o.pickupDay === 'tue' ? 'sl-day-badge--tue' : 'sl-day-badge--fri'">
                {{ pickupLabel(o.pickupDay) }}
              </span>
          </td>
          <td class="sl-td-center">
            <span v-if="o.soymilkQty" class="sl-qty">{{ o.soymilkQty }} 袋</span>
            <span v-else class="sl-qty sl-qty--none">—</span>
          </td>
          <td class="sl-td-center">
            <span v-if="o.tofuQty" class="sl-qty">{{ o.tofuQty }} 塊</span>
            <span v-else class="sl-qty sl-qty--none">—</span>
          </td>
          <td class="sl-td-price">${{ (o.soymilkQty || 0) * 50 + (o.tofuQty || 0) * 50 }}</td>
          <td class="sl-td-remark">{{ o.remark || '—' }}</td>
          <td><span :class="statusClass(o.status)">{{ o.status }}</span></td>
          <td>
            <div class="sl-action-group">
              <button
                  v-for="s in STATUSES.filter(s => s !== o.status)"
                  :key="s"
                  class="sl-action-btn"
                  :disabled="updatingId === o.id"
                  @click="updateStatus(o, s)"
              >{{ s }}
              </button>
              <button class="sl-action-btn sl-action-btn--delete" :disabled="updatingId === o.id"
                      @click="openDeleteModal(o)">
                刪除
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 刪除確認 Modal -->
    <Teleport to="body">
      <Transition name="sl-modal-fade">
        <div v-if="deleteModal.show" class="sl-modal-backdrop" @click.self="closeDeleteModal">
          <div class="sl-modal">
            <div class="sl-modal__icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 class="sl-modal__title">確認刪除訂單？</h3>
            <p class="sl-modal__msg" v-if="deleteModal.order">
              <strong>{{ deleteModal.order.name }}</strong>　{{ pickupLabel(deleteModal.order.pickupDay) }} 取貨<br>
              <span v-if="deleteModal.order.soymilkQty">豆漿 × {{ deleteModal.order.soymilkQty }} 袋　</span>
              <span v-if="deleteModal.order.tofuQty">豆腐 × {{ deleteModal.order.tofuQty }} 塊</span>
              <br><small class="sl-modal__warn">刪除後無法復原</small>
            </p>
            <div class="sl-modal__btns">
              <button class="sl-modal__btn sl-modal__btn--cancel" @click="closeDeleteModal"
                      :disabled="deleteModal.submitting">取消
              </button>
              <button class="sl-modal__btn sl-modal__btn--delete" @click="confirmDelete"
                      :disabled="deleteModal.submitting">
                <span v-if="deleteModal.submitting" class="sl-modal__spinner"></span>
                {{ deleteModal.submitting ? '刪除中…' : '確認刪除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.sl-page {
  padding: 1.5rem;
  font-family: 'Noto Sans TC', sans-serif;
  max-width: 1200px;
}

/* ── Head ── */
.sl-head {
  margin-bottom: 1.25rem;
}

.sl-head__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a3d28;
  margin: 0;
}

.sl-head__icon {
  width: 22px;
  height: 22px;
  color: #3d7a52;
  flex-shrink: 0;
}

/* ── Toolbar ── */
.sl-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.sl-select {
  padding: 7px 12px;
  border: 1.5px solid #c5d4be;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #2a2e25;
  font-family: inherit;
  cursor: pointer;
  outline: none;
}

.sl-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
}

.sl-btn--primary {
  background: #3d7a52;
  color: #fff;
  border: none;
}

.sl-btn--primary:hover:not(:disabled) {
  background: #2a5c3a;
}

.sl-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sl-spinner {
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 彙總卡片 ── */
.sl-summary-row {
  display: flex;
  gap: 12px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.sl-summary-card {
  flex: 1;
  min-width: 130px;
  background: #fff;
  border: 1px solid #dce8d8;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sl-summary-card--green {
  border-color: #b8d8c4;
  background: #f4fdf7;
}

.sl-summary-card--amber {
  border-color: #f0d080;
  background: #fffbf0;
}

.sl-summary-card__label {
  font-size: 12px;
  color: #8a9e84;
  margin-right: auto;
}

.sl-summary-card__value {
  font-size: 22px;
  font-weight: 800;
  color: #1a3d28;
}

.sl-summary-card__sub {
  font-size: 13px;
  color: #5a6e54;
}

/* ── 篩選 ── */
.sl-filter-row {
  background: #fff;
  border: 1px solid #dce8d8;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.sl-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sl-filter-label {
  font-size: 12px;
  color: #8a9e84;
  white-space: nowrap;
}

.sl-filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sl-chip {
  padding: 4px 12px;
  border: 1.5px solid #c5d4be;
  border-radius: 20px;
  background: #fafcf9;
  color: #5a6e54;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
}

.sl-chip.active {
  background: #3d7a52;
  color: #fff;
  border-color: #3d7a52;
}

.sl-filter-summary {
  font-size: 13px;
  color: #3d7a52;
  background: #f0f9f4;
  border-radius: 8px;
  padding: 5px 12px;
}

.sl-filter-summary strong {
  font-weight: 700;
}

/* ── Table ── */
.sl-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #dce8d8;
}

.sl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
}

.sl-table thead {
  background: #f4f9f2;
}

.sl-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #3a4e36;
  white-space: nowrap;
  border-bottom: 2px solid #dce8d8;
}

.sl-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f5ee;
  vertical-align: middle;
  color: #2a2e25;
}

.sl-table tbody tr:last-child td {
  border-bottom: none;
}

.sl-table tbody tr:hover td {
  background: #fafcf9;
}

.sl-row--cancelled td {
  opacity: 0.5;
}

.sl-td-time {
  font-size: 12px;
  color: #8a9e84;
  white-space: nowrap;
}

.sl-td-name {
  font-weight: 600;
}

.sl-td-contact {
  font-size: 12px;
}

.sl-td-center {
  text-align: center;
}

.sl-td-price {
  font-weight: 600;
  color: #1a3d28;
}

.sl-td-remark {
  font-size: 12px;
  color: #aaa;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 取貨日 Badge ── */
.sl-day-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.sl-day-badge--tue {
  background: #e8f5ee;
  color: #1a5c3a;
}

.sl-day-badge--fri {
  background: #eef4ff;
  color: #1a3d8c;
}

/* ── 數量 ── */
.sl-qty {
  font-weight: 600;
  color: #2a5c3a;
}

.sl-qty--none {
  color: #ccc;
  font-weight: 400;
}

/* ── 狀態 Badge ── */
.sl-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.sl-badge--warn {
  background: #fff3cd;
  color: #856404;
}

.sl-badge--info {
  background: #d1f0e8;
  color: #0d6e4f;
}

.sl-badge--success {
  background: #d0f0eb;
  color: #0a7a63;
}

.sl-badge--danger {
  background: #fde8e8;
  color: #c0392b;
}

.sl-badge--muted {
  background: #f0f0f0;
  color: #888;
}

/* ── 操作 ── */
.sl-action-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.sl-action-btn {
  padding: 3px 8px;
  font-size: 11px;
  font-family: inherit;
  border: 1.5px solid #c5d4be;
  border-radius: 6px;
  background: #fafcf9;
  color: #3a4e36;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

.sl-action-btn:hover:not(:disabled) {
  background: #3d7a52;
  color: #fff;
  border-color: #3d7a52;
}

.sl-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Empty ── */
.sl-empty {
  text-align: center;
  padding: 48px;
  font-size: 14px;
  color: #aaa;
  background: #fff;
  border: 2px dashed #dce8d8;
  border-radius: 12px;
}

/* ── 刪除按鈕 ── */
.sl-action-btn--delete {
  border-color: #f5c6c6 !important;
  color: #c0392b !important;
}

.sl-action-btn--delete:hover:not(:disabled) {
  background: #e74c3c !important;
  color: #fff !important;
  border-color: #e74c3c !important;
}

/* ── 刪除 Modal ── */
.sl-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.sl-modal {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.sl-modal__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.sl-modal__icon svg {
  width: 26px;
  height: 26px;
  stroke: #e74c3c;
}

.sl-modal__title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}

.sl-modal__msg {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 20px;
}

.sl-modal__warn {
  color: #e74c3c;
  font-size: 12px;
}

.sl-modal__btns {
  display: flex;
  gap: 10px;
}

.sl-modal__btn {
  flex: 1;
  padding: 11px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  font-family: inherit;
}

.sl-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sl-modal__btn--cancel {
  background: #f5f5f5;
  color: #666;
}

.sl-modal__btn--cancel:hover:not(:disabled) {
  background: #ebebeb;
}

.sl-modal__btn--delete {
  background: #e74c3c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sl-modal__btn--delete:hover:not(:disabled) {
  background: #c0392b;
}

.sl-modal__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.sl-modal-fade-enter-active, .sl-modal-fade-leave-active {
  transition: opacity 0.2s;
}

.sl-modal-fade-enter-from, .sl-modal-fade-leave-to {
  opacity: 0;
}
</style>