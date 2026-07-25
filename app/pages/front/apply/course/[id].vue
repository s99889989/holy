<script setup>
// 專案holy 位置front/apply/course/[id].vue
definePageMeta({ layout: false })

import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { useCourseRegistrationStore } from '~/stores/courseRegistration.js'
import { useCustomerStore } from '~/stores/customer.js'

const route = useRoute()
const courseId = route.params.id

const store = useCourseRegistrationStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()

const BASE = computed(() => commonStore.data.main_url + '/holy/customer')
const GOOGLE_CLIENT_ID = computed(() => commonStore.data.google_client_id)
const customer = computed(() => customerStore.customer)

const imgUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return commonStore.data.main_url + path
}

const course = computed(() => store.publicCourse)
// 該課程是否要求登入才能填寫報名表單（後端預設 true，沿用原本行為；
// 後台可個別關閉，關閉後未登入也能看到並送出報名表單）
const requireLogin = computed(() => course.value?.requireLogin !== false)
// 是否要擋住表單、顯示「請先登入」卡片：只有「這堂課要求登入」且「目前未登入」才擋
const showLoginGate = computed(() => requireLogin.value && !customer.value)
const answerFields = computed(() => (course.value?.fields ?? []).filter(f => f.type !== 'display_image'))
const isFieldVisible = (f) => {
  if (!f.dependsOn) return true
  const v = answers[f.dependsOn]
  if (Array.isArray(v)) return v.includes(f.dependsOnValue)
  return v === f.dependsOnValue
}
// 條件顯示的欄位（例如「單次上課日選擇」要選了「單次」才出現）在這裡統一過濾，
// 表單渲染跟必填檢查都用這份，條件不成立就不會被要求填答
const visibleAnswerFields = computed(() => answerFields.value.filter(isFieldVisible))
const isDeadlinePassed = computed(() => {
  if (!course.value?.registrationDeadline) return false
  return new Date(course.value.registrationDeadline.replace(' ', 'T')) < new Date()
})

// 注意：useSiteHead() 這個 composable 是直接 destructure 參數物件（不是 Nuxt
// useHead 那種「整包傳函式」的寫法），所以不能整包包成 () => ({...})，那樣
// 只會拿到函式本身的屬性（全部 undefined），最後套用到的都是預設值。
// 個別欄位改傳 computed，unhead 本身支援欄位層級的 ref/computed 響應性，
// 課程資料非同步載入完成後標題／OG 內容還是會自動更新。
useSiteHead({
  title: computed(() => course.value?.name ? `${course.value.name} 報名 | 台東聖母健康農莊` : '課程報名 | 台東聖母健康農莊'),
  description: computed(() => course.value?.description || '聖母健康農莊課程報名'),
  ogTitle: computed(() => course.value?.name ? `${course.value.name} 報名` : '課程報名'),
  ogDescription: computed(() => course.value?.description || '聖母健康農莊課程報名'),
  // 這個專案的 proxy 是 '/holy/**'（不是測試專案那邊的 '/api/holy/**'），
  // 而且 og:image 一定要是絕對網址，爬蟲才抓得到，所以這裡直接寫死網域，
  // 不要用 commonStore.data.main_url 組（那邊是空字串，組出來會變成相對路徑）。
  ogImage: `https://holyfarm.netlify.app/holy/course-reg/og/${courseId}`,
  ogUrl: `https://holyfarm.netlify.app/front/apply/course/${courseId}`,
})

// ── 登入面板 ──────────────────────────────────────────────────
const loginPanelOpen = ref(false)
const loginAreaRef = ref(null)

const initGoogle = () => {
  if (!window.google) return
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID.value,
    callback: handleCredential,
    // auto_select: 如果這台裝置/瀏覽器只有一個 Google 帳號、且之前已經對這個網站按過
    // 「繼續使用」，就會直接免點擊自動登入；否則會跳出 One Tap 小卡片讓使用者點一下，
    // 不用整頁跳轉到 Google 登入頁。第一次一定還是要使用者確認一次，不可能完全無感。
    auto_select: true,
    // Chrome 正在把 One Tap 底層换成瀏覽器原生的 FedCM API（第三方 cookie 淘汰後的替代
    // 方案），及早加這個 flag 避免之後被強制切換時行為跑掉／console 噴警告。
    use_fedcm_for_prompt: true,
  })
}
// 嘗試觸發 One Tap／自動登入：已經登入的人不用再打擾；LINE／FB 等 App 內建瀏覽器
// Google 官方直接擋掉登入（會顯示「這個瀏覽器不安全」），One Tap 在那種環境下本來就
// 不會顯示，呼叫了也只是安靜地什麼都不做，所以這裡乾脆不呼叫，改用下面的提示 banner。
const attemptOneTap = () => {
  if (!window.google || customer.value || isInAppBrowser.value) return
  window.google.accounts.id.prompt()
}
// 偵測是不是從 LINE / FB / Instagram / 微信 這類 App 內建瀏覽器打開（報名連結常常是
// 從 LINE 分享出去的，見 CourseShareController 的分享頁）。這類瀏覽器 Google 會直接
// 拒絕登入，自動登入／一般登入按鈕都沒用，只能請使用者換成手機預設瀏覽器打開。
const isInAppBrowser = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent)
})
const renderGoogleBtn = (elId) => {
  if (!window.google) return
  const el = document.getElementById(elId)
  if (!el) return
  window.google.accounts.id.renderButton(el, {
    theme: 'outline', size: 'large', text: 'signin_with', locale: 'zh-TW', width: 240,
  })
}
const loginError = ref('')
const handleCredential = async (response) => {
  loginError.value = ''
  try {
    const res = await fetch(`${BASE.value}/google-login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    })
    const data = await res.json()
    if (data.error) { loginError.value = data.error; return }
    customerStore.setCustomer(data)
    loginPanelOpen.value = false
    await fetchCourseData()
  } catch {
    loginError.value = '登入失敗，請確認網路後再試'
  }
}
const logout = async () => {
  try {
    await fetch(`${BASE.value}/logout`, { method: 'POST', credentials: 'include' })
  } catch { /* ignore */ }
  customerStore.clearCustomer()
}
const toggleLoginPanel = () => {
  loginPanelOpen.value = !loginPanelOpen.value
  if (loginPanelOpen.value && !customer.value) {
    nextTick(() => renderGoogleBtn('cr-google-btn-panel'))
  }
}

// ── 資料載入 ──────────────────────────────────────────────────
const loading = ref(true)
const answers = reactive({})
const editing = ref(false)

// ── 繳費（人工核對版）────────────────────────────────────────
const selectedPriceOptionId = ref('')
const paymentNoteInput = ref('')

const resetAnswers = () => {
  answerFields.value.forEach(f => {
    const existing = course.value?.myRegistration?.answers?.[f.id]
    answers[f.id] = existing ?? (f.type === 'checkbox' ? [] : '')
    if (f.allowNote) {
      answers[f.id + '__note'] = course.value?.myRegistration?.answers?.[f.id + '__note'] ?? ''
    }
  })
  selectedPriceOptionId.value = course.value?.myRegistration?.priceOptionId ?? ''
  paymentNoteInput.value = course.value?.myRegistration?.paymentNote ?? ''
}

const fetchCourseData = async () => {
  await store.fetchPublicCourse(courseId)
  resetAnswers()
}

const fetchMe = async () => {
  try {
    const res = await fetch(`${BASE.value}/me`, { credentials: 'include' })
    const data = await res.json()
    if (!data.error) customerStore.setCustomer(data)
  } catch { /* 未登入，靜默留在頁面 */ }
}

onMounted(async () => {
  loading.value = true
  await fetchMe()
  await fetchCourseData()
  loading.value = false

  if (!document.getElementById('google-gsi-script')) {
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      initGoogle()
      nextTick(() => renderGoogleBtn('cr-google-btn-main'))
      attemptOneTap()
    }
    document.head.appendChild(script)
  } else if (window.google) {
    initGoogle()
    nextTick(() => renderGoogleBtn('cr-google-btn-main'))
    attemptOneTap()
  }
})

// ── 送出報名 ──────────────────────────────────────────────────
const submitting = ref(false)
const cancelling = ref(false)
const errorMsg = ref('')
const successModal = ref(false)

const validate = () => {
  if (course.value?.paymentEnabled && !selectedPriceOptionId.value) {
    return '請選擇報名價格'
  }
  for (const f of visibleAnswerFields.value) {
    if (!f.required) continue
    const v = answers[f.id]
    const empty = v === undefined || v === null || v === ''
        || (Array.isArray(v) && v.length === 0)
    if (empty) return `「${f.label}」為必填`
  }
  return ''
}

const submit = async () => {
  const err = validate()
  if (err) { errorMsg.value = err; return }
  errorMsg.value = ''
  submitting.value = true
  try {
    const payment = course.value?.paymentEnabled
        ? { priceOptionId: selectedPriceOptionId.value, paymentNote: paymentNoteInput.value }
        : null
    const res = await store.submitRegistration(courseId, { ...answers }, payment)
    if (res.error) {
      errorMsg.value = res.error
    } else {
      editing.value = false
      await fetchCourseData()
      successModal.value = true
    }
  } catch {
    errorMsg.value = '報名失敗，請稍後再試'
  } finally {
    submitting.value = false
  }
}

const cancelRegistration = async () => {
  cancelling.value = true
  try {
    const res = await store.cancelMyRegistration(courseId)
    if (res.error) errorMsg.value = res.error
    else await fetchCourseData()
  } catch {
    errorMsg.value = '取消失敗，請稍後再試'
  } finally {
    cancelling.value = false
  }
}

const startEdit = () => { resetAnswers(); editing.value = true }

// ── 課程描述收合 ──────────────────────────────────────────────
const descExpanded = ref(false)
</script>

<template>
  <div class="cr-page">

    <!-- Header -->
    <div class="cr-header">
      <div class="cr-header__inner">
        <NuxtLink to="/" class="cr-header__logo">
          <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊" class="cr-header__logo-img">
        </NuxtLink>
        <div class="cr-header__text">
          <h1 class="cr-header__title">{{ course?.name || '課程報名' }}</h1>
          <p class="cr-header__sub">聖母健康農莊・課程報名</p>
        </div>

        <div class="cr-login-area" ref="loginAreaRef">
          <button v-if="!customer" class="cr-login-btn" @click="toggleLoginPanel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            登入
          </button>
          <button v-else class="cr-avatar-btn" @click="toggleLoginPanel">
            <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="cr-avatar-img">
            <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
          </button>

          <Transition name="cr-panel-fade">
            <div v-if="loginPanelOpen" class="cr-login-panel">
              <div v-if="!customer">
                <p class="cr-login-panel__hint">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  登入後才能報名課程
                </p>
                <div id="cr-google-btn-panel"></div>
                <p v-if="loginError" class="cr-login-panel__error">{{ loginError }}</p>
              </div>
              <div v-else>
                <div class="cr-login-panel__user">
                  <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="cr-login-panel__avatar">
                  <div>
                    <p class="cr-login-panel__name">{{ customer.name }}</p>
                    <p class="cr-login-panel__email">{{ customer.email }}</p>
                  </div>
                </div>
                <button class="cr-login-panel__logout" @click="logout(); loginPanelOpen = false">登出</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <div v-if="loginPanelOpen" class="cr-overlay" @click="loginPanelOpen = false"></div>

    <!-- Body -->
    <div class="cr-wrap">
      <div v-if="loading" class="cr-loading">載入中…</div>

      <template v-else-if="course">
        <div class="cr-layout">
          <div class="cr-layout__main">
            <img
                v-if="course.coverImage"
                :src="imgUrl(course.coverImage)"
                :alt="course.name"
                class="cr-cover"
            >

            <div v-if="course.description" class="cr-desc-wrap">
              <button type="button" class="cr-desc-toggle" @click="descExpanded = !descExpanded">
                {{ descExpanded ? '收合' : '展開全文' }}
                <svg
                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    class="cr-desc-toggle__icon" :class="{ 'cr-desc-toggle__icon--open': descExpanded }"
                ><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <p
                  class="cr-desc"
                  :class="{ 'cr-desc--collapsed': !descExpanded }"
              >{{ course.description }}</p>
            </div>

          </div><!-- /.cr-layout__main -->

          <div class="cr-layout__side">
            <div class="cr-badges">
          <span class="cr-badge cr-badge--main">
            已報名 {{ course.registeredCount }}{{ course.maxCapacity ? ` / ${course.maxCapacity}` : '' }} 人
          </span>
              <span v-if="course.registrationDeadline" class="cr-badge cr-badge--warn">
            截止：{{ course.registrationDeadline }}
          </span>
            </div>

            <!-- 未登入，且這堂課要求登入：整塊登入卡片擋住表單 -->
            <div v-if="showLoginGate" class="cr-card cr-card--login">
              <div class="cr-card__title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                請先登入才能報名
              </div>
              <p v-if="isInAppBrowser" class="cr-inapp-hint">
                偵測到您可能是從 LINE／FB 等 App 內的瀏覽器打開這個頁面，Google 登入在這類瀏覽器裡可能無法使用。
                請點右上角「⋯」選單，選擇「在瀏覽器中開啟」後再登入。
              </p>
              <p class="cr-card__hint">用 Google 帳號登入後即可填寫報名表單</p>
              <div id="cr-google-btn-main" class="cr-google-btn-main"></div>
              <p v-if="loginError" class="cr-login-panel__error">{{ loginError }}</p>
            </div>

            <!-- 已登入，或這堂課不需要登入就能報名 -->
            <template v-else>
              <!-- 已報名，非編輯模式 -->
              <div v-if="course.myRegistration && !editing" class="cr-card cr-card--success">
                <div class="cr-card__success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p class="cr-card__success-text">你已經報名這堂課程</p>
                <p class="cr-card__success-sub">報名時間：{{ course.myRegistration.submittedAt }}</p>
                <div v-if="course.paymentEnabled" class="cr-payment-status" :class="{ 'cr-payment-status--paid': course.myRegistration.paid }">
                  {{ course.myRegistration.priceLabel || '未選擇價格' }}
                  <template v-if="course.myRegistration.amount">（${{ course.myRegistration.amount }}）</template>
                  ・{{ course.myRegistration.paid ? '已確認收款' : '尚未確認收款' }}
                </div>
                <div class="cr-card__btns">
                  <button class="cr-btn cr-btn--outline" @click="startEdit">修改報名資料</button>
                  <button class="cr-btn cr-btn--danger" :disabled="cancelling" @click="cancelRegistration">
                    {{ cancelling ? '取消中…' : '取消報名' }}
                  </button>
                </div>
              </div>

              <!-- 額滿／已截止，且尚未報名 -->
              <div
                  v-else-if="(course.isFull || isDeadlinePassed) && !course.myRegistration"
                  class="cr-card cr-card--closed"
              >
                {{ isDeadlinePassed ? '報名時間已截止' : '報名人數已額滿' }}
              </div>

              <!-- 報名表單 -->
              <div v-else class="cr-card">
                <div class="cr-card__title">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                  報名資料
                  <span v-if="customer" class="cr-logged-badge">
                <img v-if="customer.picture" :src="customer.picture" class="cr-logged-badge__avatar">
                {{ customer.name }}
              </span>
                </div>

                <div v-if="course.paymentEnabled" class="cr-payment-box">
                  <label>選擇報名價格<span class="cr-required"> *</span></label>
                  <div class="cr-choice-group">
                    <label v-for="p in course.priceOptions" :key="p.id" class="cr-choice">
                      <input v-model="selectedPriceOptionId" type="radio" :value="p.id">
                      {{ p.label }}（${{ p.amount }}）
                    </label>
                  </div>
                  <p v-if="!course.priceOptions?.length" class="cr-payment-box__empty">
                    這堂課還沒有設定價格選項，請聯繫承辦人員。
                  </p>
                  <p v-if="course.paymentInfo" class="cr-payment-box__info">{{ course.paymentInfo }}</p>
                  <input
                      v-model="paymentNoteInput"
                      type="text"
                      placeholder="繳費備註（選填，例如匯款後五碼）"
                      class="cr-note-input"
                  >
                </div>

                <div v-for="f in visibleAnswerFields" :key="f.id" class="cr-field">
                  <label>{{ f.label }}<span v-if="f.required" class="cr-required"> *</span></label>

                  <input
                      v-if="f.type === 'text' || f.type === 'date'"
                      v-model="answers[f.id]"
                      :type="f.type === 'date' ? 'date' : 'text'"
                  >
                  <textarea v-else-if="f.type === 'textarea'" v-model="answers[f.id]" rows="3" />
                  <select v-else-if="f.type === 'select'" v-model="answers[f.id]">
                    <option value="">請選擇</option>
                    <option v-for="opt in f.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <div v-else-if="f.type === 'radio'" class="cr-choice-group">
                    <label v-for="opt in f.options" :key="opt" class="cr-choice">
                      <input v-model="answers[f.id]" type="radio" :value="opt"> {{ opt }}
                    </label>
                  </div>
                  <div v-else-if="f.type === 'checkbox'" class="cr-choice-group">
                    <label v-for="opt in f.options" :key="opt" class="cr-choice">
                      <input v-model="answers[f.id]" type="checkbox" :value="opt"> {{ opt }}
                    </label>
                  </div>

                  <input
                      v-if="f.allowNote"
                      v-model="answers[f.id + '__note']"
                      type="text"
                      placeholder="其他，請說明"
                      class="cr-note-input"
                  >
                </div>

                <Transition name="cr-err-fade">
                  <div v-if="errorMsg" class="cr-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="cr-error__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ errorMsg }}</span>
                    <button class="cr-error__close" @click="errorMsg = ''">✕</button>
                  </div>
                </Transition>

                <div class="cr-card__btns">
                  <button v-if="editing" class="cr-btn cr-btn--outline" @click="editing = false">取消編輯</button>
                  <button class="cr-submit" :disabled="submitting" @click="submit">
                    <span v-if="submitting" class="cr-spinner"></span>
                    {{ submitting ? '送出中…' : (editing ? '更新報名資料' : '確認報名') }}
                  </button>
                </div>
              </div>
            </template>
          </div><!-- /.cr-layout__side -->
        </div><!-- /.cr-layout -->
      </template>

      <div v-else class="cr-loading">找不到這個課程</div>
    </div>

    <!-- 成功 Modal -->
    <Teleport to="body">
      <Transition name="cr-modal-fade">
        <div v-if="successModal" class="cr-modal-backdrop" @click.self="successModal = false">
          <div class="cr-modal cr-modal--success">
            <div class="cr-modal__success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 class="cr-modal__title">報名成功！</h3>
            <p class="cr-modal__content">{{ course?.name }}</p>
            <div class="cr-modal__btns">
              <button class="confirm" @click="successModal = false">好的</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Page ── */
.cr-page {
  min-height: 100vh;
  background: #f4f7f2;
  font-family: 'Noto Sans TC', sans-serif;
}

/* ── Wrap（基本值放最前面，讓下面的 @media 桌機版規則能正確覆蓋） ── */
.cr-wrap { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

/* ── Header ── */
.cr-header {
  background: linear-gradient(135deg, #2d5a3d 0%, #1a3d28 100%);
  padding: 1.25rem 1.5rem;
  position: relative;
}
.cr-header__inner {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.cr-header__logo-img { height: 44px; filter: brightness(0) invert(1); opacity: 0.9; }
.cr-header__text { flex: 1; min-width: 0; }
.cr-header__title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0 0 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cr-header__sub { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin: 0; }

@media (max-width: 480px) {
  .cr-header { padding: 1rem 1.1rem; }
  .cr-header__inner { flex-wrap: wrap; row-gap: 0.6rem; }
  .cr-header__logo { order: 1; }
  .cr-header__logo-img { height: 30px; }
  .cr-login-area { order: 2; margin-left: auto; }
  .cr-header__text { order: 3; flex-basis: 100%; }
  .cr-header__title { font-size: 1rem; }
  .cr-header__sub { font-size: 0.72rem; }
}

/* ── 桌機：加寬，不然整頁內容擠在畫面左邊一小條 ── */
@media (min-width: 768px) {
  .cr-header { padding: 1.5rem 2rem; }
  .cr-header__inner { max-width: 760px; }
  .cr-header__logo-img { height: 52px; }
  .cr-header__title { font-size: 1.35rem; }
  .cr-header__sub { font-size: 0.85rem; }

  .cr-wrap { max-width: 760px; padding: 2.5rem 1.5rem 4rem; }
  .cr-card { padding: 1.75rem 2rem; }
  .cr-card__title { font-size: 20px; }
}

/* ── 螢幕更寬：報名資料改顯示在右側，左邊放課程介紹 ── */
@media (min-width: 1024px) {
  .cr-wrap { max-width: 1080px; padding: 2.5rem 1.5rem 4rem; }

  .cr-layout {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
  }
  .cr-layout__main {
    flex: 1 1 0%;
    min-width: 0;
  }
  .cr-layout__side {
    flex: 0 0 380px;
  }
}

/* ── 登入區 ── */
.cr-login-area { position: relative; flex-shrink: 0; }
.cr-login-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.35); border-radius: 20px;
  color: #fff; font-size: 13px; font-family: inherit; cursor: pointer;
  transition: background 0.15s;
}
.cr-login-btn:hover { background: rgba(255,255,255,0.25); }
.cr-avatar-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.6); overflow: hidden; cursor: pointer;
  background: #1FC29C; color: #fff; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.cr-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.cr-login-panel {
  position: absolute; right: 0; top: calc(100% + 10px); width: 250px;
  background: #fff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  border: 1px solid #eee; padding: 14px 16px; z-index: 1000;
}
.cr-login-panel__hint {
  display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3d7a52;
  margin: 0 0 10px; background: #f0f9f4; border-radius: 7px; padding: 7px 10px;
}
.cr-login-panel__error { font-size: 12px; color: #c0392b; margin: 8px 0 0; }
.cr-login-panel__user {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  padding-bottom: 12px; border-bottom: 1px solid #f5f5f5;
}
.cr-login-panel__avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.cr-login-panel__name { font-size: 13px; font-weight: 600; color: #333; margin: 0; }
.cr-login-panel__email { font-size: 11px; color: #999; margin: 0; }
.cr-login-panel__logout {
  display: block; width: 100%; text-align: left; font-size: 13px; color: #e74c3c;
  background: none; border: none; cursor: pointer; padding: 8px 0; font-family: inherit;
}
.cr-login-panel__logout:hover { color: #c0392b; }

.cr-overlay { position: fixed; inset: 0; z-index: 999; }
.cr-panel-fade-enter-active, .cr-panel-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.cr-panel-fade-enter-from, .cr-panel-fade-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }

.cr-logged-badge {
  display: inline-flex; align-items: center; gap: 5px; margin-left: auto;
  background: #f0f9f4; border: 1px solid #b8d8c4; border-radius: 20px;
  padding: 3px 9px 3px 5px; font-size: 12px; font-weight: 500; color: #1a5c3a;
}
.cr-logged-badge__avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }

/* ── Wrap ── */
.cr-loading { text-align: center; padding: 4rem 0; color: #8a9e84; font-size: 14px; }

.cr-cover {
  display: block; width: 100%; height: auto; border-radius: 14px;
  margin-bottom: 1rem; background-color: #e5ede2;
}
.cr-desc-wrap { margin: 0 0 1rem; }
.cr-desc { font-size: 22px; color: #33452e; line-height: 1.7; margin: 0; white-space: pre-line; }
.cr-desc--collapsed {
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.cr-desc-toggle {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  width: 100%; box-sizing: border-box; margin-bottom: 10px;
  background: #f0f9f4; border: 1px solid #dce8d8; border-radius: 8px;
  padding: 8px 0; cursor: pointer;
  font-size: 16px; font-weight: 500; color: #3d7a52; font-family: inherit;
  transition: background 0.15s;
}
.cr-desc-toggle:hover { background: #e5f2ea; color: #2a5c3a; }
.cr-desc-toggle__icon { transition: transform 0.2s; }
.cr-desc-toggle__icon--open { transform: rotate(180deg); }

.cr-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem; }
.cr-badge { font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 500; }
.cr-badge--main { background: #f0f9f4; color: #1a5c3a; border: 1px solid #b8d8c4; }
.cr-badge--warn { background: #fff8e6; color: #7a5800; border: 1px solid #f0d080; }

/* ── Card ── */
.cr-card { background: #fff; border: 1px solid #dce8d8; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
/*標題*/
.cr-card__title {
  display: flex; align-items: center; gap: 7px; font-size: 18px; font-weight: 600;
  color: #1a3d28; margin-bottom: 1rem; font-family: 'Noto Serif TC', serif;
}
.cr-card__title svg { width: 18px; height: 18px; color: #3d7a52; flex-shrink: 0; }
.cr-card__hint { font-size: 13px; color: #5a6e54; margin: 0 0 1rem; }

.cr-card--login { text-align: center; }
.cr-google-btn-main { display: flex; justify-content: center; margin-top: 0.5rem; }
.cr-inapp-hint {
  text-align: left; font-size: 12px; line-height: 1.6; color: #7a5800;
  background: #fff8e6; border: 1px solid #f0d080; border-radius: 8px;
  padding: 9px 12px; margin: 0 0 0.75rem;
}

.cr-card--success { text-align: center; }
.cr-card__success-icon {
  width: 48px; height: 48px; border-radius: 50%; background: #e8f5ee;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;
}
.cr-card__success-icon svg { width: 26px; height: 26px; color: #3d7a52; }
.cr-card__success-text { font-size: 15px; font-weight: 600; color: #1a3d28; margin: 0 0 4px; }
.cr-card__success-sub { font-size: 12px; color: #8a9e84; margin: 0 0 1rem; }
.cr-payment-status {
  display: inline-block; font-size: 12px; font-weight: 500; color: #7a5800;
  background: #fff8e6; border: 1px solid #f0d080; border-radius: 20px;
  padding: 4px 12px; margin: 0 0 1rem;
}
.cr-payment-status--paid { color: #1a5c3a; background: #f0f9f4; border-color: #b8d8c4; }
.cr-payment-box {
  background: #fafcf9; border: 1px solid #dce8d8; border-radius: 10px;
  padding: 12px 14px; margin-bottom: 1rem;
}
.cr-payment-box label { display: block; font-size: 14px; color: #5a6e54; margin-bottom: 6px; font-weight: 500; }
.cr-payment-box__empty { font-size: 12px; color: #c0392b; margin: 4px 0 0; }
.cr-payment-box__info {
  font-size: 12px; color: #3a4e36; white-space: pre-line; line-height: 1.6;
  background: #fff; border: 1px dashed #c5d4be; border-radius: 8px; padding: 8px 10px; margin: 8px 0;
}
.cr-card__btns { display: flex; gap: 8px; margin-top: 0.5rem; }

.cr-card--closed { text-align: center; color: #8a9e84; font-size: 14px; padding: 2rem 1rem; }

/* ── Field ── */
.cr-field { margin-bottom: 1rem; }
.cr-field:last-of-type { margin-bottom: 0; }
/*欄位*/
.cr-field label { display: block; font-size: 18px; color: #5a6e54; margin-bottom: 5px; font-weight: 500; }
.cr-field input[type=text],
.cr-field input[type=date],
.cr-field textarea,
.cr-field select {
  width: 100%; box-sizing: border-box; padding: 8px 12px;
  border: 1px solid #c5d4be; border-radius: 8px; font-size: 14px;
  background: #fafcf9; color: #2a2e25; font-family: inherit; outline: none;
  transition: border-color 0.2s;
}
.cr-field input:focus, .cr-field textarea:focus, .cr-field select:focus { border-color: #3d7a52; }
.cr-field textarea { resize: none; }
.cr-required { color: #c0392b; }
.cr-note-input { margin-top: 6px; }
.cr-choice-group { display: flex; flex-direction: column; gap: 8px; }
.cr-choice { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #2a2e25; }

/* ── Error ── */
.cr-error {
  display: flex; align-items: center; gap: 8px; background: #fdf0f0;
  border: 1px solid #f5c6c6; border-radius: 10px; padding: 11px 14px;
  margin-bottom: 1rem; font-size: 13px; color: #c0392b;
}
.cr-error__icon { width: 16px; height: 16px; flex-shrink: 0; }
.cr-error span { flex: 1; line-height: 1.5; }
.cr-error__close { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 14px; padding: 0 2px; opacity: 0.6; }
.cr-error__close:hover { opacity: 1; }
.cr-err-fade-enter-active, .cr-err-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.cr-err-fade-enter-from, .cr-err-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Buttons ── */
.cr-submit {
  flex: 1; padding: 13px; background: #3d7a52; color: #fff; border: none; border-radius: 10px;
  font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: background 0.18s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.cr-submit:hover:not(:disabled) { background: #2a5c3a; }
.cr-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.cr-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%; animation: cr-spin 0.7s linear infinite;
}
@keyframes cr-spin { to { transform: rotate(360deg); } }

.cr-btn {
  flex: 1; padding: 11px; border-radius: 10px; font-size: 14px; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: background 0.15s;
}
.cr-btn--outline { background: #fafcf9; border: 1.5px solid #c5d4be; color: #3a4e36; }
.cr-btn--outline:hover { background: #f0f9f4; }
.cr-btn--danger { background: #fdf0f0; border: 1.5px solid #f5c6c6; color: #c0392b; }
.cr-btn--danger:hover:not(:disabled) { background: #fbe0e0; }
.cr-btn--danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Modal ── */
.cr-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem;
}
.cr-modal { background: #fff; border-radius: 14px; padding: 1.5rem; width: 300px; box-shadow: 0 16px 48px rgba(0,0,0,0.2); }
.cr-modal--success { text-align: center; }
.cr-modal__title { font-size: 15px; font-weight: 600; color: #1a3d28; margin: 0 0 0.5rem; font-family: 'Noto Serif TC', serif; }
.cr-modal__content { font-size: 13px; color: #3a4e36; margin: 0 0 1rem; }
.cr-modal__success-icon {
  width: 48px; height: 48px; border-radius: 50%; background: #e8f5ee;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;
}
.cr-modal__success-icon svg { width: 26px; height: 26px; color: #3d7a52; }
.cr-modal__btns { display: flex; gap: 8px; }
.cr-modal__btns button {
  flex: 1; padding: 9px; border: 1.5px solid #3d7a52; border-radius: 8px; cursor: pointer;
  font-size: 14px; background: #3d7a52; color: #fff; font-family: inherit; transition: background 0.15s;
}
.cr-modal__btns button:hover { background: #2a5c3a; }
.cr-modal-fade-enter-active, .cr-modal-fade-leave-active { transition: opacity 0.2s; }
.cr-modal-fade-enter-from, .cr-modal-fade-leave-to { opacity: 0; }
</style>