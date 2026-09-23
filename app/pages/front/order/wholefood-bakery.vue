<script setup>
  definePageMeta({layout: false})
  useSiteHead({
    title: '全食物烘焙坊預購 | 台東聖母健康農莊',
    description: '台東聖母農莊全食物烘焙坊，真食材・無添加・安心美味。全粒麥麵粉、在地蔬果、頂級紐西蘭奶油，每週二、三、四供應，歡迎線上預訂。',
    ogTitle: '全食物烘焙坊預購 | 台東聖母健康農莊',
    ogDescription: '台東聖母農莊全食物烘焙坊，真食材・無添加・安心美味。每週二、三、四供應，歡迎線上預訂。',
    ogImage: 'https://holymotherfarm.netlify.app/images/order/wholefood-bakery_og.jpg',
    twitterImage: 'https://holymotherfarm.netlify.app/images/order/wholefood-bakery_og.jpg',
    ogUrl: 'https://holymotherfarm.netlify.app/front/order/wholefood-bakery',
  })

  import {ref, reactive, computed, onMounted, onUnmounted, nextTick} from 'vue'
  import {useCommonStore} from '~/stores/common.js'
  import {useCustomerStore} from '~/stores/customer.js'

  const router = useRouter()

  const commonStore = useCommonStore()
  const customerStore = useCustomerStore()
  const BASE = computed(() => commonStore.data.main_url + '/holy/customer')
  const API_BASE = computed(() => commonStore.data.main_url + '/holy/wholefood-bakery')
  const GOOGLE_CLIENT_ID = computed(() => commonStore.data.google_client_id)

  const customer = computed(() => customerStore.customer)

  // ── 供應日設定（動態抓後端）─────────────────────────────────────
  // ISO 星期數字：1=一 2=二 3=三 4=四 5=五 6=六 7=日
  const DOW_LABEL = {1: '週一', 2: '週二', 3: '週三', 4: '週四', 5: '週五', 6: '週六', 7: '週日'}
  const DOW_CODE = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun'}

  const businessDays = ref([2, 3, 4]) // 預設值（後端還沒回來前先顯示），實際以後端設定為準

  async function fetchBusinessDays() {
    try {
      const res = await fetch(`${API_BASE.value}/settings/business-days`)
      const data = await res.json()
      if (Array.isArray(data.businessDays) && data.businessDays.length > 0) {
        businessDays.value = data.businessDays
      }
    } catch {
    }
  }

  // ── 品項清單（動態抓後端）───────────────────────────────────────
  const items = ref([]) // [{ code, name, price, unit }]

  async function fetchItems() {
    try {
      const res = await fetch(`${API_BASE.value}/settings/items`)
      const data = await res.json()
      if (Array.isArray(data.items)) items.value = data.items
      if (Array.isArray(data.categories)) categories.value = data.categories
    } catch {
    }
  }

  function itemByCode(code) {
    return items.value.find(i => i.code === code)
  }

  // ── 品項圖片 ────────────────────────────────────────────────────
  function imgUrl(path) {
    if (!path) return ''
    return path.startsWith('http') ? path : commonStore.data.main_url + path
  }

  function thumbUrl(path) {
    if (!path) return ''
    const full = imgUrl(path)
    return full.replace('/holy/wholefood-bakery/image/', '/holy/wholefood-bakery/image/thumb/')
  }

  const previewUrl = ref('')

  // ── Hero 圖片（用品項照片拼一排，不用額外準備素材）──────────────
  const heroImages = computed(() =>
          items.value.filter(i => i.image).map(i => ({code: i.code, name: i.name, src: imgUrl(i.image)})).slice(0, 10)
  )

  // ── 代碼徽章配色（呼應海報的暖色系，依代碼字母固定分配、不會每次刷新亂跳）──
  const BADGE_PALETTE = ['#c97b3d', '#a3572f', '#8c6a3a', '#b8843f', '#9c5a3c', '#c99a4a']

  function badgeStyle(code) {
    const idx = (code?.charCodeAt(0) || 65) % BADGE_PALETTE.length
    return {background: BADGE_PALETTE[idx]}
  }

  // ── 分類分組（順序與圖示依後台「分類設定」；後端已過濾掉停用分類的品項）──
  const categories = ref([]) // [{ name, emoji, active }]

  const itemGroups = computed(() => {
    const map = {}
    for (const it of items.value) {
      const known = categories.value.some(c => c.name === it.category)
      const key = known ? it.category : '其他'
      ;(map[key] ||= []).push(it)
    }
    const groups = categories.value
            .filter(c => map[c.name]?.length)
            .map(c => ({name: c.name, emoji: c.emoji || '🍞', items: map[c.name]}))
    // 未分類品項放最後；若後台剛好有一個叫「其他」的分類，上面已經收進去了
    if (map['其他']?.length && !categories.value.some(c => c.name === '其他')) {
      groups.push({name: '其他', emoji: '🍞', items: map['其他']})
    }
    return groups
  })

  // 分類收合狀態：key = `${scope}|${分類}`，scope 為取貨日 dateKey 或 'package'
  const collapsedCats = reactive({})

  function isCatCollapsed(scope, cat) {
    return !!collapsedCats[`${scope}|${cat}`]
  }

  function toggleCat(scope, cat) {
    const key = `${scope}|${cat}`
    collapsedCats[key] = !collapsedCats[key]
  }

  function catSelectedCount(qtyMap, group) {
    if (!qtyMap) return 0
    return group.items.reduce((s, it) => s + ((qtyMap[it.code] || 0) > 0 ? 1 : 0), 0)
  }

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

  function fmt(d) {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const MAX_WEEKS_SHOWN = 8
  const weeksShown = ref(1) // 先給預設值，實際會在畫面量測後自動調整成剛好一排
  const userExpandedWeeks = ref(false) // 使用者按過「顯示更多」後，就不再自動收合，只會繼續自動成長
  const dayTabsRef = ref(null)

  // 依實際容器寬度跟單一標籤寬度，算出一排放得下幾週（而不是寫死數字），
  // 這樣手機窄螢幕跟桌機寬螢幕都會剛好塞滿一排、不會多出半排。
  function computeFitWeeks() {
    const container = dayTabsRef.value
    if (!container) return null
    const firstTab = container.querySelector('.wf-day-tab')
    if (!firstTab) return null
    const containerWidth = container.clientWidth
    const tabWidth = firstTab.offsetWidth
    const gap = 8 // 對應 .wf-day-tabs 的 CSS gap
    if (!containerWidth || !tabWidth) return null
    const perRow = Math.max(1, Math.floor((containerWidth + gap) / (tabWidth + gap)))
    const perWeek = Math.max(1, businessDays.value.length)
    return Math.max(1, Math.floor(perRow / perWeek))
  }

  function autoFitWeeks() {
    if (userExpandedWeeks.value) return
    const fit = computeFitWeeks()
    if (fit) weeksShown.value = Math.min(MAX_WEEKS_SHOWN, fit)
  }

  function showMoreWeeks() {
    userExpandedWeeks.value = true
    weeksShown.value = Math.min(MAX_WEEKS_SHOWN, weeksShown.value + 2)
  }

  let resizeTimer = null

  function onWindowResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(autoFitWeeks, 150)
  }

  const pickupDayOptions = computed(() =>
          businessDays.value
                  .flatMap((dow) =>
                          Array.from({length: weeksShown.value}, (_, w) => {
                            const date = getNext(dow, w)
                            return {
                              dow,
                              code: DOW_CODE[dow] || 'mon',
                              label: DOW_LABEL[dow] || '',
                              dateStr: fmt(date),
                              dateKey: toDateStr(date),
                            }
                          })
                  )
                  .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  )

  const businessDaysLabel = computed(() =>
          businessDays.value.map(dow => (DOW_LABEL[dow] || '').replace('週', '')).join('、')
  )

  // ── 休息日 ──────────────────────────────────────────────────────
  const closedDates = ref([])

  function isDateClosed(dateKey) {
    return closedDates.value.includes(dateKey)
  }

  const closedMap = computed(() => {
    const m = {}
    for (const opt of pickupDayOptions.value) m[opt.dateKey] = isDateClosed(opt.dateKey)
    return m
  })
  const allDaysClosed = computed(() =>
          pickupDayOptions.value.length > 0 && pickupDayOptions.value.every(o => closedMap.value[o.dateKey])
  )

  async function fetchClosedDates() {
    try {
      const res = await fetch(`${API_BASE.value}/admin/settings/closed-dates`)
      const data = await res.json()
      closedDates.value = Array.isArray(data.closedDates) ? data.closedDates : []
      selDates.value = selDates.value.filter(dateKey => !isDateClosed(dateKey))
      if (selDates.value.length === 0) {
        const alt = pickupDayOptions.value.find(o => !isDateClosed(o.dateKey))
        if (alt) {
          selDates.value = [alt.dateKey];
          ensureDateQty(alt.dateKey)
        }
      }
    } catch {
    }
  }

  // ── 狀態 ────────────────────────────────────────────────────────
  // selDates：目前已選的取貨「實際日期」；dateQty[dateKey].itemQty[code] = 數量
  const selDates = ref([])
  const dateQty = ref({})
  const name = ref('')
  const contact = ref('')
  const remark = ref('')

  function dateInfo(dateKey) {
    const d = new Date(dateKey + 'T00:00:00')
    const jsDow = d.getDay()
    const dow = jsDow === 0 ? 7 : jsDow
    return {dateKey, dow, code: DOW_CODE[dow] || 'mon', label: DOW_LABEL[dow] || '', dateStr: fmt(d)}
  }

  const sortedSelDates = computed(() => [...selDates.value].sort())

  function emptyItemQty() {
    const q = {}
    for (const it of items.value) q[it.code] = 0
    return q
  }

  function ensureDateQty(dateKey) {
    if (!dateQty.value[dateKey]) dateQty.value[dateKey] = {itemQty: emptyItemQty()}
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
    const src = {...dateQty.value[sourceKey].itemQty}
    for (const dateKey of selDates.value) {
      if (dateKey === sourceKey) continue
      ensureDateQty(dateKey)
      dateQty.value[dateKey].itemQty = {...src}
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
            .map(it => ({...it, qty: q[it.code]}))
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
        val: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
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
      alert('請先填寫每次要訂的商品數量')
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
      const dow = jsDow === 0 ? 7 : jsDow
      if (!businessDays.value.includes(dow)) continue
      if (isDateClosed(dateKey)) continue
      if (!selDates.value.includes(dateKey)) selDates.value.push(dateKey)
      dateQty.value[dateKey] = {itemQty: {...packageItemQty}}
      addedCount++
    }
    if (addedCount === 0) {
      alert('這個月沒有可以加入的取貨日（可能都已過期，或該月尚無供應日設定）')
    }
  }

  // 名稱建議
  const knownNames = ref([])
  const suggestions = ref([])
  const showSuggest = ref(false)

  // 登入面板
  const loginPanelOpen = ref(false)

  // 送出成功 modal
  const successModal = ref(false)
  const successMsg = ref('')
  const submitting = ref(false)
  const errorMsg = ref('')

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
      const res = await fetch(`${BASE.value}/google-login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({credential: response.credential}),
      })
      const data = await res.json()
      if (!data.error) {
        customerStore.setCustomer(data)
        loginPanelOpen.value = false
        fillFromCustomer(data)
      }
    } catch {
    }
  }

  const logout = async () => {
    await fetch(`${BASE.value}/logout`, {method: 'POST', credentials: 'include'})
    customerStore.clearCustomer()
  }

  const toggleLoginPanel = () => {
    loginPanelOpen.value = !loginPanelOpen.value
    if (loginPanelOpen.value && !customer.value) {
      nextTick(() => renderGoogleBtn('wf-google-btn'))
    }
  }

  function fillFromCustomer(c) {
    if (!name.value.trim() && c.name) name.value = c.name
    if (!contact.value.trim() && c.mobile) contact.value = c.mobile
  }

  // ── localStorage ────────────────────────────────────────────────
  const LS_KEY = 'sm_wholefood_bakery_last'

  function saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({name: name.value, contact: contact.value}))
    } catch {
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (!name.value && d.name) name.value = d.name
      if (!contact.value && d.contact) contact.value = d.contact
    } catch {
    }
  }

  function loadKnownNames() {
    try {
      const raw = localStorage.getItem('sm_wholefood_bakery_names')
      if (raw) knownNames.value = JSON.parse(raw)
    } catch {
    }
  }

  function onNameInput(v) {
    if (!v) {
      showSuggest.value = false;
      return
    }
    const m = knownNames.value.filter(n => n.includes(v) && n !== v)
    suggestions.value = m.slice(0, 5)
    showSuggest.value = m.length > 0
  }

  function pickName(n) {
    name.value = n;
    showSuggest.value = false
  }

  // ── 摘要計算 ────────────────────────────────────────────────────
  const activeDayEntries = computed(() =>
          sortedSelDates.value
                  .map(dateKey => ({dateKey, lines: dateItemLines(dateKey)}))
                  .filter(d => d.lines.length > 0)
  )
  const totalPrice = computed(() =>
          activeDayEntries.value.reduce((sum, d) => sum + d.lines.reduce((s, l) => s + l.price * l.qty, 0), 0)
  )
  const hasOrder = computed(() => activeDayEntries.value.length > 0)

  // ── 送出 ────────────────────────────────────────────────────────
  async function doSubmit() {
    if (!name.value.trim()) {
      alert('請輸入姓名');
      return
    }
    if (!contact.value.trim()) {
      alert('請輸入聯絡方式');
      return
    }
    if (!hasOrder.value) {
      alert('請至少選擇一項商品');
      return
    }

    errorMsg.value = ''

    try {
      const names = knownNames.value
      if (!names.includes(name.value)) {
        names.unshift(name.value)
        if (names.length > 30) names.pop()
        localStorage.setItem('sm_wholefood_bakery_names', JSON.stringify(names))
      }
    } catch {
    }

    saveLocal()

    const payload = {
      customerId: customer.value?.id ?? '',
      name: name.value.trim(),
      contact: contact.value.trim(),
      remark: remark.value.trim(),
      orders: activeDayEntries.value.map(d => ({
        pickupDay: dateInfo(d.dateKey).code,
        pickupDate: d.dateKey,
        items: d.lines.map(l => ({code: l.code, qty: l.qty})),
      })),
    }

    submitting.value = true
    try {
      const res = await fetch(`${API_BASE.value}/order/batch`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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

      successMsg.value = msg
      successModal.value = true
      setTimeout(() => {
        if (customer.value) {
          router.push('/front/profile/log?tab=wholefood-bakery')
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
    name.value = '';
    contact.value = '';
    remark.value = ''
    dateQty.value = {}
    const firstKey = pickupDayOptions.value[0]?.dateKey
    selDates.value = firstKey ? [firstKey] : []
    if (firstKey) ensureDateQty(firstKey)
    weeksShown.value = 1
    userExpandedWeeks.value = false
    successModal.value = false
    nextTick(autoFitWeeks)
  }

  // ── 初始化 ──────────────────────────────────────────────────────
  onMounted(async () => {
    loadKnownNames()
    await fetchItems()
    ensurePackageQty()
    await fetchBusinessDays()
    await nextTick()
    autoFitWeeks()
    window.addEventListener('resize', onWindowResize)
    const firstKey = pickupDayOptions.value[0]?.dateKey
    if (firstKey) {
      selDates.value = [firstKey];
      ensureDateQty(firstKey)
    }
    fetchClosedDates()

    try {
      const data = await (await fetch(`${BASE.value}/me`, {credentials: 'include'})).json()
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
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogle()
      document.head.appendChild(script)
    } else if (window.google) {
      initGoogle()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize)
    clearTimeout(resizeTimer)
  })
</script>

<template>
  <div class="wf-page">

    <!-- Header -->
    <div class="wf-header">
      <div class="wf-header__inner">
        <NuxtLink to="/" class="wf-header__logo">
          <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊" class="wf-header__logo-img"/>
        </NuxtLink>
        <div class="wf-header__text">
          <h1 class="wf-header__title">全食物烘焙坊</h1>
          <p class="wf-header__sub">台東聖母農莊・真食材・無添加・每週{{ businessDaysLabel }}供應</p>
        </div>

        <div class="wf-login-area">
          <button v-if="!customer" class="wf-login-btn" @click="toggleLoginPanel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            登入
          </button>
          <button v-else class="wf-avatar-btn" @click="toggleLoginPanel">
            <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="wf-avatar-img"/>
            <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
          </button>

          <Transition name="wf-panel-fade">
            <div v-if="loginPanelOpen" class="wf-login-panel">
              <div v-if="!customer">
                <p class="wf-login-panel__hint">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                  登入後可查看訂購紀錄
                </p>
                <div id="wf-google-btn"></div>
              </div>
              <div v-else>
                <div class="wf-login-panel__user">
                  <img v-if="customer.picture" :src="customer.picture" :alt="customer.name"
                       class="wf-login-panel__avatar"/>
                  <div>
                    <p class="wf-login-panel__name">{{ customer.name }}</p>
                    <p class="wf-login-panel__email">{{ customer.email }}</p>
                  </div>
                </div>
                <NuxtLink to="/front/profile/log" class="wf-login-panel__link">查看訂購紀錄</NuxtLink>
                <button class="wf-login-panel__logout" @click="logout(); loginPanelOpen = false">登出</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Hero：用品項照片排成一排，讓人一進頁面就看到商品本尊 -->
    <div v-if="heroImages.length" class="wf-hero">
      <div class="wf-hero__scroll">
        <div v-for="img in heroImages" :key="img.code" class="wf-hero__item">
          <img :src="img.src" class="wf-hero__img" :alt="img.name"/>
          <span class="wf-hero__badge" :style="badgeStyle(img.code)">{{ img.code }}</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="wf-wrap">

      <div v-if="!customer" class="wf-notice wf-notice--info">
        <svg xmlns="http://www.w3.org/2000/svg" class="wf-notice__icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span><strong>登入 Google 帳號</strong>可查看歷史訂購紀錄，也可直接填寫下方資料下單。</span>
      </div>

      <!-- 烘焙坊資訊（對應菜單海報：理念、供應日、訂購專線、取貨地點） -->
      <div class="wf-info">
        <p class="wf-info__slogan">真食材・無添加・安心美味</p>
        <p class="wf-info__desc">
          全食物烘焙坊使用真食材，全粒麥麵粉、在地蔬果、頂級紐西蘭奶油，
          不使用<em>氫化油脂、酥油、香精、防腐劑</em>和<em>添加物</em>。
        </p>
        <div class="wf-info__grid">
          <div class="wf-info__item">
            <span class="wf-info__label">供應日</span>
            <span class="wf-info__value">每週{{ businessDaysLabel }}</span>
          </div>
          <a class="wf-info__item wf-info__item--link" href="tel:089381382">
            <span class="wf-info__label">訂購專線</span>
            <span class="wf-info__value">089-381382 #888・889</span>
          </a>
          <a class="wf-info__item wf-info__item--link"
             href="https://www.google.com/maps/search/?api=1&query=台東市博物館路110號" target="_blank" rel="noopener">
            <span class="wf-info__label">取貨地點</span>
            <span class="wf-info__value">台東市博物館路110號</span>
          </a>
        </div>
      </div>

      <p class="wf-day-tabs__hint">可勾選多個取貨日，分開設定各自的商品數量</p>
      <div class="wf-day-tabs" ref="dayTabsRef">
        <button v-for="opt in pickupDayOptions" :key="opt.dateKey"
                class="wf-day-tab"
                :class="{ active: selDates.includes(opt.dateKey), closed: closedMap[opt.dateKey] }"
                :disabled="closedMap[opt.dateKey]"
                @click="toggleDate(opt.dateKey)">
          <span v-if="selDates.includes(opt.dateKey)" class="wf-day-tab__check">✓</span>
          <span class="wf-day-tab__label">{{ opt.label }}</span>
          <span class="wf-day-tab__date">{{ opt.dateStr }}</span>
          <span v-if="closedMap[opt.dateKey]" class="wf-day-tab__closed">休息日</span>
        </button>
      </div>
      <button v-if="weeksShown < MAX_WEEKS_SHOWN" type="button" class="wf-show-more-btn" @click="showMoreWeeks">
        顯示更多取貨日 ↓
      </button>

      <!-- 包月 -->
      <div class="wf-package">
        <div class="wf-package__row">
          <span class="wf-package__label">或整月訂購：</span>
          <select v-model="packageMonth" class="wf-package__select">
            <option v-for="opt in packageMonthOptions" :key="opt.val" :value="opt.val">{{ opt.label }}</option>
          </select>
          <button type="button" class="wf-package__toggle" @click="packageShowAll = !packageShowAll">
            {{ packageShowAll ? '收合品項' : '展開選擇品項' }}
          </button>
        </div>
        <div v-if="packageShowAll" class="wf-cat-list">
          <div v-for="group in itemGroups" :key="group.name" class="wf-cat">
            <button type="button" class="wf-cat__head" @click="toggleCat('package', group.name)">
              <span class="wf-cat__emoji">{{ group.emoji }}</span>
              <span class="wf-cat__name">{{ group.name }}</span>
              <span v-if="catSelectedCount(packageItemQty, group)" class="wf-cat__count">
                已選 {{ catSelectedCount(packageItemQty, group) }}
              </span>
              <span class="wf-cat__arrow">{{ isCatCollapsed('package', group.name) ? '▼' : '▲' }}</span>
            </button>
            <div v-show="!isCatCollapsed('package', group.name)" class="wf-item-list">
              <div v-for="item in group.items" :key="item.code" class="wf-order-row">
                <div v-if="item.image" class="wf-order-row__img-wrap" @click="previewUrl = imgUrl(item.image)">
                  <img :src="thumbUrl(item.image)" class="wf-order-row__img" alt="">
                </div>
                <div v-else class="wf-order-row__img wf-order-row__img--placeholder">{{ group.emoji }}</div>
                <span class="wf-order-row__badge" :style="badgeStyle(item.code)">{{ item.code }}</span>
                <div class="wf-order-row__label">
                  {{ item.name }}
                  <span class="wf-order-row__sub">${{ item.price }}／{{ item.unit }}</span>
                </div>
                <div class="wf-qty-ctrl">
                  <button type="button" @click="adjPackageItem(item.code, -1)">−</button>
                  <input type="number" :value="packageItemQty[item.code] ?? 0" min="0"
                         @input="packageItemQty[item.code] = Math.max(0, parseInt($event.target.value) || 0)"/>
                  <button type="button" @click="adjPackageItem(item.code, 1)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="wf-package__btn" @click="applyMonthPackage">加入整月取貨日（套用以上品項數量）
        </button>
      </div>

      <div v-if="allDaysClosed" class="wf-notice wf-notice--warn" style="margin-bottom:1rem">
        <svg xmlns="http://www.w3.org/2000/svg" class="wf-notice__icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>近期烘焙坊暫停接單，造成不便請見諒。</span>
      </div>

      <!-- 訂購人卡片 -->
      <div class="wf-card">
        <div class="wf-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          訂購人
          <span v-if="customer" class="wf-logged-badge">
            <img v-if="customer.picture" :src="customer.picture" class="wf-logged-badge__avatar"/>
            {{ customer.name }}
          </span>
        </div>
        <div class="wf-field">
          <label>姓名 <span class="wf-required">*</span></label>
          <div class="wf-field__suggest-wrap">
            <input
                    v-model="name"
                    type="text"
                    placeholder="請輸入姓名"
                    autocomplete="off"
                    @input="onNameInput(name)"
                    @blur="setTimeout(() => showSuggest = false, 150)"
            />
            <div v-if="showSuggest" class="wf-suggest">
              <div v-for="n in suggestions" :key="n" class="wf-suggest__item" @mousedown.prevent="pickName(n)">{{
                n
                }}
              </div>
            </div>
          </div>
        </div>
        <div class="wf-field">
          <label>聯絡方式（電話／農莊分機）<span class="wf-required">*</span></label>
          <input v-model="contact" type="tel" placeholder="例：0912-345-678 或分機 888" autocomplete="off"/>
        </div>
        <div class="wf-field">
          <label>備註（選填）</label>
          <textarea v-model="remark" placeholder="例如：取貨時間、特殊需求" rows="2"></textarea>
        </div>
      </div>

      <!-- 各已勾選日期的訂購卡片 -->
      <div v-for="dateKey in sortedSelDates" :key="dateKey" class="wf-card wf-card--day">
        <div class="wf-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2">
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
          </svg>
          {{ labelFor(dateKey) }}
          <button v-if="selDates.length > 1"
                  class="wf-day-apply-btn"
                  type="button"
                  @click="applyToAllDates(dateKey)">套用到全部
          </button>
          <button class="wf-day-remove-btn"
                  type="button"
                  title="移除這天"
                  @click="removeDate(dateKey)">✕
          </button>
        </div>
        <div class="wf-cat-list">
          <div v-for="group in itemGroups" :key="group.name" class="wf-cat">
            <button type="button" class="wf-cat__head" @click="toggleCat(dateKey, group.name)">
              <span class="wf-cat__emoji">{{ group.emoji }}</span>
              <span class="wf-cat__name">{{ group.name }}</span>
              <span v-if="catSelectedCount(dateQty[dateKey]?.itemQty, group)" class="wf-cat__count">
                已選 {{ catSelectedCount(dateQty[dateKey]?.itemQty, group) }}
              </span>
              <span class="wf-cat__arrow">{{ isCatCollapsed(dateKey, group.name) ? '▼' : '▲' }}</span>
            </button>
            <div v-show="!isCatCollapsed(dateKey, group.name)" class="wf-order-rows">
              <div v-for="item in group.items" :key="item.code" class="wf-order-row">
                <div v-if="item.image" class="wf-order-row__img-wrap" @click="previewUrl = imgUrl(item.image)">
                  <img :src="thumbUrl(item.image)" class="wf-order-row__img" alt="">
                </div>
                <div v-else class="wf-order-row__img wf-order-row__img--placeholder">{{ group.emoji }}</div>
                <span class="wf-order-row__badge" :style="badgeStyle(item.code)">{{ item.code }}</span>
                <div class="wf-order-row__label">
                  {{ item.name }}
                  <span class="wf-order-row__sub">${{ item.price }}／{{ item.unit }}</span>
                </div>
                <div class="wf-qty-ctrl">
                  <button @click="adjDateItem(dateKey, item.code, -1)">−</button>
                  <input type="number" :value="dateQty[dateKey]?.itemQty?.[item.code] ?? 0" min="0"
                         @input="setDateItem(dateKey, item.code, $event.target.value)"/>
                  <button @click="adjDateItem(dateKey, item.code, 1)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="dateTotal(dateKey) > 0" class="wf-day-subtotal">
          小計：${{ dateTotal(dateKey) }}
        </div>
      </div>

      <!-- 摘要 -->
      <div v-if="hasOrder" class="wf-summary">
        <template v-for="d in activeDayEntries" :key="d.dateKey">
          <div class="wf-summary__row wf-summary__row--day">
            <span>{{ labelFor(d.dateKey) }}</span>
          </div>
          <div v-for="l in d.lines" :key="l.code" class="wf-summary__row">
            <span>　{{ l.name }} × {{ l.qty }}</span>
            <span>${{ l.price * l.qty }}</span>
          </div>
        </template>
        <div class="wf-summary__row wf-summary__row--total">
          <span>合計</span>
          <span>${{ totalPrice }}</span>
        </div>
      </div>

      <Transition name="wf-err-fade">
        <div v-if="errorMsg" class="wf-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="wf-error__icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ errorMsg }}</span>
          <button class="wf-error__close" @click="errorMsg = ''">✕</button>
        </div>
      </Transition>

      <button class="wf-submit" :disabled="submitting || selDates.length === 0 || selDates.some(dk => isDateClosed(dk))"
              @click="doSubmit">
        <span v-if="submitting" class="wf-spinner"></span>
        {{ submitting ? '送出中…' : '確認送出訂單' }}
      </button>

    </div><!-- /wf-wrap -->

    <div v-if="loginPanelOpen" class="wf-overlay" @click="loginPanelOpen = false"></div>

    <!-- 送出成功 Modal -->
    <Teleport to="body">
      <Transition name="wf-modal-fade">
        <div v-if="successModal" class="wf-modal-backdrop" @click.self="resetForm">
          <div class="wf-modal wf-modal--success">
            <div class="wf-modal__success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="wf-modal__title">訂單已送出！</h3>
            <pre class="wf-modal__content">{{ successMsg }}</pre>
            <p class="wf-modal__redirect-hint">
              {{ customer ? '正在跳轉至訂購紀錄…' : '正在跳轉至首頁…' }}
            </p>
            <div class="wf-modal__btns">
              <button class="confirm"
                      @click="customer ? $router.push('/front/profile/log?tab=wholefood-bakery') : $router.push('/')">
                {{ customer ? '前往訂購紀錄' : '返回首頁' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 品項圖片預覽 -->
    <Teleport to="body">
      <Transition name="wf-modal-fade">
        <div v-if="previewUrl" class="wf-modal-backdrop" @click.self="previewUrl = ''">
          <img :src="previewUrl" class="wf-img-preview" alt="" @click="previewUrl = ''">
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
  /* ── Page ── */
  .wf-page {
    min-height: 100vh;
    background: #f7f4ef;
    font-family: 'Noto Sans TC', sans-serif;
  }

  /* ── Header ── */
  .wf-header {
    background: linear-gradient(135deg, #7a4a2d 0%, #4a2c1a 100%);
    padding: 1.25rem 1.5rem;
    position: relative;
  }

  .wf-header__inner {
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .wf-header__logo {
    flex-shrink: 0;
    line-height: 0;
  }

  .wf-header__logo-img {
    height: 44px;
    filter: brightness(0) invert(1);
    opacity: 0.9;
  }

  /* flex-basis:0% 讓 title/sub 這個區塊拿到所有剩餘空間；
     min-width:0 是關鍵：沒有這行，中文字（CJK）沒有空白可斷行，
     瀏覽器會把「自動最小寬度」算成單一個字寬，導致極端窄的情況下
     整段文字被硬擠成一字一行、直直往下疊（手機上尤其明顯）。
     搭配下面 title/sub 的 nowrap + ellipsis，超出寬度就改成省略號，
     不會再有這種疊字問題。 */
  .wf-header__text {
    flex: 1 1 0%;
    min-width: 0;
  }

  .wf-header__title {
    font-family: 'Noto Serif TC', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wf-header__sub {
    font-size: 12px;
    color: #f0ddc8;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── 登入區塊 ── */
  .wf-login-area {
    position: relative;
    flex-shrink: 0;
  }

  .wf-login-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: inherit;
    font-size: 12.5px;
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 6px 12px;
    cursor: pointer;
  }

  .wf-avatar-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #7a4a2d;
    cursor: pointer;
    padding: 0;
  }

  .wf-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .wf-login-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    width: 240px;
    z-index: 100;
  }

  .wf-login-panel__hint {
    display: flex;
    gap: 6px;
    font-size: 12px;
    color: #6b5a4a;
    margin: 0 0 10px;
  }

  .wf-login-panel__user {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .wf-login-panel__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  .wf-login-panel__name {
    font-size: 13.5px;
    font-weight: 600;
    color: #2a2e25;
    margin: 0;
  }

  .wf-login-panel__email {
    font-size: 11.5px;
    color: #8a9e84;
    margin: 0;
  }

  .wf-login-panel__link {
    display: block;
    text-align: center;
    font-size: 12.5px;
    color: #7a4a2d;
    border: 1px solid #e0d3c5;
    border-radius: 8px;
    padding: 7px;
    margin-bottom: 6px;
  }

  .wf-login-panel__logout {
    width: 100%;
    font-family: inherit;
    font-size: 12.5px;
    color: #c0392b;
    background: #fdf0f0;
    border: none;
    border-radius: 8px;
    padding: 7px;
    cursor: pointer;
  }

  .wf-panel-fade-enter-active, .wf-panel-fade-leave-active {
    transition: opacity 0.15s, transform 0.15s;
  }

  .wf-panel-fade-enter-from, .wf-panel-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  .wf-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
  }

  /* ── Wrap ── */
  .wf-wrap {
    max-width: 560px;
    margin: 0 auto;
    padding: 1.25rem 1rem 3rem;
  }

  /* ── Notice ── */
  .wf-notice {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 1rem;
    font-size: 12.5px;
    line-height: 1.6;
  }

  .wf-notice--info {
    background: #f0f4fb;
    color: #35507a;
    border: 1px solid #cddbf0;
  }

  .wf-notice--warn {
    background: #fdf4ea;
    color: #8a5a1f;
    border: 1px solid #f0dcb8;
  }

  .wf-notice__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* ── Show More ── */
  .wf-show-more-btn {
    display: block;
    margin: 0 auto 1rem;
    font-family: inherit;
    font-size: 12.5px;
    color: #7a4a2d;
    background: #fff;
    border: 1px dashed #d9c4a8;
    border-radius: 8px;
    padding: 7px 16px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .wf-show-more-btn:hover {
    background: #fdf4ea;
  }

  /* ── Day Tabs ── */
  .wf-day-tabs__hint {
    font-size: 11.5px;
    color: #9c8a76;
    margin: 0 0 6px;
  }

  .wf-day-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 0.75rem;
  }

  .wf-day-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 14px;
    border: 1.5px solid #e0d3c5;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .wf-day-tab.active {
    background: #7a4a2d;
    border-color: #7a4a2d;
  }

  .wf-day-tab.active .wf-day-tab__label,
  .wf-day-tab.active .wf-day-tab__date {
    color: #fff;
  }

  .wf-day-tab.closed {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .wf-day-tab__check {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 10px;
    color: #fff;
  }

  .wf-day-tab__label {
    font-size: 13px;
    font-weight: 600;
    color: #4a2c1a;
  }

  .wf-day-tab__date {
    font-size: 11px;
    color: #9c8a76;
  }

  .wf-day-tab.active .wf-day-tab__date {
    color: #f0ddc8;
  }

  .wf-day-tab__closed {
    font-size: 10px;
    color: #c0392b;
  }

  /* ── Package ── */
  .wf-package {
    background: #fdf7f0;
    border: 1px solid #ecdcc6;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .wf-package__row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .wf-package__label {
    font-size: 12.5px;
    color: #6b5a4a;
    white-space: nowrap;
  }

  .wf-package__select {
    flex: 1;
    min-width: 110px;
    padding: 6px 10px;
    border: 1.5px solid #d9c4a8;
    border-radius: 8px;
    font-size: 13px;
    background: #fffaf3;
    color: #2a2e25;
    font-family: inherit;
  }

  .wf-package__toggle {
    font-family: inherit;
    font-size: 12px;
    color: #7a4a2d;
    background: #fff;
    border: 1px solid #e0d3c5;
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
    white-space: nowrap;
  }

  .wf-package__btn {
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: #fff;
    background: #7a4a2d;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .wf-package__btn:hover {
    background: #5c381f;
  }

  /* ── Card ── */
  .wf-card {
    background: #fff;
    border: 1px solid #ecdcc6;
    border-radius: 12px;
    padding: 1.1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .wf-card__title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 15px;
    font-weight: 600;
    color: #4a2c1a;
    margin-bottom: 1rem;
    font-family: 'Noto Serif TC', serif;
  }

  .wf-card__title svg {
    width: 18px;
    height: 18px;
    color: #7a4a2d;
    flex-shrink: 0;
  }

  .wf-card--day .wf-card__title {
    justify-content: space-between;
  }

  .wf-day-apply-btn {
    margin-left: auto;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: #7a4a2d;
    background: #fdf4ea;
    border: 1px solid #e0c9a8;
    border-radius: 20px;
    padding: 4px 10px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .wf-day-apply-btn:hover {
    background: #f5e6d0;
  }

  .wf-day-remove-btn {
    margin-left: auto;
    font-family: inherit;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1;
    color: #c0392b;
    background: #fdf0f0;
    border: 1px solid #f5c6c6;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .wf-day-remove-btn:hover {
    background: #fbe0e0;
  }

  .wf-day-subtotal {
    margin-top: 10px;
    text-align: right;
    font-size: 12.5px;
    font-weight: 600;
    color: #4a2c1a;
  }

  /* ── Field ── */
  .wf-field {
    margin-bottom: 1rem;
  }

  .wf-field:last-child {
    margin-bottom: 0;
  }

  .wf-field label {
    display: block;
    font-size: 13px;
    color: #6b5a4a;
    margin-bottom: 5px;
    font-weight: 500;
  }

  .wf-field input[type=text],
  .wf-field input[type=tel],
  .wf-field textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid #d9c4a8;
    border-radius: 8px;
    font-size: 14px;
    background: #fffaf3;
    color: #2a2e25;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }

  .wf-field input:focus, .wf-field textarea:focus {
    border-color: #7a4a2d;
  }

  .wf-field textarea {
    resize: none;
  }

  .wf-required {
    color: #c0392b;
  }

  /* ── Suggest ── */
  .wf-field__suggest-wrap {
    position: relative;
  }

  .wf-suggest {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #d9c4a8;
    border-radius: 8px;
    margin-top: 3px;
    z-index: 50;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .wf-suggest__item {
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    color: #2a2e25;
    border-bottom: 1px solid #f2e9dd;
    transition: background 0.12s;
  }

  .wf-suggest__item:last-child {
    border-bottom: none;
  }

  .wf-suggest__item:hover {
    background: #fdf4ea;
  }

  /* ── Hero：品項照片橫向排列 ── */
  .wf-hero {
    background: linear-gradient(180deg, #4a2c1a 0%, #f7f4ef 100%);
    padding: 0.75rem 0 1rem;
  }

  .wf-hero__scroll {
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    padding: 2px 1rem 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .wf-hero__scroll::-webkit-scrollbar {
    display: none;
  }

  .wf-hero__item {
    position: relative;
    flex-shrink: 0;
    width: 72px;
    height: 72px;
  }

  .wf-hero__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
    display: block;
    border: 2px solid #fff;
    box-shadow: 0 4px 14px rgba(74, 44, 26, 0.25);
  }

  .wf-hero__badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    box-sizing: border-box;
    border-radius: 10px;
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }

  /* ── 烘焙坊資訊卡 ── */
  .wf-info {
    background: #fffaf3;
    border: 1px solid #ecdcc6;
    border-radius: 12px;
    padding: 0.9rem 1.1rem;
    margin-bottom: 1rem;
  }

  .wf-info__slogan {
    display: inline-block;
    font-family: 'Noto Serif TC', serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: #6f7a45;
    border-radius: 6px;
    padding: 3px 10px;
    margin: 0 0 8px;
  }

  .wf-info__desc {
    font-size: 12.5px;
    line-height: 1.75;
    color: #6b5a4a;
    margin: 0 0 10px;
  }

  .wf-info__desc em {
    font-style: normal;
    color: #c0392b;
    font-weight: 600;
  }

  .wf-info__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .wf-info__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fff;
    border: 1px solid #ecdcc6;
    border-radius: 8px;
    padding: 7px 10px;
    text-decoration: none;
    min-width: 0;
  }

  .wf-info__item--link:hover {
    background: #fdf4ea;
  }

  .wf-info__label {
    font-size: 11px;
    color: #9c8a76;
  }

  .wf-info__value {
    font-size: 12.5px;
    font-weight: 600;
    color: #4a2c1a;
  }

  @media (max-width: 520px) {
    .wf-info__grid {
      grid-template-columns: 1fr;
    }

    .wf-info__item {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  /* ── 分類區塊 ── */
  .wf-cat-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wf-cat__head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Noto Serif TC', serif;
    font-size: 13.5px;
    font-weight: 600;
    color: #7a4a2d;
    background: none;
    border: none;
    border-bottom: 1px dashed #e0cdb3;
    padding: 2px 2px 6px;
    margin-bottom: 8px;
    cursor: pointer;
    text-align: left;
  }

  .wf-cat__emoji {
    font-size: 15px;
  }

  .wf-cat__name {
    flex: 1;
  }

  .wf-cat__count {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 11px;
    font-weight: 500;
    color: #fff;
    background: #c97b3d;
    border-radius: 10px;
    padding: 1px 8px;
  }

  .wf-cat__arrow {
    font-size: 10px;
    color: #b09a80;
  }

  /* ── Order Rows / Item List ── */
  .wf-order-rows, .wf-item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .wf-item-list {
    margin-bottom: 0.25rem;
  }

  .wf-order-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #fbead9;
    border-radius: 10px;
  }

  .wf-order-row__img-wrap {
    width: 48px;
    height: 48px;
    border-radius: 9px;
    overflow: hidden;
    flex-shrink: 0;
    cursor: zoom-in;
    background: #f1e6d3;
    box-shadow: 0 2px 6px rgba(74, 44, 26, 0.15);
  }

  .wf-order-row__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .wf-order-row__img--placeholder {
    width: 48px;
    height: 48px;
    border-radius: 9px;
    flex-shrink: 0;
    background: #f1e6d3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .wf-order-row__badge {
    flex-shrink: 0;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    box-sizing: border-box;
    border-radius: 11px;
    color: #fff;
    font-size: 11.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wf-order-row__label {
    flex: 1;
    font-size: 13.5px;
    color: #2a2e25;
  }

  .wf-order-row__sub {
    display: block;
    font-size: 11.5px;
    color: #9c8a76;
    margin-top: 2px;
  }

  /* ── Qty Ctrl ── */
  .wf-qty-ctrl {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wf-qty-ctrl button {
    width: 28px;
    height: 28px;
    border: 1.5px solid #d9c4a8;
    border-radius: 7px;
    background: #fff;
    cursor: pointer;
    font-size: 16px;
    color: #4a2c1a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .wf-qty-ctrl button:hover {
    background: #fdf4ea;
  }

  .wf-qty-ctrl input {
    width: 42px;
    text-align: center;
    padding: 4px 2px;
    border: 1.5px solid #d9c4a8;
    border-radius: 7px;
    font-size: 14px;
    background: #fff;
    color: #2a2e25;
    font-family: inherit;
  }

  /* 桌機瀏覽器會幫 type=number 加上原生上下箭頭，把數字往左擠，
     跟旁邊自訂的 −/+ 按鈕重複又搶位置，所以關掉原生箭頭。 */
  .wf-qty-ctrl input::-webkit-outer-spin-button,
  .wf-qty-ctrl input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .wf-qty-ctrl input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /* ── Summary ── */
  .wf-summary {
    background: #fff;
    border: 1px solid #ecdcc6;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 1rem;
  }

  .wf-summary__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 3px 0;
    color: #6b5a4a;
  }

  .wf-summary__row--total {
    font-size: 14px;
    font-weight: 600;
    color: #4a2c1a;
    border-top: 1px solid #ecdcc6;
    margin-top: 6px;
    padding-top: 8px;
  }

  .wf-summary__row--day {
    font-size: 12.5px;
    font-weight: 600;
    color: #7a4a2d;
    padding-top: 8px;
  }

  .wf-summary__row--day:first-child {
    padding-top: 0;
  }

  /* ── Error ── */
  .wf-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fdf0f0;
    border: 1px solid #f5c6c6;
    border-radius: 10px;
    padding: 11px 14px;
    margin-bottom: 1rem;
    font-size: 13px;
    color: #c0392b;
  }

  .wf-error__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .wf-error span {
    flex: 1;
    line-height: 1.5;
  }

  .wf-error__close {
    background: none;
    border: none;
    color: #c0392b;
    cursor: pointer;
    font-size: 14px;
    padding: 0 2px;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .wf-error__close:hover {
    opacity: 1;
  }

  .wf-err-fade-enter-active, .wf-err-fade-leave-active {
    transition: opacity 0.2s, transform 0.2s;
  }

  .wf-err-fade-enter-from, .wf-err-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  /* ── Submit ── */
  .wf-submit {
    width: 100%;
    padding: 13px;
    background: #7a4a2d;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .wf-submit:hover:not(:disabled) {
    background: #5c381f;
  }

  .wf-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .wf-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Modal ── */
  .wf-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .wf-modal {
    background: #fff;
    border-radius: 14px;
    padding: 1.5rem;
    width: 280px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  }

  .wf-img-preview {
    max-width: 92vw;
    max-height: 85vh;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
    cursor: zoom-out;
  }

  .wf-modal--success {
    width: 320px;
    text-align: center;
  }

  .wf-modal__title {
    font-size: 15px;
    font-weight: 600;
    color: #4a2c1a;
    margin: 0 0 1rem;
    font-family: 'Noto Serif TC', serif;
  }

  .wf-modal__content {
    font-size: 13px;
    color: #3a4e36;
    background: #fbf5eb;
    border-radius: 8px;
    padding: 12px;
    white-space: pre-wrap;
    text-align: left;
    margin: 0 0 0.75rem;
    line-height: 1.7;
    font-family: inherit;
    max-height: 40vh;
    overflow-y: auto;
  }

  .wf-modal__redirect-hint {
    font-size: 12px;
    color: #9c8a76;
    margin: 0 0 0.75rem;
  }

  .wf-modal__success-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #f5e9da;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem;
  }

  .wf-modal__success-icon svg {
    width: 26px;
    height: 26px;
    color: #7a4a2d;
  }

  .wf-modal__btns {
    display: flex;
    gap: 8px;
  }

  .wf-modal__btns button {
    flex: 1;
    padding: 9px;
    border: 1.5px solid #d9c4a8;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    background: #fffaf3;
    color: #3a4e36;
    font-family: inherit;
    transition: background 0.15s;
  }

  .wf-modal__btns button.confirm {
    background: #7a4a2d;
    color: #fff;
    border-color: #7a4a2d;
  }

  .wf-modal__btns button.confirm:hover {
    background: #5c381f;
  }

  /* ── Transitions ── */
  .wf-modal-fade-enter-active, .wf-modal-fade-leave-active {
    transition: opacity 0.2s;
  }

  .wf-modal-fade-enter-from, .wf-modal-fade-leave-to {
    opacity: 0;
  }

  /* ── 極窄螢幕（舊款小手機、瀏覽器 App 內嵌視窗）額外收緊 header ── */
  /* 窄螢幕：副標題（品牌敘述）先讓位給標題跟頭像，避免三者擠在同一行
     互相覆蓋——副標題本來就是次要資訊，隱藏掉不影響操作。 */
  @media (max-width: 420px) {
    .wf-header {
      padding: 1rem 1rem;
    }

    .wf-header__inner {
      gap: 0.6rem;
    }

    .wf-header__logo-img {
      height: 34px;
    }

    .wf-header__title {
      font-size: 1rem;
    }

    .wf-header__sub {
      display: none;
    }

    .wf-login-btn {
      padding: 5px 10px;
      font-size: 11.5px;
    }

    .wf-avatar-btn {
      width: 32px;
      height: 32px;
    }
  }

  /* ── 桌機／寬螢幕優化（≥900px）──────────────────────────────────
     手機版是單欄窄版面，直接拿到寬螢幕上會兩側留一大片空白、
     品項一條一條排很長。這裡把容器加寬、品項改雙欄並排、
     hero 照片放大一點，讓寬螢幕也有合理的版面密度。 */
  @media (min-width: 900px) {
    .wf-header__inner,
    .wf-wrap {
      max-width: 760px;
    }

    /* 桌機用滑鼠沒辦法像手機觸控那樣滑動捲軸，乾脆改成自動換行全部顯示，
       不用再靠拖曳捲動——寬度也夠放好幾張。 */
    .wf-hero__scroll {
      max-width: 900px;
      flex-wrap: wrap;
      overflow-x: visible;
      row-gap: 14px;
    }

    .wf-hero__item {
      width: 92px;
      height: 92px;
    }

    .wf-card {
      padding: 1.4rem 1.75rem;
    }

    .wf-order-rows,
    .wf-item-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    /* 訂購人卡片改用 grid：標題整排、姓名／聯絡方式並排、備註獨立整排 */
    .wf-card:not(.wf-card--day) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }

    .wf-card:not(.wf-card--day) .wf-card__title,
    .wf-card:not(.wf-card--day) .wf-field:nth-of-type(4) {
      grid-column: 1 / -1;
    }

    /* 摘要卡片跟送出按鈕維持較窄寬度，太寬反而不好閱讀掃視 */
    .wf-summary,
    .wf-submit {
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  /* ── 更寬的螢幕（≥1280px）：再往外撐一點，品項改三欄，
     避免兩側留白比內容本身還大片 ── */
  @media (min-width: 1280px) {
    .wf-header__inner,
    .wf-hero__scroll,
    .wf-wrap {
      max-width: 1040px;
    }

    .wf-order-rows,
    .wf-item-list {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>