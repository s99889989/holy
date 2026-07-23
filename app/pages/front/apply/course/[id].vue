<script setup>
  // 前台課程報名頁，視覺風格照客戶專案的 front/order/soybeans.vue 對齊
  // （深綠 header、頭像登入面板、卡片、圓角 qty 控制、成功 Modal 這一整套）。
  //
  // ⚠️ 這頁目前先放在 staff/admin 這個測試專案裡，之後會搬到客戶專案，
  // 所以沒有依賴這個測試專案的 layouts/front.vue、StaffNavbar 之類的東西，
  // 用法盡量比照 soybeans.vue：definePageMeta({ layout: false }) + useSiteHead。
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
  const answerFields = computed(() => (course.value?.fields ?? []).filter(f => f.type !== 'display_image'))
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
      auto_select: false,
    })
  }
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

  const resetAnswers = () => {
    answerFields.value.forEach(f => {
      const existing = course.value?.myRegistration?.answers?.[f.id]
      answers[f.id] = existing ?? (f.type === 'checkbox' ? [] : '')
      if (f.allowNote) {
        answers[f.id + '__note'] = course.value?.myRegistration?.answers?.[f.id + '__note'] ?? ''
      }
    })
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
      script.onload = () => { initGoogle(); nextTick(() => renderGoogleBtn('cr-google-btn-main')) }
      document.head.appendChild(script)
    } else if (window.google) {
      initGoogle()
      nextTick(() => renderGoogleBtn('cr-google-btn-main'))
    }
  })

  // ── 送出報名 ──────────────────────────────────────────────────
  const submitting = ref(false)
  const cancelling = ref(false)
  const errorMsg = ref('')
  const successModal = ref(false)

  const validate = () => {
    for (const f of answerFields.value) {
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
      const res = await store.submitRegistration(courseId, { ...answers })
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
        <img
                v-if="course.coverImage"
                :src="imgUrl(course.coverImage)"
                :alt="course.name"
                class="cr-cover"
        >

        <p v-if="course.description" class="cr-desc">{{ course.description }}</p>

        <div class="cr-badges">
          <span class="cr-badge cr-badge--main">
            已報名 {{ course.registeredCount }}{{ course.maxCapacity ? ` / ${course.maxCapacity}` : '' }} 人
          </span>
          <span v-if="course.registrationDeadline" class="cr-badge cr-badge--warn">
            截止：{{ course.registrationDeadline }}
          </span>
        </div>

        <!-- 未登入：整塊登入卡片（報名一定要先登入）-->
        <div v-if="!customer" class="cr-card cr-card--login">
          <div class="cr-card__title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            請先登入才能報名
          </div>
          <p class="cr-card__hint">用 Google 帳號登入後即可填寫報名表單</p>
          <div id="cr-google-btn-main" class="cr-google-btn-main"></div>
          <p v-if="loginError" class="cr-login-panel__error">{{ loginError }}</p>
        </div>

        <!-- 已登入 -->
        <template v-else>
          <!-- 已報名，非編輯模式 -->
          <div v-if="course.myRegistration && !editing" class="cr-card cr-card--success">
            <div class="cr-card__success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="cr-card__success-text">你已經報名這堂課程</p>
            <p class="cr-card__success-sub">報名時間：{{ course.myRegistration.submittedAt }}</p>
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
              <span class="cr-logged-badge">
                <img v-if="customer.picture" :src="customer.picture" class="cr-logged-badge__avatar">
                {{ customer.name }}
              </span>
            </div>

            <div v-for="f in answerFields" :key="f.id" class="cr-field">
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
  .cr-wrap { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
  .cr-loading { text-align: center; padding: 4rem 0; color: #8a9e84; font-size: 14px; }

  .cr-cover {
    display: block; width: 100%; height: auto; border-radius: 14px;
    margin-bottom: 1rem; background-color: #e5ede2;
  }
  .cr-desc { font-size: 15px; color: #33452e; line-height: 1.75; margin: 0 0 1rem; white-space: pre-line; }

  .cr-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem; }
  .cr-badge { font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 500; }
  .cr-badge--main { background: #f0f9f4; color: #1a5c3a; border: 1px solid #b8d8c4; }
  .cr-badge--warn { background: #fff8e6; color: #7a5800; border: 1px solid #f0d080; }

  /* ── Card ── */
  .cr-card { background: #fff; border: 1px solid #dce8d8; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
  .cr-card__title {
    display: flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 600;
    color: #1a3d28; margin-bottom: 1rem; font-family: 'Noto Serif TC', serif;
  }
  .cr-card__title svg { width: 18px; height: 18px; color: #3d7a52; flex-shrink: 0; }
  .cr-card__hint { font-size: 13px; color: #5a6e54; margin: 0 0 1rem; }

  .cr-card--login { text-align: center; }
  .cr-google-btn-main { display: flex; justify-content: center; margin-top: 0.5rem; }

  .cr-card--success { text-align: center; }
  .cr-card__success-icon {
    width: 48px; height: 48px; border-radius: 50%; background: #e8f5ee;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;
  }
  .cr-card__success-icon svg { width: 26px; height: 26px; color: #3d7a52; }
  .cr-card__success-text { font-size: 15px; font-weight: 600; color: #1a3d28; margin: 0 0 4px; }
  .cr-card__success-sub { font-size: 12px; color: #8a9e84; margin: 0 0 1rem; }
  .cr-card__btns { display: flex; gap: 8px; margin-top: 0.5rem; }

  .cr-card--closed { text-align: center; color: #8a9e84; font-size: 14px; padding: 2rem 1rem; }

  /* ── Field ── */
  .cr-field { margin-bottom: 1rem; }
  .cr-field:last-of-type { margin-bottom: 0; }
  .cr-field label { display: block; font-size: 13px; color: #5a6e54; margin-bottom: 5px; font-weight: 500; }
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

  /* ── 桌機版面優化（手機維持原本 560px 單欄不動，這段只在寬螢幕生效）── */
  @media (min-width: 768px) {
    .cr-header { padding: 1.75rem 2rem; }
    .cr-header__inner { max-width: 760px; gap: 1.25rem; }
    .cr-header__logo-img { height: 50px; }
    .cr-header__title { font-size: 1.35rem; }
    .cr-header__sub { font-size: 0.85rem; }

    .cr-wrap { max-width: 760px; padding: 2.5rem 1.5rem 4rem; }

    .cr-cover { max-height: 420px; object-fit: contain; background-color: transparent; }

    .cr-desc { font-size: 16px; }

    .cr-badge { font-size: 13px; padding: 5px 14px; }

    .cr-card { padding: 1.75rem 2rem; }
    .cr-card__title { font-size: 16.5px; }
    .cr-card__hint { font-size: 14px; }

    .cr-field { margin-bottom: 1.25rem; }
    .cr-field label { font-size: 14px; }
    .cr-field input[type=text],
    .cr-field input[type=date],
    .cr-field textarea,
    .cr-field select { font-size: 15px; padding: 10px 14px; }
    .cr-choice { font-size: 15px; }

    .cr-submit { font-size: 16px; padding: 14px; }
    .cr-btn { font-size: 15px; padding: 12px; }
  }
</style>