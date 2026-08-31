<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useCommonStore } from '~/stores/common.js'
import { useCustomerStore } from '~/stores/customer.js'

definePageMeta({ layout: 'front' })

useSiteHead()

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const BOOKING_BASE = computed(() => commonStore.data.main_url + '/holy/booking')
// 營業時間設定跟便當訂購共用同一份（RestaurantHoursController），不是訂位獨立一份
const HOURS_BASE = computed(() => commonStore.data.main_url + '/holy/restaurant/hours')
const NOTICE_BASE = computed(() => `${BOOKING_BASE.value}/notice`)
const TIMESLOT_BASE = computed(() => `${BOOKING_BASE.value}/timeslot`)

// 注意事項可能撈不到（例如剛部署、API 還沒起來），先給一份跟後端預設值一致的保底文字，
// 避免頁面一開始空白一塊；撈到之後會被 fetchNotice() 蓋掉
const bNoticeLines = ref([
  '請提前一日完成預約，以便我們備料。',
  '週六是否開放訂位視當日訂位狀況而定，日曆上未開放的日期請直接來電洽詢。',
  '國定假日或臨時公休日，日曆會自動標示為不可預約。',
  '預約送出後為「待確認」狀態，我們將盡快電話確認。',
  '如需取消，請提前來電告知，謝謝。'
])
const fetchNotice = async () => {
  try {
    const data = await (await fetch(NOTICE_BASE.value)).json()
    if (Array.isArray(data.lines) && data.lines.length > 0) bNoticeLines.value = data.lines
  } catch { /* 撈不到就維持保底文字 */ }
}
const CUSTOMER_BASE = computed(() => commonStore.data.main_url + '/holy/customer')
const GOOGLE_CLIENT_ID = computed(() => commonStore.data.google_client_id)

const router = useRouter()

// ── 登入狀態（訂位需先登入）───────────────────────────────────────
// authLoading：頁面剛載入時先確認是否已登入（例如重新整理），避免還沒查完就先閃一次「請登入」畫面
const authLoading = ref(true)
const customer = computed(() => customerStore.customer)
const isLoggedIn = computed(() => !!customer.value)

const fetchMe = async () => {
  try {
    const data = await (await fetch(`${CUSTOMER_BASE.value}/me`, { credentials: 'include' })).json()
    if (!data.error) customerStore.setCustomer(data)
  } catch { /* 未登入或查詢失敗，維持訪客狀態 */ }
}

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
    theme: 'outline', size: 'large', text: 'signin_with', locale: 'zh-TW', width: 260,
  })
}

const handleCredential = async (response) => {
  try {
    const res = await fetch(`${CUSTOMER_BASE.value}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential })
    })
    const data = await res.json()
    if (!data.error) customerStore.setCustomer(data)
  } catch { /* 登入失敗時維持訪客狀態，讓使用者可再試一次 */ }
}

// 載入 Google Identity Services 腳本（可能已被 Navbar 載入過，避免重複插入 script 標籤）
const setupGoogleLogin = () => {
  nextTick(() => {
    if (isLoggedIn.value) return
    if (window.google) {
      initGoogle()
      renderGoogleBtn('booking-google-btn')
      return
    }
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => { initGoogle(); renderGoogleBtn('booking-google-btn') }
      document.head.appendChild(script)
    } else {
      // script 標籤已存在（可能是 Navbar 加的）但 window.google 還沒 ready，稍等後重試
      const check = setInterval(() => {
        if (window.google) {
          clearInterval(check)
          initGoogle()
          renderGoogleBtn('booking-google-btn')
        }
      }, 200)
    }
  })
}

// ── 成功 Modal ────────────────────────────────────────────────────
const bShowSuccessModal = ref(false)
const bConfirmSuccess = () => {
  bShowSuccessModal.value = false
  router.push('/front/profile/log')
}

// ── Google 登入帶入資料 ───────────────────────────────────────────
// customerStore.customer 本身（來自 /holy/customer/me 或登入回應）就已經含 mobile/landline，
// 不用再另外打一次「/holy/customer/profile?customerId=」查——那支端點其實不存在
// （CustomerController 的 /profile 只有 PUT，且是用 cookie 驗身更新自己的資料，不吃 customerId
// 查詢參數；用 customerId 讓任何人查到別人電話也不安全），之前打下去只會是 405。
watch(() => customerStore.customer, (c) => {
  if (c?.name && !bForm.name) bForm.name = c.name
  if (c?.id && !bForm.phone) {
    if (c.mobile) bForm.phone = c.mobile
    else if (c.landline) bForm.phone = c.landline
  }
})

// ── 日期工具 ─────────────────────────────────────────────────────
const toDateStr = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── 月曆基礎（需在 bForm 之前宣告）────────────────────────────────
const bCal = new Date(); bCal.setHours(0, 0, 0, 0)
const bTodayStr = toDateStr(bCal)
const bCalYear = ref(bCal.getFullYear())
const bCalMonth = ref(bCal.getMonth() + 1)

// ── 營業日設定（固定營業星期 / 國定假日公休 / 週六等臨時開放）────────
// 目前固定營業日為一~五；週六是否開放由店家依訂位狀況決定（openDates），
// 未來如客人變多、店家改為一~六營業，後台調整「營業設定」即可，前台會自動反映
const bSettings = reactive({ openWeekdays: [1, 2, 3, 4, 5], closedDates: {}, openDates: {} })
const fetchBookingSettings = async () => {
  try {
    const data = await (await fetch(`${HOURS_BASE.value}/get`)).json()
    if (Array.isArray(data.openWeekdays)) bSettings.openWeekdays = data.openWeekdays
    bSettings.closedDates = data.closedDates || {}
    bSettings.openDates = data.openDates || {}
  } catch { /* 撈不到設定時，維持預設一~五營業，避免整個日曆無法使用 */ }
}
// 判斷某日期是否開放線上訂位：公休日 > 額外開放日 > 每週固定營業日
const bIsBookable = (dateStr) => {
  if (bSettings.closedDates[dateStr] !== undefined) return false
  if (bSettings.openDates[dateStr] !== undefined) return true
  if (dateStr === bTodayStr && bTodayFullyPassed.value) return false
  const dow = new Date(dateStr).getDay()
  return bSettings.openWeekdays.includes(dow)
}
// 該日期不可訂位時，顯示原因用的提示文字：店家有填備註就顯示備註，沒填就顯示制式的休息訊息
const bDayNote = (dateStr) => {
  if (bSettings.closedDates[dateStr] !== undefined) {
    return bSettings.closedDates[dateStr] || '餐廳今日公休，如有需要請來電洽詢'
  }
  if (bSettings.openDates[dateStr] !== undefined) {
    return bSettings.openDates[dateStr] || '本日臨時開放訂位'
  }
  if (dateStr === bTodayStr && bTodayFullyPassed.value) return '今日可訂位時段已截止，請選擇其他日期或直接來電洽詢'
  if (!bSettings.openWeekdays.includes(new Date(dateStr).getDay())) return '餐廳今日公休，如有需要請來電洽詢'
  return ''
}
// 從某天（不含當天）往後找最近一個可訂位的日期，找不到（例如連續公休超過 maxDays 天）回傳 null。
// 只依「公休/營業日設定」判斷，不含個別日期實際有沒有開放時段——那要等 bSelectDate 撈完
// 該日的到場時間才知道，這裡只負責跳過明顯不可能的日子（公休日、今天已截止）
const bFindNextBookableDate = (fromDateStr, maxDays = 60) => {
  const d = new Date(fromDateStr)
  for (let i = 1; i <= maxDays; i++) {
    d.setDate(d.getDate() + 1)
    const mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
    const str = `${d.getFullYear()}-${mm}-${dd}`
    if (bIsBookable(str)) return str
  }
  return null
}

// ── 電話驗證 ─────────────────────────────────────────────────────
const validateMobile = c => /^09\d{8}$/.test(c)
const validateLandline = (c) => {
  if (/^02\d{8}$/.test(c)) return true
  if (/^0[3-8]\d{7,8}$/.test(c)) return true
  if (/^037\d{6}$/.test(c)) return true
  if (/^049\d{6}$/.test(c)) return true
  if (/^089\d{6}$/.test(c)) return true
  if (/^082[36]\d{6}$/.test(c)) return true
  if (/^0836\d{6}$/.test(c)) return true
  return false
}
const validateTWPhone = (val) => {
  if (!val) return false
  const clean = val.replace(/[-\s]/g, '')
  return validateMobile(clean) || validateLandline(clean)
}

// ── 步驟 ─────────────────────────────────────────────────────────
// 目前時刻 "HH:mm"，用來過濾「選today」時已經過去的用餐時段（防止例如現在已經下午，
// 還能選中午 12:00 的時段）；每分鐘更新一次，避免使用者長時間停留在同一頁面導致判斷過期
const bNowHM = ref(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`)
let bNowTimer = null
const bStep = ref(0)
const bSteps = ['選擇日期', '填寫資料', '確認送出']
const bForm = reactive({ name: '', phone: '', date: bTodayStr, time: '', note: '',
  meatQty: 0, fullVegQty: 0, eggVegQty: 0, spiceVegQty: 0 })
const bErrors = reactive({})
const bSubmitting = ref(false)
const bSubmitError = ref('')

// ── 到場時間（跟後台「訂位到場時間設定」RestaurantTimeSlotController 同一份資料）─────
// 完全沒設定過任何時段時，後端 isTimeBookable() 視為不限制，但 /slots 端點會回傳空陣列，
// 前端這裡要自己補一組保底時段，不然客人會選不到任何時間
const bTimeSlotsFallback = ['11:00', '11:10', '11:20', '11:30', '11:40', '11:50', '12:00', '12:10', '12:20', '12:30', '12:40', '12:50', '13:00']
// 是否曾經設定過任何到場時間（用 /list 撈一次判斷），用來分辨「/slots 回空陣列」到底是
// 「完全沒設定過，視為不限制」還是「有設定，但這天真的沒有開放任何時段」
const bTimeSlotSettingsExist = ref(false)
const fetchTimeSlotSettingsExist = async () => {
  try {
    const list = await (await fetch(`${TIMESLOT_BASE.value}/list`)).json()
    bTimeSlotSettingsExist.value = Array.isArray(list) && list.length > 0
  } catch { bTimeSlotSettingsExist.value = false }
}
// 把 /slots 端點回傳的分組資料（多個時段各自的 slots 陣列）攤平成單一、去重、排序後的時間清單；
// 回傳空陣列時，依上面的判斷決定要不要退回保底時段
const flattenSlots = (groups) => {
  const flat = (groups || []).flatMap(g => g.slots || [])
  const uniqSorted = [...new Set(flat)].sort()
  if (uniqSorted.length > 0) return uniqSorted
  return bTimeSlotSettingsExist.value ? [] : bTimeSlotsFallback
}
// 目前選取日期的原始可選時段（尚未套用「今天已過去」的過濾）
const bRawTimeSlots = ref(bTimeSlotsFallback)
const bTimeSlotsLoading = ref(false)
const fetchTimeSlots = async (date) => {
  bTimeSlotsLoading.value = true
  try {
    const groups = await (await fetch(`${TIMESLOT_BASE.value}/slots?date=${date}`)).json()
    bRawTimeSlots.value = flattenSlots(groups)
  } catch { bRawTimeSlots.value = bTimeSlotsFallback } finally { bTimeSlotsLoading.value = false }
}
// 「今天」的原始時段（跟目前選的日期無關，只用來判斷日曆上今天這一格要不要標成不可訂），
// 進頁面時抓一次就好，不會隨使用者切換日曆月份而改變
const bTodayRawSlots = ref([])
const bTodayRawSlotsLoaded = ref(false)
const fetchTodayRawSlots = async () => {
  try {
    const groups = await (await fetch(`${TIMESLOT_BASE.value}/slots?date=${bTodayStr}`)).json()
    bTodayRawSlots.value = flattenSlots(groups)
  } catch { bTodayRawSlots.value = bTimeSlotsFallback } finally { bTodayRawSlotsLoaded.value = true }
}
// 「今天」還沒過去的時段
const bTodayAvailableSlots = computed(() => bTodayRawSlots.value.filter(t => t > bNowHM.value))
// 今天是否所有時段都已經截止（要等 bTodayRawSlots 撈完才判斷，避免撈取中先閃一次「已截止」）
const bTodayFullyPassed = computed(() =>
    bTodayRawSlotsLoaded.value && bTodayRawSlots.value.length > 0 && bTodayAvailableSlots.value.length === 0
)
// 選的日期若是「今天」，只留下還沒過去的時段；選其他日期則不受限制
const bAvailableTimeSlots = computed(() =>
    bForm.date === bTodayStr ? bRawTimeSlots.value.filter(t => t > bNowHM.value) : bRawTimeSlots.value
)
// 選擇日期這一步是否可以按「下一步」：日期本身要可訂、當天要真的有撈到至少一個時段、
// 而且時段還在讀取中也先擋著（避免搶在 fetchTimeSlots 判斷出「這天其實沒有時段」之前就放行）
const bDateStepValid = computed(() =>
    !!bForm.date && bIsBookable(bForm.date) && !bTimeSlotsLoading.value && bRawTimeSlots.value.length > 0
)
const bDietOptions = [
  { key: 'meatQty', icon: '🍖', label: '葷食', desc: '含肉類料理' },
  { key: 'fullVegQty', icon: '🌿', label: '全素', desc: '不含蛋奶五辛' },
  { key: 'eggVegQty', icon: '🥚', label: '蛋奶素', desc: '可食蛋奶製品' },
  { key: 'spiceVegQty', icon: '🧄', label: '五辛素', desc: '可食蔥薑蒜' }
]
const bTotalGuests = computed(() =>
    bForm.meatQty + bForm.fullVegQty + bForm.eggVegQty + bForm.spiceVegQty
)

// ── 月曆（續）────────────────────────────────────────────────────

const bCanPrevMonth = computed(() =>
    bCalYear.value > bCal.getFullYear()
    || (bCalYear.value === bCal.getFullYear() && bCalMonth.value > bCal.getMonth() + 1))
const bPrevMonth = () => {
  if (!bCanPrevMonth.value) return
  if (bCalMonth.value === 1) { bCalYear.value--; bCalMonth.value = 12 } else bCalMonth.value--
}
const bNextMonth = () => {
  if (bCalMonth.value === 12) { bCalYear.value++; bCalMonth.value = 1 } else bCalMonth.value++
}
const bCalDays = computed(() => {
  const firstDay = new Date(bCalYear.value, bCalMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(bCalYear.value, bCalMonth.value, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push({ label: '', date: null, disabled: true })
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(bCalMonth.value).padStart(2, '0'), dd = String(d).padStart(2, '0')
    const str = `${bCalYear.value}-${mm}-${dd}`
    const isPast = str < bTodayStr
    const bookable = bIsBookable(str)
    days.push({
      label: d,
      date: str,
      disabled: isPast,
      closed: !isPast && !bookable,
      note: isPast ? '' : bDayNote(str)
    })
  }
  return days
})
const bDayClass = (day) => {
  if (!day.date) return 'booking-cal__day--empty'
  if (day.closed) return 'booking-cal__day--closed'
  if (day.disabled) return 'booking-cal__day--disabled'
  if (day.date === bForm.date) return 'booking-cal__day--selected'
  return 'booking-cal__day--available'
}

const bDateGuests = ref(0)
const bDateGuestsLoading = ref(false)
const bSelectDate = async (date) => {
  bForm.date = date
  bDateGuests.value = 0
  // 未開放訂位的日期（公休、非固定營業日…）：點了立刻顯示提示，不要等到按下一步才知道，
  // 手機沒有滑鼠 hover，不能只靠 title 提示
  if (!bIsBookable(date)) {
    bErrors.date = bDayNote(date) || '該日期未開放訂位，請重新選擇'
    return
  }
  delete bErrors.date
  await fetchTimeSlots(date)
  // 日期本身有開放（公休/營業日檢查都過了），但這天實際上沒有設定任何到場時間
  // （例如只設了臨時時段給別的日子，這天沒有預設時段可用）：一樣視為不可訂
  if (bRawTimeSlots.value.length === 0) {
    bErrors.date = '該日期尚未開放任何用餐時段，請洽詢門市或選擇其他日期'
    return
  }
  bDateGuestsLoading.value = true
  try {
    const data = await (await fetch(`${BOOKING_BASE.value}/get/${date}`)).json()
    const bookings = Array.isArray(data) ? data : []
    bDateGuests.value = bookings.reduce((sum, b) =>
        sum + (b.meatQty || 0) + (b.fullVegQty || 0) + (b.eggVegQty || 0) + (b.spiceVegQty || 0), 0)
  } catch { bDateGuests.value = 0 } finally { bDateGuestsLoading.value = false }
}

const bSummary = computed(() => {
  const rows = [
    { label: '日期', value: bForm.date },
    { label: '時間', value: bForm.time }
  ]
  const dietMap = { meatQty: '葷食', fullVegQty: '全素', eggVegQty: '蛋奶素', spiceVegQty: '五辛素' }
  for (const [key, label] of Object.entries(dietMap)) {
    if (bForm[key] > 0) rows.push({ label, value: `${bForm[key]} 份` })
  }
  rows.push({ label: '合計', value: `${bTotalGuests.value} 人` })
  if (bForm.note) rows.push({ label: '備註', value: bForm.note })
  return rows
})

const bNextStep = () => {
  Object.keys(bErrors).forEach(k => delete bErrors[k])
  if (bStep.value === 0) {
    if (!bForm.date) { bErrors.date = '請選擇用餐日期'; return }
    if (!bIsBookable(bForm.date)) { bErrors.date = bDayNote(bForm.date) || '該日期未開放訂位，請重新選擇'; return }
  }
  if (bStep.value === 1) {
    if (!bForm.name.trim()) bErrors.name = '請輸入姓名'
    if (!bForm.phone.trim()) bErrors.phone = '請輸入聯絡電話'
    else if (!validateTWPhone(bForm.phone)) bErrors.phone = '請輸入正確的手機（09xxxxxxxx）或市話（如 02-12345678、07-1234567）'
    if (bTotalGuests.value === 0) bErrors.diet = '請至少選擇一份餐點'
    // 防呆：使用者可能在這頁停留很久，選的時間可能在填資料的期間變成過去式
    if (bForm.date === bTodayStr && !bAvailableTimeSlots.value.includes(bForm.time)) {
      bErrors.time = '所選時間已過，請重新選擇用餐時間'
    }
    if (Object.keys(bErrors).length > 0) return
  }
  bStep.value++
}

const bSubmit = async () => {
  bSubmitError.value = ''; bSubmitting.value = true
  try {
    const res = await fetch(`${BOOKING_BASE.value}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...bForm, status: '待確認', customerId: customerStore.customer?.id ?? '' })
    })
    if (!res.ok) throw new Error()
    const text = await res.text()
    // 後端遇到不可訂位日期等情況會回傳「錯誤：…」文字（HTTP 狀態仍是 200），需另外判斷
    if (text.startsWith('錯誤')) { bSubmitError.value = text; return }
    Object.assign(bForm, { name: '', phone: '', date: '', time: '', note: '',
      meatQty: 0, fullVegQty: 0, eggVegQty: 0, spiceVegQty: 0 })
    bStep.value = 0
    bShowSuccessModal.value = true
  } catch { bSubmitError.value = '預約送出失敗，請稍後再試或直接來電。' } finally { bSubmitting.value = false }
}

onMounted(async () => {
  // 訪客先確認一次是否已登入（例如重新整理頁面），避免畫面先閃一次「請登入」才變成表單
  if (!customerStore.customer) await fetchMe()
  authLoading.value = false
  if (!isLoggedIn.value) setupGoogleLogin()

  const c = customerStore.customer
  if (c?.name && !bForm.name) bForm.name = c.name

  // 若有設定電話，自動帶入（customerStore.customer 已含 mobile/landline，見上方 watch 註解）
  if (c?.id && !bForm.phone) {
    if (c.mobile) bForm.phone = c.mobile
    else if (c.landline) bForm.phone = c.landline
  }

  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display
          = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block'
          : 'none'
    }
  }
  fetchNotice()
  // 這三個都要 await：bSettings（公休/營業日）、有沒有設定過到場時間、今天的原始時段，
  // 都是「今天算不算可訂」「要不要自動跳下一個可訂日期」判斷的依據，缺一都可能誤判
  await fetchBookingSettings()
  await fetchTimeSlotSettingsExist()
  await fetchTodayRawSlots()

  // 今天已經不可訂位（例如時段全部過去、或今天剛好公休）時，直接預設跳到下一個可訂日期，
  // 不要讓使用者停在一個明顯不能選的日期上還要自己往後翻日曆
  const initialDate = bIsBookable(bTodayStr) ? bTodayStr : (bFindNextBookableDate(bTodayStr) || bTodayStr)
  if (initialDate !== bTodayStr) {
    // 跳到下個月甚至更後面時，日曆也要跟著翻到那個月份
    const [y, m] = initialDate.split('-')
    bCalYear.value = Number(y)
    bCalMonth.value = Number(m)
  }
  bSelectDate(initialDate)

  // 每分鐘更新一次目前時刻，讓「今天已過去的時段」判斷不會因為使用者長時間停留而過期
  bNowTimer = setInterval(() => {
    bNowHM.value = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  }, 60000)
})

onUnmounted(() => {
  if (bNowTimer) clearInterval(bNowTimer)
})

// 選的時間若不在（新的）可選清單裡——包含「選了今天但時間後來過去了」——自動帶到第一個可選時段
watch(bAvailableTimeSlots, (slots) => {
  if (!slots.includes(bForm.time)) bForm.time = slots[0] || ''
}, { immediate: true })

// 訪客在此頁登入成功後，隱藏登入畫面、改顯示訂位表單（Google 按鈕只會在未登入時渲染一次，這裡不需再呼叫 setupGoogleLogin）
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) authLoading.value = false
})
</script>

<template>
  <div class="overflow">

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img
            class="img-fluid d-md-none mob-cover"
            src="/images/restaurant/mobile-restaurant-cover.png"
            alt=""
        >
        <img
            class="img-fluid d-none d-md-inline-block mob-cover"
            src="/images/restaurant/restaurant-cover.png"
            alt=""
        >
        <img
            class="cover-title"
            src="/images/restaurant/restaurant-title.png"
            alt=""
        >
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <div
          id="body"
          class="container"
      />
      <section
          id="breadcrumb"
          class="my-1 mx-3 mx-sm-5"
      >
        <NuxtLink to="/front/public">首頁</NuxtLink>
        > <NuxtLink to="/front/restaurant">田園餐廳</NuxtLink>
        > 線上訂位
      </section>
      <section
          id="content"
          class="mx-3 mx-sm-5"
      >
        <div class="bar-green bar-green-center" />
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-8 col-lg-7 rounded bg-lightGreen py-4 px-3 px-sm-4">
                <!-- 登入狀態確認中 -->
                <div v-if="authLoading" class="booking-auth-loading">
                  確認登入狀態中…
                </div>

                <!-- 未登入：需先登入才能訂位 -->
                <div v-else-if="!isLoggedIn" class="booking-auth-gate">
                  <div class="booking-auth-gate__icon">🔒</div>
                  <h2 class="booking-auth-gate__title">請先登入才能線上訂位</h2>
                  <p class="booking-auth-gate__hint">使用 Google 帳號登入後即可開始預約，也能查詢您的訂位紀錄</p>
                  <div id="booking-google-btn" class="booking-auth-gate__google" />
                </div>

                <template v-else>
                  <!-- 步驟列 -->
                  <div class="booking-steps">
                    <div
                        v-for="(step, idx) in bSteps"
                        :key="step"
                        class="booking-step"
                        :class="bStep === idx ? 'booking-step--active' : bStep > idx ? 'booking-step--done' : 'booking-step--pending'"
                    >
                    <span class="booking-step__inner">
                      <svg
                          v-if="bStep > idx"
                          class="booking-step__check"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                          v-else
                          class="booking-step__num"
                          :class="bStep === idx ? 'booking-step__num--active' : ''"
                      >
                        {{ idx + 1 }}
                      </span>
                      {{ step }}
                    </span>
                      <div
                          v-if="bStep === idx"
                          class="booking-step__bar"
                      />
                    </div>
                  </div>

                  <!-- Step 0：選擇日期 -->
                  <div v-if="bStep === 0">
                    <h2 class="booking-title">
                      選擇用餐日期
                    </h2>
                    <div class="booking-cal">
                      <div class="booking-cal__header">
                        <button
                            :disabled="!bCanPrevMonth"
                            class="booking-cal__nav"
                            :class="!bCanPrevMonth && 'booking-cal__nav--disabled'"
                            @click="bPrevMonth"
                        >
                          <svg
                              class="booking-cal__nav-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                          ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 19l-7-7 7-7"
                          /></svg>
                        </button>
                        <span class="booking-cal__month">{{ bCalYear }} 年 {{ bCalMonth }} 月</span>
                        <button
                            class="booking-cal__nav"
                            @click="bNextMonth"
                        >
                          <svg
                              class="booking-cal__nav-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                          ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 5l7 7-7 7"
                          /></svg>
                        </button>
                      </div>
                      <div class="booking-cal__weekdays">
                        <div
                            v-for="w in ['日', '一', '二', '三', '四', '五', '六']"
                            :key="w"
                        >
                          {{ w }}
                        </div>
                      </div>
                      <div class="booking-cal__grid">
                        <div
                            v-for="(day, idx) in bCalDays"
                            :key="idx"
                            class="booking-cal__day"
                            :class="bDayClass(day)"
                            :title="day.note"
                            @click="day.date && !day.disabled && bSelectDate(day.date)"
                        >
                          {{ day.label }}
                        </div>
                      </div>
                    </div>
                    <p class="booking-cal-legend">
                      <span class="booking-cal-legend__swatch booking-cal-legend__swatch--closed"/> 公休 / 未開放
                    </p>
                    <div
                        v-if="bForm.date"
                        class="booking-selected"
                    >
                      <span>已選擇：{{ bForm.date }}</span>
                      <span
                          v-if="bDateGuestsLoading"
                          class="booking-selected__badge"
                      >查詢中…</span>
                      <span
                          v-else
                          class="booking-selected__badge"
                      >已訂 {{ bDateGuests }} 人</span>
                    </div>
                    <p
                        v-if="bErrors.date"
                        class="booking-error"
                    >
                      {{ bErrors.date }}
                    </p>
                  </div>

                  <!-- Step 1：填寫資料 + 葷素數量 -->
                  <div
                      v-if="bStep === 1"
                      class="booking-form"
                  >
                    <h2 class="booking-title">
                      填寫資料
                    </h2>
                    <div class="booking-field">
                      <label class="booking-label">姓名 <span class="booking-required">*</span></label>
                      <input
                          v-model="bForm.name"
                          placeholder="請輸入姓名"
                          class="booking-input"
                          :class="bErrors.name && 'booking-input--error'"
                      >
                      <p
                          v-if="bErrors.name"
                          class="booking-error"
                      >
                        {{ bErrors.name }}
                      </p>
                    </div>
                    <div class="booking-field">
                      <label class="booking-label">聯絡電話 <span class="booking-required">*</span></label>
                      <input
                          v-model="bForm.phone"
                          type="tel"
                          placeholder="09xx-xxx-xxx 或 02-xxxxxxxx"
                          class="booking-input"
                          :class="bErrors.phone && 'booking-input--error'"
                      >
                      <p
                          v-if="bErrors.phone"
                          class="booking-error"
                      >
                        {{ bErrors.phone }}
                      </p>
                    </div>
                    <div class="booking-field">
                      <label class="booking-label">用餐時間</label>
                      <select
                          v-model="bForm.time"
                          class="booking-input"
                      >
                        <option
                            v-for="t in bAvailableTimeSlots"
                            :key="t"
                            :value="t"
                        >
                          {{ t }}
                        </option>
                      </select>
                      <p
                          v-if="bErrors.time"
                          class="booking-error"
                      >
                        {{ bErrors.time }}
                      </p>
                    </div>
                    <div class="booking-field">
                      <label class="booking-label">備註</label>
                      <textarea
                          v-model="bForm.note"
                          rows="2"
                          placeholder="過敏食材、特殊需求…"
                          class="booking-input booking-textarea"
                      />
                    </div>

                    <div class="booking-divider">
                      葷素數量 <span class="booking-required">*</span>
                    </div>
                    <div
                        v-for="opt in bDietOptions"
                        :key="opt.key"
                        class="booking-diet-row"
                    >
                      <div class="booking-diet-row__info">
                        <span class="booking-diet-row__icon">{{ opt.icon }}</span>
                        <div>
                          <div class="booking-diet-row__label">
                            {{ opt.label }}
                          </div>
                          <div class="booking-diet-row__desc">
                            {{ opt.desc }}
                          </div>
                        </div>
                      </div>
                      <div class="booking-counter">
                        <button
                            class="booking-counter__btn"
                            @click="bForm[opt.key] = Math.max(0, bForm[opt.key] - 1)"
                        >
                          −
                        </button>
                        <input
                            v-model.number="bForm[opt.key]"
                            type="number"
                            min="0"
                            class="booking-counter__input"
                        >
                        <button
                            class="booking-counter__btn"
                            @click="bForm[opt.key]++"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                    <div
                        v-if="bTotalGuests > 0"
                        class="booking-qty-summary"
                    >
                      合計 <strong>{{ bTotalGuests }}</strong> 人
                    </div>
                    <p
                        v-if="bErrors.diet"
                        class="booking-error"
                    >
                      {{ bErrors.diet }}
                    </p>
                  </div>

                  <!-- Step 2：確認送出 -->
                  <div v-if="bStep === 2">
                    <h2 class="booking-title">
                      確認預約內容
                    </h2>
                    <div class="booking-summary">
                      <div
                          v-for="row in bSummary"
                          :key="row.label"
                          class="booking-summary__row"
                      >
                        <span class="booking-summary__label">{{ row.label }}</span>
                        <span class="booking-summary__value">{{ row.value }}</span>
                      </div>
                    </div>
                    <p
                        v-if="bSubmitError"
                        class="booking-submit-error"
                    >
                      {{ bSubmitError }}
                    </p>
                  </div>

                  <!-- 導覽按鈕 -->
                  <div class="booking-nav">
                    <button
                        v-if="bStep > 0"
                        class="booking-btn booking-btn--back"
                        @click="bStep--"
                    >
                      <svg
                          class="booking-btn__icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 19l-7-7 7-7"
                      /></svg>
                      上一步
                    </button>
                    <div v-else />
                    <button
                        v-if="bStep < bSteps.length - 1"
                        :disabled="bStep === 0 && !bDateStepValid"
                        class="booking-btn booking-btn--next"
                        @click="bNextStep"
                    >
                      下一步
                      <svg
                          class="booking-btn__icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                      /></svg>
                    </button>
                    <button
                        v-else
                        :disabled="bSubmitting"
                        class="booking-btn booking-btn--submit"
                        @click="bSubmit"
                    >
                      <div
                          v-if="bSubmitting"
                          class="booking-btn__spinner"
                      />
                      {{ bSubmitting ? '送出中…' : '確認預約' }}
                    </button>
                  </div>
                </template>

                <!-- 注意事項 -->
                <div class="booking-notice booking-notice--teal">
                  <p class="booking-notice__title">
                    📋 預約注意事項
                  </p>
                  <p v-for="(line, idx) in bNoticeLines" :key="idx">
                    · {{ line }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center2" />
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
      <div class="bar-waterDrop mt-5 mx-lg-5" />
    </div>

    <!-- 訂位成功 Modal -->
    <Teleport to="body">
      <Transition name="bmodal">
        <div
            v-if="bShowSuccessModal"
            class="bmodal-backdrop"
            @click.self="bConfirmSuccess"
        >
          <div class="bmodal">
            <div class="bmodal__icon">
              <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 class="bmodal__title">
              訂位已送出！
            </h3>
            <p class="bmodal__msg">
              我們將盡快電話確認，謝謝。<br>您可至訂位紀錄查看預約狀態。
            </p>
            <button
                class="bmodal__btn"
                @click="bConfirmSuccess"
            >
              前往訂位紀錄
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── 登入門檻 ── */
.booking-auth-loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}
.booking-auth-gate {
  text-align: center;
  padding: 40px 20px 32px;
}
.booking-auth-gate__icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.booking-auth-gate__title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}
.booking-auth-gate__hint {
  font-size: 13px;
  color: #777;
  line-height: 1.7;
  margin: 0 0 22px;
}
.booking-auth-gate__google {
  display: flex;
  justify-content: center;
}

/* ── 步驟列 ── */
.booking-steps {
  display: flex;
  border-bottom: 1px solid #e5e0d8;
  margin-bottom: 24px;
}
.booking-step {
  flex: 1;
  padding: 10px 2px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  position: relative;
}
.booking-step--active  { color: #3a9a8a; background-color: #eef7f5; }
.booking-step--done    { color: #3a9a8a; }
.booking-step--pending { color: #ccc; }
.booking-step__inner   { display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; }
.booking-step__check   { width: 16px; height: 16px; color: #3a9a8a; }
.booking-step__num {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 1.5px solid #ccc;
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  color: #ccc;
}
.booking-step__num--active { background-color: #3a9a8a; border-color: #3a9a8a; color: #fff; }
.booking-step__bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 2px; background-color: #5bbfbf;
}

/* ── 共用 ── */
.booking-title  { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 16px; }
.booking-form   { display: flex; flex-direction: column; gap: 16px; }
.booking-field  { display: flex; flex-direction: column; gap: 4px; }
.booking-label  { font-size: 13px; font-weight: 600; color: #555; }
.booking-required { color: #e74c3c; }
.booking-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-size: 13px;
  color: #333;
  outline: none;
  background: #fff;
  transition: border-color 0.15s;
}
.booking-input:focus      { border-color: #5bbfbf; }
.booking-input--error     { border-color: #e74c3c; background-color: #fff5f5; }
.booking-textarea         { resize: none; }
.booking-error            { font-size: 12px; color: #e74c3c; margin: 2px 0 0; }
.booking-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ── 月曆 ── */
.booking-cal { background: #f8f7f4; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
.booking-cal__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.booking-cal__month { font-size: 13px; font-weight: 700; color: #333; }
.booking-cal__nav {
  padding: 6px; border-radius: 10px;
  background: none; border: none; cursor: pointer;
  color: #666; transition: background 0.15s;
}
.booking-cal__nav:hover:not(:disabled) { background: #e0e0e0; }
.booking-cal__nav--disabled { color: #ccc; cursor: not-allowed; }
.booking-cal__nav-icon { width: 16px; height: 16px; display: block; }
.booking-cal__weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.booking-cal__weekdays > div { text-align: center; font-size: 11px; color: #aaa; padding: 4px 0; }
.booking-cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.booking-cal__day {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  user-select: none;
  transition: all 0.12s;
}

/* ── 日曆圖例 ── */
.booking-cal-legend { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #999; margin: 0 0 6px 2px; }
.booking-cal-legend__swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.booking-cal-legend__swatch--closed { background: repeating-linear-gradient(135deg, transparent, transparent 2px, #ccb9b9 2px, #ccb9b9 4px); border: 1px solid #d1cdc8; }

/* ── 已選日期提示 ── */
.booking-selected {
  background-color: #eef7f5;
  color: #3a9a8a;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.booking-selected__badge {
  font-size: 11px;
  background: #fff;
  color: #3a9a8a;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}

/* ── 計數器 ── */
.booking-counter { display: flex; align-items: center; gap: 6px; }
.booking-counter__btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s;
}
.booking-counter__btn:hover { background: #f5f5f5; }
.booking-counter__input {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 13px; font-weight: 700;
  color: #333; outline: none;
}

/* ── 區塊分隔標題 ── */
.booking-divider {
  font-size: 13px;
  font-weight: 700;
  color: #555;
  padding: 8px 0 4px;
  border-top: 1px solid #eee;
  margin-top: 4px;
}

/* ── 葷素計數列 ── */
.booking-diet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px 16px;
  gap: 12px;
}
.booking-diet-row__info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.booking-diet-row__icon  { font-size: 22px; flex-shrink: 0; }
.booking-diet-row__label { font-size: 13px; font-weight: 600; color: #333; }
.booking-diet-row__desc  { font-size: 11px; color: #aaa; margin-top: 2px; }

/* ── 手機版計數列調整 ── */
@media (max-width: 480px) {
  .booking-diet-row { padding: 12px 14px; gap: 8px; }
  .booking-diet-row__info { gap: 10px; }
  .booking-diet-row__icon { font-size: 20px; }
  .booking-diet-row__label { white-space: nowrap; }
  .booking-counter { gap: 4px; flex-shrink: 0; }
  .booking-counter__btn { width: 32px; height: 32px; border-radius: 8px; }
  .booking-counter__input { flex: none; width: 48px; padding: 6px 2px; border-radius: 8px; }
}

/* ── 數量小計 ── */
.booking-qty-summary {
  background: #eef7f5;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #3a9a8a;
  text-align: right;
}

/* ── 確認摘要 ── */
.booking-summary {
  border: 1px solid #eee;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}
.booking-summary__row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}
.booking-summary__row:last-child { border-bottom: none; }
.booking-summary__label { color: #aaa; }
.booking-summary__value { font-weight: 600; color: #333; }
.booking-submit-error {
  font-size: 13px; color: #e74c3c;
  background: #fff5f5;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

/* ── 導覽按鈕 ── */
.booking-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.booking-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  border: none;
}
.booking-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.booking-btn__icon { width: 16px; height: 16px; }
.booking-btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.booking-btn--back   { background: #fff; border: 1px solid #ddd; color: #666; margin-right: auto; }
.booking-btn--back:hover { background: #f5f5f5; }
.booking-btn--next   { background-color: #5bbfbf; color: #fff; margin-left: auto; }
.booking-btn--next:hover { opacity: 0.88; }
.booking-btn--submit { background-color: #5bbfbf; color: #fff; margin-left: auto; }
.booking-btn--submit:hover:not(:disabled) { opacity: 0.88; }

/* ── 注意事項 ── */
.booking-notice {
  margin-top: 16px;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.8;
}
.booking-notice--teal { background-color: #eef7f5; color: #3a9a8a; }
.booking-notice__title { font-weight: 600; margin-bottom: 4px; }

/* ── 日期狀態 ── */
.booking-cal__day--empty    { cursor: default; }
.booking-cal__day--disabled { color: #d1cdc8; cursor: not-allowed; background: none; }
.booking-cal__day--closed   { color: #ccb9b9; cursor: not-allowed; background: repeating-linear-gradient(135deg, transparent, transparent 4px, #f3e9e9 4px, #f3e9e9 8px); text-decoration: line-through; }
.booking-cal__day--selected { background-color: #3a9a8a; color: #fff; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(58,154,138,0.35); }
.booking-cal__day--available { color: #444; cursor: pointer; }
.booking-cal__day--available:hover { background-color: #d0eeea; color: #2a7a6a; }

/* ── number input arrow 隱藏 ── */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }

/* ── 成功 Modal ── */
.bmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.bmodal {
  background: #fff;
  border-radius: 20px;
  padding: 36px 28px 28px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.bmodal__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #eef7f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.bmodal__icon svg {
  width: 28px;
  height: 28px;
  color: #3a9a8a;
  stroke: #3a9a8a;
}
.bmodal__title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}
.bmodal__msg {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 24px;
}
.bmodal__btn {
  display: block;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #5bbfbf;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  text-align: center;
}
.bmodal__btn:hover { opacity: 0.88; }

/* ── Modal 動畫 ── */
.bmodal-enter-active,
.bmodal-leave-active { transition: opacity 0.2s ease; }
.bmodal-enter-active .bmodal,
.bmodal-leave-active .bmodal { transition: transform 0.2s ease, opacity 0.2s ease; }
.bmodal-enter-from,
.bmodal-leave-to { opacity: 0; }
.bmodal-enter-from .bmodal,
.bmodal-leave-to .bmodal { transform: scale(0.92) translateY(12px); opacity: 0; }
</style>