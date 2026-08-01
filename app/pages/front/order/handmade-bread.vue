<script setup>
definePageMeta({ layout: false })
useSiteHead({
  title: '麵包預購 | 台東聖母健康農莊',
  description: '聖母健康農莊 × 一一手作，每週新鮮出爐麵包，歡迎線上預訂。',
  ogTitle: '麵包預購 | 台東聖母健康農莊',
  ogDescription: '聖母健康農莊 × 一一手作，每週新鮮出爐麵包，歡迎線上預訂。',
  ogImage: 'https://holymotherfarm.netlify.app/images/order/handmade-bread_og.jpg',
  twitterImage: 'https://holymotherfarm.netlify.app/images/order/handmade-bread_og.jpg',
  ogUrl: 'https://holymotherfarm.netlify.app/front/order/handmade-bread',
})

import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useCommonStore } from '~/stores/common.js'
import { useCustomerStore } from '~/stores/customer.js'

const router = useRouter()

const commonStore   = useCommonStore()
const customerStore = useCustomerStore()
const BASE          = computed(() => commonStore.data.main_url + '/holy/customer')
const HANDMADE_BREAD_BASE     = computed(() => commonStore.data.main_url + '/holy/handmade-bread')
const GOOGLE_CLIENT_ID = computed(() => commonStore.data.google_client_id)

const customer = computed(() => customerStore.customer)

// ── 出爐日設定（動態抓後端）─────────────────────────────────────
// ISO 星期數字：1=一 2=二 3=三 4=四 5=五 6=六 7=日
const DOW_LABEL = { 1: '週一', 2: '週二', 3: '週三', 4: '週四', 5: '週五', 6: '週六', 7: '週日' }
const DOW_CODE  = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun' }

const businessDays = ref([1, 5]) // 預設值（後端還沒回來前先顯示），實際以後端設定為準

async function fetchBusinessDays() {
  try {
    const res  = await fetch(`${HANDMADE_BREAD_BASE.value}/settings/business-days`)
    const data = await res.json()
    if (Array.isArray(data.businessDays) && data.businessDays.length > 0) {
      businessDays.value = data.businessDays
    }
  } catch {}
}

// ── 品項清單（動態抓後端）───────────────────────────────────────
const items = ref([]) // [{ code, name, price, unit }]

async function fetchItems() {
  try {
    const res  = await fetch(`${HANDMADE_BREAD_BASE.value}/settings/items`)
    const data = await res.json()
    if (Array.isArray(data.items)) items.value = data.items
  } catch {}
}

function itemByCode(code) { return items.value.find(i => i.code === code) }

// ── 日期工具 ────────────────────────────────────────────────────
function getNext(dow, offsetWeeks = 0) {
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const jsDow = dow % 7
  const diff = ((jsDow - base.getDay() + 7) % 7) || 7
  const n = new Date(base)
  n.setDate(base.getDate() + diff + offsetWeeks * 7)
  return n
}
function fmt(d) { return `${d.getMonth() + 1}月${d.getDate()}日` }
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const MAX_WEEK_OFFSET = 8
const weekOffset = ref(0)
const weekOffsetLabel = computed(() => {
  const presetLabels = ['本週', '下週', '下下週']
  if (weekOffset.value < presetLabels.length) return presetLabels[weekOffset.value]
  const opt = pickupDayOptions.value[0]
  return opt ? `${opt.dateStr} 那週` : `第 ${weekOffset.value + 1} 週`
})

const pickupDayOptions = computed(() =>
    businessDays.value
        .map((dow) => {
          const date = getNext(dow, weekOffset.value)
          return {
            dow,
            code:    DOW_CODE[dow] || 'mon',
            label:   DOW_LABEL[dow] || '',
            dateStr: fmt(date),
            dateKey: toDateStr(date),
          }
        })
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
)

const businessDaysLabel = computed(() =>
    businessDays.value.map(dow => (DOW_LABEL[dow] || '').replace('週', '')).join('、')
)

// ── 休息日 ──────────────────────────────────────────────────────
const closedDates = ref([])
function isDateClosed(dateKey) { return closedDates.value.includes(dateKey) }

const closedMap = computed(() => {
  const m = {}
  for (const opt of pickupDayOptions.value) m[opt.code] = isDateClosed(opt.dateKey)
  return m
})
const allDaysClosed = computed(() =>
    pickupDayOptions.value.length > 0 && pickupDayOptions.value.every(o => closedMap.value[o.code])
)

async function fetchClosedDates() {
  try {
    const res  = await fetch(`${HANDMADE_BREAD_BASE.value}/admin/settings/closed-dates`)
    const data = await res.json()
    closedDates.value = Array.isArray(data.closedDates) ? data.closedDates : []
    selDates.value = selDates.value.filter(dateKey => !isDateClosed(dateKey))
    if (selDates.value.length === 0) {
      const alt = pickupDayOptions.value.find(o => !isDateClosed(o.dateKey))
      if (alt) { selDates.value = [alt.dateKey]; ensureDateQty(alt.dateKey) }
    }
  } catch {}
}

// ── 狀態 ────────────────────────────────────────────────────────
// selDates：目前已選的取貨「實際日期」；dateQty[dateKey].itemQty[code] = 數量
const selDates = ref([])
const dateQty  = ref({})
const name     = ref('')
const contact  = ref('')
const remark   = ref('')

function dateInfo(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const jsDow = d.getDay()
  const dow   = jsDow === 0 ? 7 : jsDow
  return { dateKey, dow, code: DOW_CODE[dow] || 'mon', label: DOW_LABEL[dow] || '', dateStr: fmt(d) }
}

const sortedSelDates = computed(() => [...selDates.value].sort())

function emptyItemQty() {
  const q = {}
  for (const it of items.value) q[it.code] = 0
  return q
}
function ensureDateQty(dateKey) {
  if (!dateQty.value[dateKey]) dateQty.value[dateKey] = { itemQty: emptyItemQty() }
}
function toggleDate(dateKey) {
  if (isDateClosed(dateKey)) return
  const idx = selDates.value.indexOf(dateKey)
  if (idx >= 0) {
    selDates.value.splice(idx, 1)
  } else {
    selDates.value.push(dateKey)
    ensureDateQty(dateKey)
  }
}
function removeDate(dateKey) {
  const idx = selDates.value.indexOf(dateKey)
  if (idx >= 0) selDates.value.splice(idx, 1)
  delete dateQty.value[dateKey]
}
function adjDateItem(dateKey, code, delta) {
  ensureDateQty(dateKey)
  const cur = dateQty.value[dateKey].itemQty[code] || 0
  dateQty.value[dateKey].itemQty[code] = Math.max(0, cur + delta)
}
function setDateItem(dateKey, code, val) {
  ensureDateQty(dateKey)
  dateQty.value[dateKey].itemQty[code] = Math.max(0, parseInt(val) || 0)
}
function applyToAllDates(sourceKey) {
  ensureDateQty(sourceKey)
  const src = { ...dateQty.value[sourceKey].itemQty }
  for (const dateKey of selDates.value) {
    if (dateKey === sourceKey) continue
    ensureDateQty(dateKey)
    dateQty.value[dateKey].itemQty = { ...src }
  }
}
function labelFor(dateKey) {
  const info = dateInfo(dateKey)
  return `${info.label} ${info.dateStr}`
}
function dateItemLines(dateKey) {
  ensureDateQty(dateKey)
  const q = dateQty.value[dateKey].itemQty
  return items.value
      .filter(it => (q[it.code] || 0) > 0)
      .map(it => ({ ...it, qty: q[it.code] }))
}
function dateTotal(dateKey) {
  return dateItemLines(dateKey).reduce((s, l) => s + l.price * l.qty, 0)
}

// ── 包月：直接選擇月份，一次加入該月所有可訂購的日期 ─────────────
const packageMonthOptions = computed(() => {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    opts.push({
      val:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`,
    })
  }
  return opts
})
const packageMonth = ref(packageMonthOptions.value[0]?.val || '')
const packageItemQty = reactive({})
function ensurePackageQty() {
  for (const it of items.value) if (!(it.code in packageItemQty)) packageItemQty[it.code] = 0
}
function adjPackageItem(code, delta) {
  ensurePackageQty()
  packageItemQty[code] = Math.max(0, (packageItemQty[code] || 0) + delta)
}
const packageShowAll = ref(false)

function applyMonthPackage() {
  if (!packageMonth.value) return
  ensurePackageQty()
  const hasQty = Object.values(packageItemQty).some(v => v > 0)
  if (!hasQty) {
    alert('請先填寫每次要訂的麵包數量')
    return
  }
  const [y, m] = packageMonth.value.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const todayKey = toDateStr(new Date())
  let addedCount = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(y, m - 1, day)
    const dateKey = toDateStr(d)
    if (dateKey < todayKey) continue
    const jsDow = d.getDay()
    const dow   = jsDow === 0 ? 7 : jsDow
    if (!businessDays.value.includes(dow)) continue
    if (isDateClosed(dateKey)) continue
    if (!selDates.value.includes(dateKey)) selDates.value.push(dateKey)
    dateQty.value[dateKey] = { itemQty: { ...packageItemQty } }
    addedCount++
  }
  if (addedCount === 0) {
    alert('這個月沒有可以加入的取貨日（可能都已過期，或該月尚無出爐日設定）')
  }
}

// 名稱建議
const knownNames  = ref([])
const suggestions = ref([])
const showSuggest = ref(false)

// 登入面板
const loginPanelOpen = ref(false)

// 送出成功 modal
const successModal   = ref(false)
const successMsg      = ref('')
const submitting      = ref(false)
const errorMsg        = ref('')

// ── Google 登入 ──────────────────────────────────────────────────
const initGoogle = () => {
  if (!window.google) return
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID.value,
    callback: handleCredential,
    auto_select: false,
  })
}

const renderGoogleBtn = (elId) => {
  if (!window.google) return
  const el = document.getElementById(elId)
  if (!el) return
  window.google.accounts.id.renderButton(el, {
    theme: 'outline', size: 'medium', text: 'signin_with', locale: 'zh-TW', width: 220,
  })
}

const handleCredential = async (response) => {
  try {
    const res  = await fetch(`${BASE.value}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential }),
    })
    const data = await res.json()
    if (!data.error) {
      customerStore.setCustomer(data)
      loginPanelOpen.value = false
      fillFromCustomer(data)
    }
  } catch {}
}

const logout = async () => {
  await fetch(`${BASE.value}/logout`, { method: 'POST', credentials: 'include' })
  customerStore.clearCustomer()
}

const toggleLoginPanel = () => {
  loginPanelOpen.value = !loginPanelOpen.value
  if (loginPanelOpen.value && !customer.value) {
    nextTick(() => renderGoogleBtn('hb-google-btn'))
  }
}

function fillFromCustomer(c) {
  if (!name.value.trim() && c.name)      name.value    = c.name
  if (!contact.value.trim() && c.mobile) contact.value = c.mobile
}

// ── localStorage ────────────────────────────────────────────────
const LS_KEY = 'sm_handmade_bread_last'

function saveLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ name: name.value, contact: contact.value }))
  } catch {}
}
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    if (!name.value && d.name)       name.value    = d.name
    if (!contact.value && d.contact) contact.value = d.contact
  } catch {}
}
function loadKnownNames() {
  try {
    const raw = localStorage.getItem('sm_handmade_bread_names')
    if (raw) knownNames.value = JSON.parse(raw)
  } catch {}
}

function onNameInput(v) {
  if (!v) { showSuggest.value = false; return }
  const m = knownNames.value.filter(n => n.includes(v) && n !== v)
  suggestions.value = m.slice(0, 5)
  showSuggest.value = m.length > 0
}
function pickName(n) { name.value = n; showSuggest.value = false }

// ── 摘要計算 ────────────────────────────────────────────────────
const activeDayEntries = computed(() =>
    sortedSelDates.value
        .map(dateKey => ({ dateKey, lines: dateItemLines(dateKey) }))
        .filter(d => d.lines.length > 0)
)
const totalPrice = computed(() =>
    activeDayEntries.value.reduce((sum, d) => sum + d.lines.reduce((s, l) => s + l.price * l.qty, 0), 0)
)
const hasOrder = computed(() => activeDayEntries.value.length > 0)

// ── 送出 ────────────────────────────────────────────────────────
async function doSubmit() {
  if (!name.value.trim())    { alert('請輸入姓名'); return }
  if (!contact.value.trim()) { alert('請輸入聯絡方式'); return }
  if (!hasOrder.value)       { alert('請至少選擇一款麵包'); return }

  errorMsg.value = ''

  try {
    const names = knownNames.value
    if (!names.includes(name.value)) {
      names.unshift(name.value)
      if (names.length > 30) names.pop()
      localStorage.setItem('sm_handmade_bread_names', JSON.stringify(names))
    }
  } catch {}

  saveLocal()

  const payload = {
    customerId: customer.value?.id ?? '',
    name:       name.value.trim(),
    contact:    contact.value.trim(),
    remark:     remark.value.trim(),
    orders: activeDayEntries.value.map(d => ({
      pickupDay:  dateInfo(d.dateKey).code,
      pickupDate: d.dateKey,
      items: d.lines.map(l => ({ code: l.code, qty: l.qty })),
    })),
  }

  submitting.value = true
  try {
    const res  = await fetch(`${HANDMADE_BREAD_BASE.value}/order/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) {
      errorMsg.value = data.error
      return
    }

    let msg = `訂購人：${name.value}　聯絡：${contact.value}\n\n`
    for (const d of activeDayEntries.value) {
      msg += `【${labelFor(d.dateKey)}】\n`
      for (const l of d.lines) msg += `${l.name} × ${l.qty}（$${l.price * l.qty}）\n`
      msg += '\n'
    }
    if (remark.value.trim()) msg += `備註：${remark.value.trim()}\n\n`
    msg += `合計：$${totalPrice.value}`

    successMsg.value   = msg
    successModal.value = true
    setTimeout(() => {
      if (customer.value) {
        router.push('/front/profile/log?tab=handmade-bread')
      } else {
        router.push('/')
      }
    }, 2000)
  } catch (e) {
    errorMsg.value = '送出失敗，請稍後再試'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  name.value = ''; contact.value = ''; remark.value = ''
  dateQty.value = {}
  const firstKey = pickupDayOptions.value[0]?.dateKey
  selDates.value = firstKey ? [firstKey] : []
  if (firstKey) ensureDateQty(firstKey)
  weekOffset.value = 0
  successModal.value = false
}

// ── 初始化 ──────────────────────────────────────────────────────
onMounted(async () => {
  loadKnownNames()
  await fetchItems()
  ensurePackageQty()
  await fetchBusinessDays()
  const firstKey = pickupDayOptions.value[0]?.dateKey
  if (firstKey) { selDates.value = [firstKey]; ensureDateQty(firstKey) }
  fetchClosedDates()

  try {
    const data = await (await fetch(`${BASE.value}/me`, { credentials: 'include' })).json()
    if (!data.error) {
      customerStore.setCustomer(data)
      fillFromCustomer(data)
    } else {
      loadLocal()
    }
  } catch {
    loadLocal()
  }

  if (!document.getElementById('google-gsi-script')) {
    const script    = document.createElement('script')
    script.id       = 'google-gsi-script'
    script.src      = 'https://accounts.google.com/gsi/client'
    script.async    = true
    script.defer    = true
    script.onload   = () => initGoogle()
    document.head.appendChild(script)
  } else if (window.google) {
    initGoogle()
  }
})
</script>

<template>
  <div class="hb-page">

    <!-- Header -->
    <div class="hb-header">
      <div class="hb-header__inner">
        <NuxtLink to="/" class="hb-header__logo">
          <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊" class="hb-header__logo-img" />
        </NuxtLink>
        <div class="hb-header__text">
          <h1 class="hb-header__title">麵包預購</h1>
          <p class="hb-header__sub">聖母健康農莊 × 一一手作・每週{{ businessDaysLabel }}新鮮出爐</p>
        </div>

        <div class="hb-login-area">
          <button v-if="!customer" class="hb-login-btn" @click="toggleLoginPanel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            登入
          </button>
          <button v-else class="hb-avatar-btn" @click="toggleLoginPanel">
            <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="hb-avatar-img" />
            <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
          </button>

          <Transition name="hb-panel-fade">
            <div v-if="loginPanelOpen" class="hb-login-panel">
              <div v-if="!customer">
                <p class="hb-login-panel__hint">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  登入後可查看訂購紀錄
                </p>
                <div id="hb-google-btn"></div>
              </div>
              <div v-else>
                <div class="hb-login-panel__user">
                  <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="hb-login-panel__avatar" />
                  <div>
                    <p class="hb-login-panel__name">{{ customer.name }}</p>
                    <p class="hb-login-panel__email">{{ customer.email }}</p>
                  </div>
                </div>
                <NuxtLink to="/front/profile/log" class="hb-login-panel__link">查看訂購紀錄</NuxtLink>
                <button class="hb-login-panel__logout" @click="logout(); loginPanelOpen = false">登出</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="hb-wrap">

      <div v-if="!customer" class="hb-notice hb-notice--info">
        <svg xmlns="http://www.w3.org/2000/svg" class="hb-notice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <span><strong>登入 Google 帳號</strong>可查看歷史訂購紀錄，也可直接填寫下方資料下單。</span>
      </div>

      <!-- 取貨週次切換 -->
      <div class="hb-week-nav">
        <button class="hb-week-nav__btn" type="button"
                :disabled="weekOffset === 0"
                @click="weekOffset--">‹ 上一週</button>
        <span class="hb-week-nav__label">{{ weekOffsetLabel }}</span>
        <button class="hb-week-nav__btn" type="button"
                :disabled="weekOffset >= MAX_WEEK_OFFSET"
                @click="weekOffset++">下一週 ›</button>
      </div>

      <p class="hb-day-tabs__hint">可勾選多個取貨日，分開設定各自的麵包數量</p>
      <div class="hb-day-tabs">
        <button v-for="opt in pickupDayOptions" :key="opt.dateKey"
                class="hb-day-tab"
                :class="{ active: selDates.includes(opt.dateKey), closed: closedMap[opt.code] }"
                :disabled="closedMap[opt.code]"
                @click="toggleDate(opt.dateKey)">
          <span v-if="selDates.includes(opt.dateKey)" class="hb-day-tab__check">✓</span>
          <span class="hb-day-tab__label">{{ opt.label }}</span>
          <span class="hb-day-tab__date">{{ opt.dateStr }}</span>
          <span v-if="closedMap[opt.code]" class="hb-day-tab__closed">休息日</span>
        </button>
      </div>

      <!-- 包月 -->
      <div class="hb-package">
        <div class="hb-package__row">
          <span class="hb-package__label">或整月訂購：</span>
          <select v-model="packageMonth" class="hb-package__select">
            <option v-for="opt in packageMonthOptions" :key="opt.val" :value="opt.val">{{ opt.label }}</option>
          </select>
          <button type="button" class="hb-package__toggle" @click="packageShowAll = !packageShowAll">
            {{ packageShowAll ? '收合品項' : '展開選擇品項' }}
          </button>
        </div>
        <div v-if="packageShowAll" class="hb-item-list">
          <div v-for="item in items" :key="item.code" class="hb-order-row">
            <div class="hb-order-row__label">
              {{ item.code }}．{{ item.name }}
              <span class="hb-order-row__sub">${{ item.price }}／{{ item.unit }}</span>
            </div>
            <div class="hb-qty-ctrl">
              <button type="button" @click="adjPackageItem(item.code, -1)">−</button>
              <input type="number" :value="packageItemQty[item.code] ?? 0" min="0"
                     @input="packageItemQty[item.code] = Math.max(0, parseInt($event.target.value) || 0)" />
              <button type="button" @click="adjPackageItem(item.code, 1)">+</button>
            </div>
          </div>
        </div>
        <button type="button" class="hb-package__btn" @click="applyMonthPackage">加入整月取貨日（套用以上品項數量）</button>
      </div>

      <div v-if="allDaysClosed" class="hb-notice hb-notice--warn" style="margin-bottom:1rem">
        <svg xmlns="http://www.w3.org/2000/svg" class="hb-notice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>本週麵包暫停訂購，造成不便請見諒。</span>
      </div>

      <!-- 訂購人卡片 -->
      <div class="hb-card">
        <div class="hb-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          訂購人
          <span v-if="customer" class="hb-logged-badge">
            <img v-if="customer.picture" :src="customer.picture" class="hb-logged-badge__avatar" />
            {{ customer.name }}
          </span>
        </div>
        <div class="hb-field">
          <label>姓名 <span class="hb-required">*</span></label>
          <div class="hb-field__suggest-wrap">
            <input
                v-model="name"
                type="text"
                placeholder="請輸入姓名"
                autocomplete="off"
                @input="onNameInput(name)"
                @blur="setTimeout(() => showSuggest = false, 150)"
            />
            <div v-if="showSuggest" class="hb-suggest">
              <div v-for="n in suggestions" :key="n" class="hb-suggest__item" @mousedown.prevent="pickName(n)">{{ n }}</div>
            </div>
          </div>
        </div>
        <div class="hb-field">
          <label>聯絡方式（電話／農莊分機）<span class="hb-required">*</span></label>
          <input v-model="contact" type="tel" placeholder="例：0912-345-678 或分機 888" autocomplete="off" />
        </div>
        <div class="hb-field">
          <label>備註（選填）</label>
          <textarea v-model="remark" placeholder="例如：取貨時間、特殊需求" rows="2"></textarea>
        </div>
      </div>

      <!-- 各已勾選日期的訂購卡片 -->
      <div v-for="dateKey in sortedSelDates" :key="dateKey" class="hb-card hb-card--day">
        <div class="hb-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
          {{ labelFor(dateKey) }}
          <button v-if="selDates.length > 1"
                  class="hb-day-apply-btn"
                  type="button"
                  @click="applyToAllDates(dateKey)">套用到全部</button>
          <button class="hb-day-remove-btn"
                  type="button"
                  title="移除這天"
                  @click="removeDate(dateKey)">✕</button>
        </div>
        <div class="hb-order-rows">
          <div v-for="item in items" :key="item.code" class="hb-order-row">
            <div class="hb-order-row__label">
              {{ item.code }}．{{ item.name }}
              <span class="hb-order-row__sub">${{ item.price }}／{{ item.unit }}</span>
            </div>
            <div class="hb-qty-ctrl">
              <button @click="adjDateItem(dateKey, item.code, -1)">−</button>
              <input type="number" :value="dateQty[dateKey]?.itemQty?.[item.code] ?? 0" min="0"
                     @input="setDateItem(dateKey, item.code, $event.target.value)" />
              <button @click="adjDateItem(dateKey, item.code, 1)">+</button>
            </div>
          </div>
        </div>
        <div v-if="dateTotal(dateKey) > 0" class="hb-day-subtotal">
          小計：${{ dateTotal(dateKey) }}
        </div>
      </div>

      <!-- 摘要 -->
      <div v-if="hasOrder" class="hb-summary">
        <template v-for="d in activeDayEntries" :key="d.dateKey">
          <div class="hb-summary__row hb-summary__row--day">
            <span>{{ labelFor(d.dateKey) }}</span>
          </div>
          <div v-for="l in d.lines" :key="l.code" class="hb-summary__row">
            <span>　{{ l.name }} × {{ l.qty }}</span>
            <span>${{ l.price * l.qty }}</span>
          </div>
        </template>
        <div class="hb-summary__row hb-summary__row--total">
          <span>合計</span>
          <span>${{ totalPrice }}</span>
        </div>
      </div>

      <Transition name="hb-err-fade">
        <div v-if="errorMsg" class="hb-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="hb-error__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ errorMsg }}</span>
          <button class="hb-error__close" @click="errorMsg = ''">✕</button>
        </div>
      </Transition>

      <button class="hb-submit" :disabled="submitting || selDates.length === 0 || selDates.some(dk => isDateClosed(dk))" @click="doSubmit">
        <span v-if="submitting" class="hb-spinner"></span>
        {{ submitting ? '送出中…' : '確認送出訂單' }}
      </button>

    </div><!-- /hb-wrap -->

    <div v-if="loginPanelOpen" class="hb-overlay" @click="loginPanelOpen = false"></div>

    <!-- 送出成功 Modal -->
    <Teleport to="body">
      <Transition name="hb-modal-fade">
        <div v-if="successModal" class="hb-modal-backdrop" @click.self="resetForm">
          <div class="hb-modal hb-modal--success">
            <div class="hb-modal__success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 class="hb-modal__title">訂單已送出！</h3>
            <pre class="hb-modal__content">{{ successMsg }}</pre>
            <p class="hb-modal__redirect-hint">
              {{ customer ? '正在跳轉至訂購紀錄…' : '正在跳轉至首頁…' }}
            </p>
            <div class="hb-modal__btns">
              <button class="confirm" @click="customer ? $router.push('/front/profile/log?tab=handmade-bread') : $router.push('/')">
                {{ customer ? '前往訂購紀錄' : '返回首頁' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Page ── */
.hb-page {
  min-height: 100vh;
  background: #f7f4ef;
  font-family: 'Noto Sans TC', sans-serif;
}

/* ── Header ── */
.hb-header {
  background: linear-gradient(135deg, #7a4a2d 0%, #4a2c1a 100%);
  padding: 1.25rem 1.5rem;
  position: relative;
}
.hb-header__inner {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.hb-header__logo-img {
  height: 44px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.hb-header__text { flex: 1; }
.hb-header__title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.hb-header__sub {
  font-size: 12px;
  color: #f0ddc8;
  margin: 2px 0 0;
}

/* ── 登入區塊 ── */
.hb-login-area { position: relative; }
.hb-login-btn {
  display: flex; align-items: center; gap: 5px;
  font-family: inherit; font-size: 12.5px; color: #fff;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
  border-radius: 20px; padding: 6px 12px; cursor: pointer;
}
.hb-avatar-btn {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  border: 2px solid rgba(255,255,255,0.5); background: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; color: #7a4a2d; cursor: pointer; padding: 0;
}
.hb-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.hb-login-panel {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  padding: 1rem; width: 240px; z-index: 100;
}
.hb-login-panel__hint { display: flex; gap: 6px; font-size: 12px; color: #6b5a4a; margin: 0 0 10px; }
.hb-login-panel__user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.hb-login-panel__avatar { width: 36px; height: 36px; border-radius: 50%; }
.hb-login-panel__name { font-size: 13.5px; font-weight: 600; color: #2a2e25; margin: 0; }
.hb-login-panel__email { font-size: 11.5px; color: #8a9e84; margin: 0; }
.hb-login-panel__link {
  display: block; text-align: center; font-size: 12.5px; color: #7a4a2d;
  border: 1px solid #e0d3c5; border-radius: 8px; padding: 7px; margin-bottom: 6px;
}
.hb-login-panel__logout {
  width: 100%; font-family: inherit; font-size: 12.5px; color: #c0392b;
  background: #fdf0f0; border: none; border-radius: 8px; padding: 7px; cursor: pointer;
}
.hb-panel-fade-enter-active, .hb-panel-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.hb-panel-fade-enter-from, .hb-panel-fade-leave-to { opacity: 0; transform: translateY(-6px); }
.hb-overlay { position: fixed; inset: 0; z-index: 50; }

/* ── Wrap ── */
.hb-wrap { max-width: 560px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }

/* ── Notice ── */
.hb-notice {
  display: flex; align-items: flex-start; gap: 8px;
  border-radius: 10px; padding: 10px 14px; margin-bottom: 1rem;
  font-size: 12.5px; line-height: 1.6;
}
.hb-notice--info { background: #f0f4fb; color: #35507a; border: 1px solid #cddbf0; }
.hb-notice--warn { background: #fdf4ea; color: #8a5a1f; border: 1px solid #f0dcb8; }
.hb-notice__icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

/* ── Week Nav ── */
.hb-week-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.75rem;
}
.hb-week-nav__btn {
  font-family: inherit; font-size: 12.5px; color: #7a4a2d;
  background: #fff; border: 1px solid #e0d3c5; border-radius: 8px;
  padding: 6px 12px; cursor: pointer;
}
.hb-week-nav__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.hb-week-nav__label { font-size: 13.5px; font-weight: 600; color: #4a2c1a; }

/* ── Day Tabs ── */
.hb-day-tabs__hint { font-size: 11.5px; color: #9c8a76; margin: 0 0 6px; }
.hb-day-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem; }
.hb-day-tab {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 14px; border: 1.5px solid #e0d3c5; border-radius: 10px;
  background: #fff; cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.hb-day-tab.active { background: #7a4a2d; border-color: #7a4a2d; }
.hb-day-tab.active .hb-day-tab__label,
.hb-day-tab.active .hb-day-tab__date { color: #fff; }
.hb-day-tab.closed { opacity: 0.45; cursor: not-allowed; }
.hb-day-tab__check { position: absolute; top: 2px; right: 4px; font-size: 10px; color: #fff; }
.hb-day-tab__label { font-size: 13px; font-weight: 600; color: #4a2c1a; }
.hb-day-tab__date { font-size: 11px; color: #9c8a76; }
.hb-day-tab.active .hb-day-tab__date { color: #f0ddc8; }
.hb-day-tab__closed { font-size: 10px; color: #c0392b; }

/* ── Package ── */
.hb-package {
  background: #fdf7f0; border: 1px solid #ecdcc6; border-radius: 12px;
  padding: 0.9rem 1rem; margin-bottom: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.hb-package__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hb-package__label { font-size: 12.5px; color: #6b5a4a; white-space: nowrap; }
.hb-package__select {
  flex: 1; min-width: 110px;
  padding: 6px 10px; border: 1.5px solid #d9c4a8; border-radius: 8px;
  font-size: 13px; background: #fffaf3; color: #2a2e25; font-family: inherit;
}
.hb-package__toggle {
  font-family: inherit; font-size: 12px; color: #7a4a2d;
  background: #fff; border: 1px solid #e0d3c5; border-radius: 8px;
  padding: 6px 10px; cursor: pointer; white-space: nowrap;
}
.hb-package__btn {
  font-family: inherit; font-size: 12.5px; font-weight: 600; color: #fff;
  background: #7a4a2d; border: none; border-radius: 8px;
  padding: 8px 12px; cursor: pointer; transition: background 0.15s;
}
.hb-package__btn:hover { background: #5c381f; }

/* ── Card ── */
.hb-card {
  background: #fff; border: 1px solid #ecdcc6;
  border-radius: 12px; padding: 1.1rem 1.25rem; margin-bottom: 1rem;
}
.hb-card__title {
  display: flex; align-items: center; gap: 7px;
  font-size: 15px; font-weight: 600; color: #4a2c1a;
  margin-bottom: 1rem; font-family: 'Noto Serif TC', serif;
}
.hb-card__title svg { width: 18px; height: 18px; color: #7a4a2d; flex-shrink: 0; }
.hb-card--day .hb-card__title { justify-content: space-between; }
.hb-day-apply-btn {
  margin-left: auto; font-family: inherit;
  font-size: 11px; font-weight: 500; color: #7a4a2d;
  background: #fdf4ea; border: 1px solid #e0c9a8;
  border-radius: 20px; padding: 4px 10px; cursor: pointer;
  transition: background 0.15s;
}
.hb-day-apply-btn:hover { background: #f5e6d0; }
.hb-day-remove-btn {
  margin-left: auto; font-family: inherit;
  width: 22px; height: 22px; flex-shrink: 0;
  font-size: 12px; line-height: 1; color: #c0392b;
  background: #fdf0f0; border: 1px solid #f5c6c6; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.hb-day-remove-btn:hover { background: #fbe0e0; }
.hb-day-subtotal {
  margin-top: 10px; text-align: right; font-size: 12.5px; font-weight: 600; color: #4a2c1a;
}

/* ── Field ── */
.hb-field { margin-bottom: 1rem; }
.hb-field:last-child { margin-bottom: 0; }
.hb-field label { display: block; font-size: 13px; color: #6b5a4a; margin-bottom: 5px; font-weight: 500; }
.hb-field input[type=text],
.hb-field input[type=tel],
.hb-field textarea {
  width: 100%; box-sizing: border-box;
  padding: 8px 12px; border: 1px solid #d9c4a8; border-radius: 8px;
  font-size: 14px; background: #fffaf3; color: #2a2e25;
  font-family: inherit; outline: none; transition: border-color 0.2s;
}
.hb-field input:focus, .hb-field textarea:focus { border-color: #7a4a2d; }
.hb-field textarea { resize: none; }
.hb-required { color: #c0392b; }

/* ── Suggest ── */
.hb-field__suggest-wrap { position: relative; }
.hb-suggest {
  position: absolute; top: 100%; left: 0; right: 0;
  background: #fff; border: 1px solid #d9c4a8;
  border-radius: 8px; margin-top: 3px; z-index: 50;
  overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.hb-suggest__item {
  padding: 8px 12px; font-size: 14px; cursor: pointer;
  color: #2a2e25; border-bottom: 1px solid #f2e9dd; transition: background 0.12s;
}
.hb-suggest__item:last-child { border-bottom: none; }
.hb-suggest__item:hover { background: #fdf4ea; }

/* ── Order Rows / Item List ── */
.hb-order-rows, .hb-item-list { display: flex; flex-direction: column; gap: 8px; }
.hb-item-list { margin-bottom: 0.25rem; }
.hb-order-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: #fbf5eb; border-radius: 8px;
}
.hb-order-row__label { flex: 1; font-size: 13.5px; color: #2a2e25; }
.hb-order-row__sub { display: block; font-size: 11.5px; color: #9c8a76; margin-top: 2px; }

/* ── Qty Ctrl ── */
.hb-qty-ctrl { display: flex; align-items: center; gap: 6px; }
.hb-qty-ctrl button {
  width: 28px; height: 28px; border: 1.5px solid #d9c4a8; border-radius: 7px;
  background: #fff; cursor: pointer; font-size: 16px; color: #4a2c1a;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background 0.15s;
}
.hb-qty-ctrl button:hover { background: #fdf4ea; }
.hb-qty-ctrl input {
  width: 42px; text-align: center; padding: 4px 2px;
  border: 1.5px solid #d9c4a8; border-radius: 7px;
  font-size: 14px; background: #fff; color: #2a2e25; font-family: inherit;
}

/* ── Summary ── */
.hb-summary {
  background: #fff; border: 1px solid #ecdcc6;
  border-radius: 10px; padding: 12px 16px; margin-bottom: 1rem;
}
.hb-summary__row {
  display: flex; justify-content: space-between;
  font-size: 13px; padding: 3px 0; color: #6b5a4a;
}
.hb-summary__row--total {
  font-size: 14px; font-weight: 600; color: #4a2c1a;
  border-top: 1px solid #ecdcc6; margin-top: 6px; padding-top: 8px;
}
.hb-summary__row--day {
  font-size: 12.5px; font-weight: 600; color: #7a4a2d;
  padding-top: 8px;
}
.hb-summary__row--day:first-child { padding-top: 0; }

/* ── Error ── */
.hb-error {
  display: flex; align-items: center; gap: 8px;
  background: #fdf0f0; border: 1px solid #f5c6c6;
  border-radius: 10px; padding: 11px 14px;
  margin-bottom: 1rem; font-size: 13px; color: #c0392b;
}
.hb-error__icon { width: 16px; height: 16px; flex-shrink: 0; }
.hb-error span { flex: 1; line-height: 1.5; }
.hb-error__close {
  background: none; border: none; color: #c0392b;
  cursor: pointer; font-size: 14px; padding: 0 2px; opacity: 0.6;
  flex-shrink: 0;
}
.hb-error__close:hover { opacity: 1; }
.hb-err-fade-enter-active, .hb-err-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.hb-err-fade-enter-from, .hb-err-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Submit ── */
.hb-submit {
  width: 100%; padding: 13px;
  background: #7a4a2d; color: #fff;
  border: none; border-radius: 10px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.hb-submit:hover:not(:disabled) { background: #5c381f; }
.hb-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.hb-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ── */
.hb-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
}
.hb-modal {
  background: #fff; border-radius: 14px;
  padding: 1.5rem; width: 280px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
.hb-modal--success { width: 320px; text-align: center; }
.hb-modal__title {
  font-size: 15px; font-weight: 600; color: #4a2c1a;
  margin: 0 0 1rem; font-family: 'Noto Serif TC', serif;
}
.hb-modal__content {
  font-size: 13px; color: #3a4e36; background: #fbf5eb;
  border-radius: 8px; padding: 12px; white-space: pre-wrap;
  text-align: left; margin: 0 0 0.75rem; line-height: 1.7; font-family: inherit;
  max-height: 40vh; overflow-y: auto;
}
.hb-modal__redirect-hint {
  font-size: 12px; color: #9c8a76; margin: 0 0 0.75rem;
}
.hb-modal__success-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: #f5e9da; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.75rem;
}
.hb-modal__success-icon svg { width: 26px; height: 26px; color: #7a4a2d; }
.hb-modal__btns { display: flex; gap: 8px; }
.hb-modal__btns button {
  flex: 1; padding: 9px;
  border: 1.5px solid #d9c4a8; border-radius: 8px;
  cursor: pointer; font-size: 14px; background: #fffaf3;
  color: #3a4e36; font-family: inherit; transition: background 0.15s;
}
.hb-modal__btns button.confirm {
  background: #7a4a2d; color: #fff; border-color: #7a4a2d;
}
.hb-modal__btns button.confirm:hover { background: #5c381f; }

/* ── Transitions ── */
.hb-modal-fade-enter-active, .hb-modal-fade-leave-active { transition: opacity 0.2s; }
.hb-modal-fade-enter-from, .hb-modal-fade-leave-to { opacity: 0; }
</style>
