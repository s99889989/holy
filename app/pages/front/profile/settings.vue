<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useCommonStore } from '~/stores/common.js'
import { useCustomerStore } from '~/stores/customer.js'

definePageMeta({ layout: 'front' })

useSiteHead()

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

onMounted(() => {
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display =
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block' : 'none'
    }
  }
  if (customer.value) fetchProfile()
})

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const BASE = computed(() => commonStore.data.main_url + '/holy/customer')
const customer = computed(() => customerStore.customer)

// ── 表單 ─────────────────────────────────────────────────────────
const form = reactive({mobile: '', landline: '', address: '', birthday: '', note: ''})
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const mobileError = ref('')
const landlineError = ref('')

// ── 電話驗證 ─────────────────────────────────────────────────────
const validateMobile = (clean) => /^09\d{8}$/.test(clean)
const validateLandline = (clean) => {
  if (/^02\d{8}$/.test(clean)) return true        // 台北/新北/基隆 10碼
  if (/^0[3-8]\d{7,8}$/.test(clean)) return true  // 03~08 9~10碼
  if (/^037\d{6}$/.test(clean)) return true       // 苗栗 9碼
  if (/^049\d{6}$/.test(clean)) return true       // 南投 9碼
  if (/^089\d{6}$/.test(clean)) return true       // 台東 9碼
  if (/^082[36]\d{6}$/.test(clean)) return true   // 金門/烏坵 10碼
  if (/^0836\d{6}$/.test(clean)) return true      // 馬祖 10碼
  return false
}
const onMobileInput = () => {
  if (!form.mobile) {
    mobileError.value = '';
    return
  }
  const clean = form.mobile.replace(/[-\s]/g, '')
  mobileError.value = validateMobile(clean) ? '' : '請輸入正確的手機號碼（09xxxxxxxx）'
}
const onLandlineInput = () => {
  if (!form.landline) {
    landlineError.value = '';
    return
  }
  const clean = form.landline.replace(/[-\s]/g, '')
  landlineError.value = validateLandline(clean) ? '' : '請輸入正確的市話（如 02-12345678、07-1234567）'
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const data = await fetch(`${BASE.value}/profile?customerId=${customer.value?.id ?? ''}`).then(r => r.json())
    if (!data.error) {
      form.mobile = data.mobile || ''
      form.landline = data.landline || ''
      form.address = data.address || ''
      form.birthday = data.birthday || ''
      form.note = data.note || ''
    }
  } catch {
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  // 驗證
  if (form.mobile) {
    const c = form.mobile.replace(/[-\s]/g, '')
    mobileError.value = validateMobile(c) ? '' : '請輸入正確的手機號碼（09xxxxxxxx）'
  } else {
    mobileError.value = ''
  }
  if (form.landline) {
    const c = form.landline.replace(/[-\s]/g, '')
    landlineError.value = validateLandline(c) ? '' : '請輸入正確的市話（如 02-12345678、07-1234567）'
  } else {
    landlineError.value = ''
  }
  if (mobileError.value || landlineError.value) return

  saving.value = true;
  saved.value = false;
  error.value = ''
  try {
    const res = await fetch(`${BASE.value}/profile`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({customerId: customer.value?.id ?? '', ...form}),
    })
    if (!res.ok) throw new Error()
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  } catch {
    error.value = '儲存失敗，請稍後再試。'
  } finally {
    saving.value = false
  }
}
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
        > <NuxtLink to="/front/restaurant">田園餐廳</NuxtLink>
        > 帳號設定
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-8 col-lg-7 rounded bg-lightGreen py-4 px-3 px-sm-4">

                <!-- 未登入 -->
                <div v-if="!customer" class="profile-empty text-center">
                  <p class="profile-empty__hint">請先登入 Google 帳號以編輯個人資料</p>
                </div>

                <!-- 已登入 -->
                <template v-else>
                  <h2 class="settings-title">帳號設定</h2>



                  <!-- 載入中 -->
                  <div v-if="loading" class="settings-loading">載入中…</div>

                  <!-- 表單 -->
                  <div v-else class="settings-form">
                    <div class="settings-field">
                      <label class="settings-label">手機號碼</label>
                      <input v-model="form.mobile" type="tel" placeholder="09xx-xxx-xxx"
                             class="settings-input" :class="mobileError && 'settings-input--error'"
                             @input="onMobileInput"/>
                      <p v-if="mobileError" class="settings-field-error">{{ mobileError }}</p>
                    </div>
                    <div class="settings-field">
                      <label class="settings-label">市話</label>
                      <input v-model="form.landline" type="tel" placeholder="02-xxxxxxxx 或 07-xxxxxxx"
                             class="settings-input" :class="landlineError && 'settings-input--error'"
                             @input="onLandlineInput"/>
                      <p v-if="landlineError" class="settings-field-error">{{ landlineError }}</p>
                    </div>
                    <div class="settings-field">
                      <label class="settings-label">地址</label>
                      <input v-model="form.address" type="text" placeholder="縣市 + 詳細地址"
                             class="settings-input"/>
                    </div>
                    <div class="settings-field">
                      <label class="settings-label">生日</label>
                      <input v-model="form.birthday" type="date"
                             class="settings-input"/>
                    </div>
                    <div class="settings-field">
                      <label class="settings-label">其他備註</label>
                      <textarea v-model="form.note" rows="3"
                                placeholder="過敏食材、特殊飲食需求…"
                                class="settings-input settings-textarea"/>
                    </div>

                    <p v-if="error" class="settings-error">{{ error }}</p>

                    <div class="settings-actions">
                      <button @click="saveProfile" :disabled="saving" class="settings-btn">
                        <span v-if="saving">儲存中…</span>
                        <span v-else-if="saved">✓ 已儲存</span>
                        <span v-else>儲存設定</span>
                      </button>
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

    <SiteFooter/>

    <button @click="topFunction" id="myBtn" title="Go to top" class="d-lg-none">
      <i class="fas fa-chevron-up"></i>
    </button>
  </div>
</template>

<style scoped>
/* ── 標題 ── */
.settings-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

/* ── Google 帳號資訊 ── */
.settings-google-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 20px;
}

.settings-google-info__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.settings-google-info__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1FC29C;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.settings-google-info__name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.settings-google-info__email {
  font-size: 12px;
  color: #aaa;
  margin: 0;
}

/* ── 載入 ── */
.settings-loading {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #aaa;
}

/* ── 表單 ── */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.settings-input {
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

.settings-input:focus {
  border-color: #5bbfbf;
}

.settings-input--error {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.settings-textarea {
  resize: none;
}

/* ── 欄位錯誤提示 ── */
.settings-field-error {
  font-size: 12px;
  color: #e74c3c;
  margin: 2px 0 0;
}

/* ── 錯誤 ── */
.settings-error {
  font-size: 12px;
  color: #e74c3c;
  background: #fff5f5;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 0;
}

/* ── 按鈕 ── */
.settings-actions {
  display: flex;
  justify-content: flex-end;
}

.settings-btn {
  padding: 10px 28px;
  border-radius: 12px;
  border: none;
  background-color: #5bbfbf;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.settings-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.settings-btn:hover:not(:disabled) {
  opacity: 0.88;
}

/* ── 未登入 ── */
.profile-empty {
  background: #fff;
  border: 2px dashed #b8d8d0;
  border-radius: 16px;
  padding: 48px 24px;
}

.profile-empty__hint {
  font-size: 15px;
  color: #888;
  margin-bottom: 20px;
}
</style>
