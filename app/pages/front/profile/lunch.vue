<script setup>
import {ref, reactive, computed, watch} from 'vue'
import {useCommonStore} from '~/stores/common.js'
import {useCustomerStore} from '~/stores/customer.js'

definePageMeta({ layout: 'front' })

useSiteHead()

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const LUNCH_BASE = computed(() => commonStore.data.main_url + '/holy/lunch')
const CUSTOMER_BASE = computed(() => commonStore.data.main_url + '/holy/customer')

const router = useRouter()

// ── 成功 Modal ────────────────────────────────────────────────────
const lShowSuccessModal = ref(false)
const lConfirmSuccess = () => {
  lShowSuccessModal.value = false
  router.push('/front/profile/log')
}

// ── Google 登入帶入資料 ───────────────────────────────────────────
watch(() => customerStore.customer, (c) => {
  if (c?.name && !lForm.name) lForm.name = c.name
  if (c?.id && !lForm.phone) {
    fetch(`${CUSTOMER_BASE.value}/profile?customerId=${c.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.mobile && !lForm.phone) lForm.phone = data.mobile
        else if (data.landline && !lForm.phone) lForm.phone = data.landline
      })
      .catch(() => {
      })
  }
})

// ── 日期工具 ─────────────────────────────────────────────────────
const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── 月曆基礎（需在 lForm 之前宣告）────────────────────────────────
const lCal = new Date();
lCal.setHours(0, 0, 0, 0)
const lTodayStr = toDateStr(lCal)
const lCalYear = ref(lCal.getFullYear())
const lCalMonth = ref(lCal.getMonth() + 1)

// ── 電話驗證 ─────────────────────────────────────────────────────
const validateMobile = (c) => /^09\d{8}$/.test(c)
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
const lStep = ref(0)
const lSteps = ['選擇日期', '填寫資料', '確認送出']
const lForm = reactive({
  name: '', phone: '', date: lTodayStr, time: '12:00',
  meatQty: 0, fullVegQty: 0, eggVegQty: 0, spiceVegQty: 0, note: ''
})
const lErrors = reactive({})
const lSubmitting = ref(false)
const lSubmitError = ref('')
const lTimeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00']
const lDietOptions = [
  {key: 'meatQty', icon: '🍖', label: '葷食便當', desc: '含肉類料理'},
  {key: 'fullVegQty', icon: '🌿', label: '全素便當', desc: '不含蛋奶五辛'},
  {key: 'eggVegQty', icon: '🥚', label: '蛋奶素便當', desc: '可食蛋奶製品'},
  {key: 'spiceVegQty', icon: '🧄', label: '五辛素便當', desc: '可食蔥薑蒜'},
]
const lTotalQty = computed(() =>
  lForm.meatQty + lForm.fullVegQty + lForm.eggVegQty + lForm.spiceVegQty
)

// ── 月曆（續）────────────────────────────────────────────────────
const lCanPrevMonth = computed(() =>
  lCalYear.value > lCal.getFullYear() ||
  (lCalYear.value === lCal.getFullYear() && lCalMonth.value > lCal.getMonth() + 1))
const lPrevMonth = () => {
  if (!lCanPrevMonth.value) return
  if (lCalMonth.value === 1) {
    lCalYear.value--;
    lCalMonth.value = 12
  } else lCalMonth.value--
}
const lNextMonth = () => {
  if (lCalMonth.value === 12) {
    lCalYear.value++;
    lCalMonth.value = 1
  } else lCalMonth.value++
}
const lCalDays = computed(() => {
  const firstDay = new Date(lCalYear.value, lCalMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(lCalYear.value, lCalMonth.value, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push({label: '', date: null, disabled: true})
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(lCalMonth.value).padStart(2, '0'), dd = String(d).padStart(2, '0')
    const str = `${lCalYear.value}-${mm}-${dd}`
    days.push({label: d, date: str, disabled: str < lTodayStr})
  }
  return days
})
const lDayClass = (day) => {
  if (!day.date) return 'lunch-cal__day--empty'
  if (day.disabled) return 'lunch-cal__day--disabled'
  if (day.date === lForm.date) return 'lunch-cal__day--selected'
  return 'lunch-cal__day--available'
}

const lSummary = computed(() => {
  const rows = [
    {label: '日期', value: lForm.date},
    {label: '取餐', value: lForm.time},
  ]
  const dietMap = {meatQty: '葷食', fullVegQty: '全素', eggVegQty: '蛋奶素', spiceVegQty: '五辛素'}
  for (const [key, label] of Object.entries(dietMap)) {
    if (lForm[key] > 0) rows.push({label, value: `${lForm[key]} 盒`})
  }
  rows.push({label: '合計', value: `${lTotalQty.value} 盒`})
  if (lForm.note) rows.push({label: '備註', value: lForm.note})
  return rows
})

const lNextStep = () => {
  Object.keys(lErrors).forEach(k => delete lErrors[k])
  if (lStep.value === 0 && !lForm.date) {
    lErrors.date = '請選擇取餐日期';
    return
  }
  if (lStep.value === 1) {
    if (!lForm.name.trim()) lErrors.name = '請輸入姓名'
    if (!lForm.phone.trim()) lErrors.phone = '請輸入聯絡電話'
    else if (!validateTWPhone(lForm.phone)) lErrors.phone = '請輸入正確的手機（09xxxxxxxx）或市話（如 02-12345678、07-1234567）'
    if (lForm.meatQty === 0 && lForm.fullVegQty === 0 && lForm.eggVegQty === 0 && lForm.spiceVegQty === 0) lErrors.qty = '請至少預訂一盒便當'
    if (Object.keys(lErrors).length > 0) return
  }
  lStep.value++
}

const lSubmit = async () => {
  lSubmitError.value = '';
  lSubmitting.value = true
  try {
    const res = await fetch(`${LUNCH_BASE.value}/save`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({...lForm, status: '待確認', customerId: customerStore.customer?.id ?? ''}),
    })
    if (!res.ok) throw new Error()
    Object.assign(lForm, {
      name: '', phone: '', date: '', time: '12:00',
      meatQty: 0, fullVegQty: 0, eggVegQty: 0, spiceVegQty: 0, note: ''
    })
    lStep.value = 0
    lShowSuccessModal.value = true
  } catch {
    lSubmitError.value = '預訂送出失敗，請稍後再試或直接來電。'
  } finally {
    lSubmitting.value = false
  }
}

onMounted(() => {
  // 已登入時預先帶入名稱
  const c = customerStore.customer
  if (c?.name && !lForm.name) lForm.name = c.name

  // 若有設定電話，自動帶入
  if (c?.id) {
    fetch(`${CUSTOMER_BASE.value}/profile?customerId=${c.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.mobile && !lForm.phone) lForm.phone = data.mobile
        else if (data.landline && !lForm.phone) lForm.phone = data.landline
      })
      .catch(() => {
      })
  }

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
        >
        <NuxtLink to="/front/restaurant">田園餐廳</NuxtLink>
        > 便當預訂
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-8 col-lg-7 rounded bg-lightGreen py-4 px-3 px-sm-4">

                <!-- 步驟列 -->
                <div class="lunch-steps">
                  <div
                    v-for="(step, idx) in lSteps" :key="step"
                    class="lunch-step"
                    :class="lStep === idx ? 'lunch-step--active' : lStep > idx ? 'lunch-step--done' : 'lunch-step--pending'"
                  >
                    <span class="lunch-step__inner">
                      <svg v-if="lStep > idx" class="lunch-step__check" fill="none" stroke="currentColor"
                           viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span v-else class="lunch-step__num" :class="lStep === idx ? 'lunch-step__num--active' : ''">
                        {{ idx + 1 }}
                      </span>
                      {{ step }}
                    </span>
                    <div v-if="lStep === idx" class="lunch-step__bar"/>
                  </div>
                </div>

                <!-- Step 0：選擇日期 -->
                <div v-if="lStep === 0">
                  <h2 class="lunch-title">選擇取餐日期</h2>
                  <div class="lunch-cal">
                    <div class="lunch-cal__header">
                      <button @click="lPrevMonth" :disabled="!lCanPrevMonth" class="lunch-cal__nav"
                              :class="!lCanPrevMonth && 'lunch-cal__nav--disabled'">
                        <svg class="lunch-cal__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                      </button>
                      <span class="lunch-cal__month">{{ lCalYear }} 年 {{ lCalMonth }} 月</span>
                      <button @click="lNextMonth" class="lunch-cal__nav">
                        <svg class="lunch-cal__nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                    <div class="lunch-cal__weekdays">
                      <div v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</div>
                    </div>
                    <div class="lunch-cal__grid">
                      <div
                        v-for="(day, idx) in lCalDays" :key="idx"
                        class="lunch-cal__day"
                        :class="lDayClass(day)"
                        @click="day.date && !day.disabled && (lForm.date = day.date)"
                      >{{ day.label }}
                      </div>
                    </div>
                  </div>
                  <div v-if="lForm.date" class="lunch-selected">
                    已選擇：{{ lForm.date }}
                  </div>
                  <p v-if="lErrors.date" class="lunch-error">{{ lErrors.date }}</p>
                </div>

                <!-- Step 1：填寫資料 -->
                <div v-if="lStep === 1" class="lunch-form">
                  <h2 class="lunch-title">填寫資料</h2>
                  <div class="lunch-field">
                    <label class="lunch-label">姓名 <span class="lunch-required">*</span></label>
                    <input v-model="lForm.name" placeholder="請輸入姓名" class="lunch-input"
                           :class="lErrors.name && 'lunch-input--error'"/>
                    <p v-if="lErrors.name" class="lunch-error">{{ lErrors.name }}</p>
                  </div>
                  <div class="lunch-field">
                    <label class="lunch-label">聯絡電話 <span class="lunch-required">*</span></label>
                    <input v-model="lForm.phone" type="tel" placeholder="09xx-xxx-xxx 或 02-xxxxxxxx"
                           class="lunch-input" :class="lErrors.phone && 'lunch-input--error'"/>
                    <p v-if="lErrors.phone" class="lunch-error">{{ lErrors.phone }}</p>
                  </div>
                  <div class="lunch-field">
                    <label class="lunch-label">取餐時間</label>
                    <select v-model="lForm.time" class="lunch-input">
                      <option v-for="t in lTimeSlots" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                  <div v-for="opt in lDietOptions" :key="opt.key" class="lunch-diet-row">
                    <div class="lunch-diet-row__info">
                      <span class="lunch-diet-row__icon">{{ opt.icon }}</span>
                      <div>
                        <div class="lunch-diet-row__label">{{ opt.label }}</div>
                        <div class="lunch-diet-row__desc">{{ opt.desc }}</div>
                      </div>
                    </div>
                    <div class="lunch-counter">
                      <button @click="lForm[opt.key] = Math.max(0, lForm[opt.key] - 1)" class="lunch-counter__btn">−
                      </button>
                      <input v-model.number="lForm[opt.key]" type="number" min="0" class="lunch-counter__input"/>
                      <button @click="lForm[opt.key]++" class="lunch-counter__btn">＋</button>
                    </div>
                  </div>
                  <p v-if="lErrors.qty" class="lunch-error">{{ lErrors.qty }}</p>
                  <div v-if="lTotalQty > 0" class="lunch-qty-summary">
                    共 <strong>{{ lTotalQty }}</strong> 盒
                  </div>
                  <div class="lunch-field">
                    <label class="lunch-label">備註</label>
                    <textarea v-model="lForm.note" rows="2" placeholder="特殊需求…" class="lunch-input lunch-textarea"/>
                  </div>
                </div>

                <!-- Step 2：確認送出 -->
                <div v-if="lStep === 2">
                  <h2 class="lunch-title">確認預訂內容</h2>
                  <div class="lunch-summary">
                    <div v-for="row in lSummary" :key="row.label" class="lunch-summary__row">
                      <span class="lunch-summary__label">{{ row.label }}</span>
                      <span class="lunch-summary__value">{{ row.value }}</span>
                    </div>
                  </div>
                  <p v-if="lSubmitError" class="lunch-submit-error">{{ lSubmitError }}</p>
                </div>

                <!-- 導覽按鈕 -->
                <div class="lunch-nav">
                  <button v-if="lStep > 0" @click="lStep--" class="lunch-btn lunch-btn--back">
                    <svg class="lunch-btn__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    上一步
                  </button>
                  <div v-else/>
                  <button v-if="lStep < lSteps.length - 1" @click="lNextStep" class="lunch-btn lunch-btn--next">
                    下一步
                    <svg class="lunch-btn__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <button v-else @click="lSubmit" :disabled="lSubmitting" class="lunch-btn lunch-btn--submit">
                    <div v-if="lSubmitting" class="lunch-btn__spinner"/>
                    {{ lSubmitting ? '送出中…' : '確認預訂' }}
                  </button>
                </div>

                <!-- 注意事項 -->
                <div class="lunch-notice">
                  <p class="lunch-notice__title">📋 便當預訂須知</p>
                  <p>· 請於前一日下午三點前完成預訂。</p>
                  <p>· 預訂送出後為「待確認」狀態，我們將盡快電話確認。</p>
                  <p>· 如需取消，請提前來電告知，謝謝。</p>
                </div>

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

    <!-- 預訂成功 Modal -->
    <Teleport to="body">
      <Transition name="lmodal">
        <div v-if="lShowSuccessModal" class="lmodal-backdrop" @click.self="lConfirmSuccess">
          <div class="lmodal">
            <div class="lmodal__icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="lmodal__title">便當預訂已送出！</h3>
            <p class="lmodal__msg">我們將盡快電話確認，謝謝。<br>您可至訂位紀錄查看預訂狀態。</p>
            <button class="lmodal__btn" @click="lConfirmSuccess">前往訂位紀錄</button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── 步驟列 ── */
.lunch-steps {
  display: flex;
  border-bottom: 1px solid #e5e0d8;
  margin-bottom: 24px;
}

.lunch-step {
  flex: 1;
  padding: 12px 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  position: relative;
}

.lunch-step--active {
  color: #b45309;
  background-color: #fffbeb;
}

.lunch-step--done {
  color: #b45309;
}

.lunch-step--pending {
  color: #ccc;
}

.lunch-step__inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lunch-step__check {
  width: 16px;
  height: 16px;
  color: #d97706;
}

.lunch-step__num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #ccc;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}

.lunch-step__num--active {
  background-color: #d97706;
  border-color: #d97706;
  color: #fff;
}

.lunch-step__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #f59e0b;
}

/* ── 共用 ── */
.lunch-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.lunch-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lunch-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lunch-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.lunch-required {
  color: #e74c3c;
}

.lunch-input {
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

.lunch-input:focus {
  border-color: #f59e0b;
}

.lunch-input--error {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.lunch-textarea {
  resize: none;
}

.lunch-error {
  font-size: 12px;
  color: #e74c3c;
  margin: 2px 0 0;
}

/* ── 月曆 ── */
.lunch-cal {
  background: #f8f7f4;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}

.lunch-cal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.lunch-cal__month {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.lunch-cal__nav {
  padding: 6px;
  border-radius: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: background 0.15s;
}

.lunch-cal__nav:hover:not(:disabled) {
  background: #e0e0e0;
}

.lunch-cal__nav--disabled {
  color: #ccc;
  cursor: not-allowed;
}

.lunch-cal__nav-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.lunch-cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.lunch-cal__weekdays > div {
  text-align: center;
  font-size: 11px;
  color: #aaa;
  padding: 4px 0;
}

.lunch-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.lunch-cal__day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  user-select: none;
  transition: all 0.12s;
}

/* ── 已選日期 ── */
.lunch-selected {
  background-color: #fffbeb;
  color: #b45309;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

/* ── 便當計數列 ── */
.lunch-diet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px 16px;
  gap: 12px;
}

.lunch-diet-row__info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.lunch-diet-row__icon {
  font-size: 22px;
  flex-shrink: 0;
}

.lunch-diet-row__label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.lunch-diet-row__desc {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

/* ── 手機版計數列調整 ── */
@media (max-width: 480px) {
  .lunch-diet-row {
    padding: 12px 14px;
    gap: 8px;
  }

  .lunch-diet-row__info {
    gap: 10px;
  }

  .lunch-diet-row__icon {
    font-size: 20px;
  }

  .lunch-diet-row__label {
    white-space: nowrap;
  }

  .lunch-counter {
    gap: 4px;
    flex-shrink: 0;
  }

  .lunch-counter__btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .lunch-counter__input {
    flex: none;
    width: 48px;
    padding: 6px 2px;
    border-radius: 8px;
  }
}

/* ── 計數器 ── */
.lunch-counter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lunch-counter__btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s;
}

.lunch-counter__btn:hover {
  background: #f5f5f5;
}

.lunch-counter__input {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 13px;
  font-weight: 700;
  color: #333;
  outline: none;
}

/* ── 數量小計 ── */
.lunch-qty-summary {
  background: #fffbeb;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #555;
}

/* ── 確認摘要 ── */
.lunch-summary {
  border: 1px solid #eee;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}

.lunch-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}

.lunch-summary__row:last-child {
  border-bottom: none;
}

.lunch-summary__label {
  color: #aaa;
}

.lunch-summary__value {
  font-weight: 600;
  color: #333;
}

.lunch-submit-error {
  font-size: 13px;
  color: #e74c3c;
  background: #fff5f5;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

/* ── 導覽按鈕 ── */
.lunch-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.lunch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  border: none;
}

.lunch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lunch-btn__icon {
  width: 16px;
  height: 16px;
}

.lunch-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.lunch-btn--back {
  background: #fff;
  border: 1px solid #ddd;
  color: #666;
  margin-right: auto;
}

.lunch-btn--back:hover {
  background: #f5f5f5;
}

.lunch-btn--next {
  background-color: #d97706;
  color: #fff;
  margin-left: auto;
}

.lunch-btn--next:hover {
  opacity: 0.88;
}

.lunch-btn--submit {
  background-color: #d97706;
  color: #fff;
  margin-left: auto;
}

.lunch-btn--submit:hover:not(:disabled) {
  opacity: 0.88;
}

/* ── 注意事項 ── */
.lunch-notice {
  margin-top: 16px;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.8;
  background-color: #fffbeb;
  color: #b45309;
}

.lunch-notice__title {
  font-weight: 600;
  margin-bottom: 4px;
}

/* ── 日期狀態 ── */
.lunch-cal__day--empty {
  cursor: default;
}

.lunch-cal__day--disabled {
  color: #d1cdc8;
  cursor: not-allowed;
  background: none;
}

.lunch-cal__day--selected {
  background-color: #d97706;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.35);
}

.lunch-cal__day--available {
  color: #444;
  cursor: pointer;
}

.lunch-cal__day--available:hover {
  background-color: #fde9c0;
  color: #92400e;
}

/* ── number input arrow 隱藏 ── */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}

/* ── 預訂成功 Modal ── */
.lmodal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.lmodal {
  background: #fff;
  border-radius: 20px;
  padding: 36px 28px 28px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.lmodal__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fffbeb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.lmodal__icon svg {
  width: 28px;
  height: 28px;
  stroke: #d97706;
}

.lmodal__title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
}

.lmodal__msg {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 24px;
}

.lmodal__btn {
  display: block;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #d97706;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  text-align: center;
}

.lmodal__btn:hover {
  opacity: 0.88;
}

/* ── Modal 動畫 ── */
.lmodal-enter-active,
.lmodal-leave-active {
  transition: opacity 0.2s ease;
}

.lmodal-enter-active .lmodal,
.lmodal-leave-active .lmodal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.lmodal-enter-from,
.lmodal-leave-to {
  opacity: 0;
}

.lmodal-enter-from .lmodal,
.lmodal-leave-to .lmodal {
  transform: scale(0.92) translateY(12px);
  opacity: 0;
}
</style>
