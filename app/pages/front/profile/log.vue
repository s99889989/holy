<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useCommonStore} from '~/stores/common.js'
import {useCustomerStore} from '~/stores/customer.js'
import GoogleLoginButton from '~/components/GoogleLoginButton.vue'

definePageMeta({ layout: 'front' })

useSiteHead()

onMounted(() => {
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display =
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block'
          : 'none'
    }
  }
})

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const BASE         = computed(() => commonStore.data.main_url + '/holy/customer')
const BOOKING_BASE = computed(() => commonStore.data.main_url + '/holy/booking')
const LUNCH_BASE   = computed(() => commonStore.data.main_url + '/holy/lunch')

const customer = computed(() => customerStore.customer)
const activeTab = ref('bookings')
const tabs = [
  {key: 'bookings', label: '訂位紀錄'},
  {key: 'lunches',  label: '便當紀錄'},
]

const bookings = ref([])
const lunches  = ref([])
const bookingsLoading = ref(false)
const lunchesLoading  = ref(false)

const fetchAll = async () => {
  bookingsLoading.value = true
  lunchesLoading.value  = true
  try {
    const cid = customerStore.customer?.id ?? ''
    const [b, l] = await Promise.all([
      fetch(`${BASE.value}/bookings?customerId=${cid}`).then(r => r.json()),
      fetch(`${BASE.value}/lunches?customerId=${cid}`).then(r => r.json()),
    ])
    bookings.value = Array.isArray(b) ? b : []
    lunches.value  = Array.isArray(l) ? l : []
  } catch {
  } finally {
    bookingsLoading.value = false
    lunchesLoading.value  = false
  }
}

const onLogin = async () => { await fetchAll() }

const logout = async () => {
  await fetch(`${BASE.value}/logout`, {method: 'POST', credentials: 'include'})
  customerStore.clearCustomer()
  bookings.value = []
  lunches.value  = []
}

// ── 狀態 Badge ────────────────────────────────────────────────────
const statusClass = (status) => {
  const map = {
    '待確認':      'profile-badge--warning',
    '已確認':      'profile-badge--success',
    '已入位':      'profile-badge--teal',
    '已取餐':      'profile-badge--teal',
    '客戶提出取消': 'profile-badge--orange',
    '已取消':      'profile-badge--danger',
  }
  return map[status] || 'profile-badge--muted'
}

// 客戶端顯示用的狀態文字
const statusLabel = (status) => {
  const map = {
    '客戶提出取消': '已提出取消',
    '已取消':      '餐廳已確認取消',
  }
  return map[status] ?? status
}

// 狀態說明提示
const statusHint = (status) => {
  const map = {
    '待確認':      '我們已收到您的預約，將盡快來電確認。',
    '已確認':      '預約已確認，期待您的光臨！',
    '已入位':      '感謝您的到來，用餐愉快！',
    '已取餐':      '感謝您的訂購，歡迎再次光臨！',
    '客戶提出取消': '取消申請已送出，請靜候我們來電確認。',
    '已取消':      '此筆預約已取消，歡迎再次預約。',
  }
  return map[status] ?? ''
}

// 可申請取消的狀態（已取消類不需要）
const canRequestCancel = (status) =>
  status === '待確認' || status === '已確認'

// ── 申請取消 Modal ────────────────────────────────────────────────
const cancelModal = ref({show: false, type: '', item: null, submitting: false})

const openCancelModal = (type, item) => {
  cancelModal.value = {show: true, type, item, submitting: false}
}
const closeCancelModal = () => {
  cancelModal.value = {show: false, type: '', item: null, submitting: false}
}

const confirmCancel = async () => {
  const {type, item} = cancelModal.value
  if (!item) return
  cancelModal.value.submitting = true
  try {
    const apiBase = type === 'booking' ? BOOKING_BASE.value : LUNCH_BASE.value
    await fetch(`${apiBase}/status/${item.date}/${item.id}?status=${encodeURIComponent('客戶提出取消')}`, {
      method: 'PATCH',
      credentials: 'include',
    })
    // 本地更新狀態
    if (type === 'booking') {
      const found = bookings.value.find(b => b.id === item.id)
      if (found) found.status = '客戶提出取消'
    } else {
      const found = lunches.value.find(l => l.id === item.id)
      if (found) found.status = '客戶提出取消'
    }
    closeCancelModal()
  } catch {
    cancelModal.value.submitting = false
  }
}

onMounted(async () => {
  if (customer.value) await fetchAll()
})

watch(customer, async (c) => {
  if (c) await fetchAll()
  else {
    bookings.value = []
    lunches.value  = []
  }
})
</script>

<template>
  <div class="overflow">

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/restaurant/mobile-restaurant-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/restaurant/restaurant-cover.png" alt="">
        <img class="cover-title" src="/images/restaurant/restaurant-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <div class="container" id="body"></div>
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink>
        > 田園餐廳 > 我的紀錄
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-8 col-lg-7 rounded bg-lightGreen py-4 px-3 px-sm-4">

                <!-- 未登入 -->
                <div v-if="!customer" class="profile-empty text-center">
                  <p class="profile-empty__hint">請先登入 Google 帳號查看您的訂位與訂餐紀錄</p>
                  <GoogleLoginButton @login="onLogin"/>
                </div>

                <!-- 已登入 -->
                <template v-else>

                  <!-- Tab 切換 -->
                  <div class="profile-tabs">
                    <button
                      v-for="tab in tabs"
                      :key="tab.key"
                      @click="activeTab = tab.key"
                      class="profile-tab"
                      :class="{ 'profile-tab--active': activeTab === tab.key }"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <!-- 訂位紀錄 -->
                  <div v-if="activeTab === 'bookings'">
                    <div v-if="bookingsLoading" class="profile-loading">載入中…</div>
                    <div v-else-if="bookings.length === 0" class="profile-empty-tab">
                      尚無訂位紀錄
                    </div>
                    <div v-else>
                      <div v-for="b in bookings" :key="b.id" class="profile-card">
                        <div class="profile-card__date profile-card__date--teal">
                          <p class="profile-card__date-month">{{ b.date?.substring(0, 7) }}</p>
                          <p class="profile-card__date-day profile-card__date-day--teal">{{ b.date?.substring(8, 10) }}</p>
                        </div>
                        <div class="profile-card__body">
                          <div class="profile-card__row">
                            <span class="profile-card__name">{{ b.name }}</span>
                            <span class="profile-badge" :class="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
                          </div>
                          <div class="profile-card__meta">
                            <span>🕐 {{ b.time }}</span>
                            <span v-if="b.meatQty > 0">🍖 葷 {{ b.meatQty }}</span>
                            <span v-if="b.fullVegQty > 0">🌿 全素 {{ b.fullVegQty }}</span>
                            <span v-if="b.eggVegQty > 0">🥚 蛋奶素 {{ b.eggVegQty }}</span>
                            <span v-if="b.spiceVegQty > 0">🧄 五辛素 {{ b.spiceVegQty }}</span>
                            <span v-if="b.phone">📞 {{ b.phone }}</span>
                          </div>
                          <p v-if="b.note" class="profile-card__note">{{ b.note }}</p>
                          <p v-if="statusHint(b.status)" class="profile-card__hint" :class="'profile-hint--' + b.status">{{ statusHint(b.status) }}</p>
                          <div v-if="canRequestCancel(b.status)" class="profile-card__actions">
                            <button @click="openCancelModal('booking', b)" class="profile-cancel-btn">
                              申請取消
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 便當紀錄 -->
                  <div v-if="activeTab === 'lunches'">
                    <div v-if="lunchesLoading" class="profile-loading">載入中…</div>
                    <div v-else-if="lunches.length === 0" class="profile-empty-tab">
                      尚無便當訂購紀錄
                    </div>
                    <div v-else>
                      <div v-for="l in lunches" :key="l.id" class="profile-card">
                        <div class="profile-card__date profile-card__date--amber">
                          <p class="profile-card__date-month">{{ l.date?.substring(0, 7) }}</p>
                          <p class="profile-card__date-day profile-card__date-day--amber">{{ l.date?.substring(8, 10) }}</p>
                        </div>
                        <div class="profile-card__body">
                          <div class="profile-card__row">
                            <span class="profile-card__name">{{ l.name }}</span>
                            <span class="profile-badge" :class="statusClass(l.status)">{{ statusLabel(l.status) }}</span>
                          </div>
                          <div class="profile-card__meta">
                            <span>🕐 取餐 {{ l.time }}</span>
                            <span v-if="l.meatQty > 0">🍖 葷 {{ l.meatQty }}</span>
                            <span v-if="l.fullVegQty > 0">🌿 全素 {{ l.fullVegQty }}</span>
                            <span v-if="l.eggVegQty > 0">🥚 蛋奶素 {{ l.eggVegQty }}</span>
                            <span v-if="l.spiceVegQty > 0">🧄 五辛素 {{ l.spiceVegQty }}</span>
                            <span>共 {{ (l.meatQty || 0) + (l.fullVegQty || 0) + (l.eggVegQty || 0) + (l.spiceVegQty || 0) }} 盒</span>
                          </div>
                          <p v-if="l.note" class="profile-card__note">{{ l.note }}</p>
                          <p v-if="statusHint(l.status)" class="profile-card__hint" :class="'profile-hint--' + l.status">{{ statusHint(l.status) }}</p>
                          <div v-if="canRequestCancel(l.status)" class="profile-card__actions">
                            <button @click="openCancelModal('lunch', l)" class="profile-cancel-btn">
                              申請取消
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </template>

              </div>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center2"></div>
      </section>
    </div>

    <div class="container">
      <div class="col-12 text-center my-5">
        <div class="btn col-md-6 cus-button">
          <NuxtLink to="/front/public">回聖母健康農莊首頁</NuxtLink>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>

    <!-- 申請取消確認 Modal -->
    <Teleport to="body">
      <Transition name="cmodal">
        <div v-if="cancelModal.show" class="cmodal-backdrop" @click.self="closeCancelModal">
          <div class="cmodal">
            <div class="cmodal__icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h3 class="cmodal__title">確認申請取消？</h3>
            <p class="cmodal__msg">
              {{ cancelModal.type === 'booking' ? '訂位' : '便當' }}日期：<strong>{{ cancelModal.item?.date }}</strong><br>
              送出後將通知店家，請靜候來電確認，謝謝。
            </p>
            <div class="cmodal__btns">
              <button class="cmodal__btn cmodal__btn--cancel" @click="closeCancelModal" :disabled="cancelModal.submitting">
                返回
              </button>
              <button class="cmodal__btn cmodal__btn--confirm" @click="confirmCancel" :disabled="cancelModal.submitting">
                <span v-if="cancelModal.submitting" class="cmodal__spinner"></span>
                {{ cancelModal.submitting ? '送出中…' : '確認申請' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── 未登入 ── */
.profile-empty {
  background: #fff;
  border: 2px dashed #b8d8d0;
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}
.profile-empty__hint {
  font-size: 15px;
  color: #888;
  margin-bottom: 20px;
}

/* ── Tab ── */
.profile-tabs {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid #e0d8cc;
  margin-bottom: 20px;
}
.profile-tab {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.profile-tab--active {
  color: #1FC29C;
  border-bottom-color: #1FC29C;
}

/* ── 卡片 ── */
.profile-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.profile-card__date {
  flex-shrink: 0;
  width: 56px;
  min-width: 56px;
  text-align: center;
  border-radius: 12px;
  padding: 8px 4px;
}
.profile-card__date--teal  { background-color: #eef7f5; }
.profile-card__date--amber { background-color: #fff8ee; }
.profile-card__date-month {
  font-size: 11px;
  color: #aaa;
  margin: 0;
}
.profile-card__date-day {
  font-size: 22px;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
}
.profile-card__date-day--teal  { color: #1FC29C; }
.profile-card__date-day--amber { color: #f59e0b; }
.profile-card__body {
  flex: 1;
  min-width: 0;
}
.profile-card__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.profile-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.profile-card__meta {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.profile-card__note {
  font-size: 12px;
  color: #bbb;
  font-style: italic;
  margin: 4px 0 0;
}

/* ── 狀態說明 ── */
.profile-card__hint {
  font-size: 12px;
  margin: 8px 0 0;
  padding: 6px 10px;
  border-radius: 8px;
  line-height: 1.5;
}
.profile-hint--待確認      { background: #fff8e6; color: #856404; }
.profile-hint--已確認      { background: #eaf7f2; color: #0d6e4f; }
.profile-hint--已入位      { background: #e6f7f4; color: #0a7a63; }
.profile-hint--已取餐      { background: #e6f7f4; color: #0a7a63; }
.profile-hint--客戶提出取消 { background: #fff3e6; color: #9a4e00; }
.profile-hint--已取消      { background: #fdf0f0; color: #c0392b; }
.profile-card__actions {
  margin-top: 10px;
}

/* ── 申請取消按鈕 ── */
.profile-cancel-btn {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #c0392b;
  background: #fff5f5;
  border: 1px solid #f5c6c6;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.profile-cancel-btn:hover {
  background: #fde8e8;
  border-color: #e74c3c;
}

/* ── 狀態 Badge ── */
.profile-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
}
.profile-badge--warning { background-color: #fff3cd; color: #856404; }
.profile-badge--success { background-color: #d1f0e8; color: #0d6e4f; }
.profile-badge--teal    { background-color: #d0f0eb; color: #0a7a63; }
.profile-badge--orange  { background-color: #fde8cc; color: #9a4e00; }
.profile-badge--danger  { background-color: #fde8e8; color: #c0392b; }
.profile-badge--muted   { background-color: #f0f0f0; color: #888; }

/* ── Loading / Empty ── */
.profile-loading {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #aaa;
}
.profile-empty-tab {
  text-align: center;
  padding: 48px 24px;
  font-size: 14px;
  color: #aaa;
  background: #fff;
  border: 2px dashed #b8d8d0;
  border-radius: 16px;
}

/* ── 申請取消 Modal ── */
.cmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.cmodal {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.cmodal__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.cmodal__icon svg {
  width: 26px;
  height: 26px;
  stroke: #e74c3c;
}
.cmodal__title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}
.cmodal__msg {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 20px;
}
.cmodal__btns {
  display: flex;
  gap: 10px;
}
.cmodal__btn {
  flex: 1;
  padding: 11px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  text-align: center;
}
.cmodal__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cmodal__btn--cancel {
  background: #f5f5f5;
  color: #666;
}
.cmodal__btn--cancel:hover:not(:disabled) { background: #ebebeb; }
.cmodal__btn--confirm {
  background: #e74c3c;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.cmodal__btn--confirm:hover:not(:disabled) { opacity: 0.88; }
.cmodal__spinner {
  width: 13px;
  height: 13px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cspin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes cspin { to { transform: rotate(360deg); } }

/* ── Modal 動畫 ── */
.cmodal-enter-active,
.cmodal-leave-active { transition: opacity 0.2s ease; }
.cmodal-enter-active .cmodal,
.cmodal-leave-active .cmodal { transition: transform 0.2s ease, opacity 0.2s ease; }
.cmodal-enter-from,
.cmodal-leave-to { opacity: 0; }
.cmodal-enter-from .cmodal,
.cmodal-leave-to .cmodal { transform: scale(0.92) translateY(12px); opacity: 0; }
</style>
