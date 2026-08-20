<script setup>
  import {ref, computed, onMounted, watch} from 'vue'
  import {useCommonStore} from '~/stores/common.js'
  import {useCustomerStore} from '~/stores/customer.js'
  import GoogleLoginButton from '~/components/GoogleLoginButton.vue'

  definePageMeta({ layout: 'front' })

  useSiteHead()

  const commonStore   = useCommonStore()
  const customerStore = useCustomerStore()
  const TABC_BASE      = computed(() => commonStore.data.main_url + '/holy/tabc')

  const customer = computed(() => customerStore.customer)

  // ── 綁定狀態 / 個人紀錄 ────────────────────────────────────────────
  const loading     = ref(false)
  const bindStatus  = ref(null)   // { bound, patnr, customer }
  const records     = ref([])
  const refreshing  = ref(false)

  async function loadStatus(showLoading = false) {
    if (showLoading) loading.value = true
    try {
      const res  = await fetch(`${TABC_BASE.value}/me/status`, {credentials: 'include'})
      const data = await res.json()
      bindStatus.value = data.error ? {bound: false} : data
      if (bindStatus.value.bound) await loadRecords()
      else records.value = []
    } catch {
      bindStatus.value = {bound: false}
      records.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadRecords() {
    try {
      const res  = await fetch(`${TABC_BASE.value}/me/records`, {credentials: 'include'})
      const data = await res.json()
      records.value = Array.isArray(data) ? data : []
    } catch {
      records.value = []
    }
  }

  const refresh = async () => {
    refreshing.value = true
    await loadStatus()
    refreshing.value = false
  }

  const onLogin = async () => { await loadStatus(true) }

  watch(customer, async (c) => {
    if (c) await loadStatus(true)
    else {
      bindStatus.value = null
      records.value    = []
    }
  })

  onMounted(async () => {
    if (customer.value) await loadStatus(true)
  })

  // ── 性別代碼正規化（比照後台邏輯）──────────────────────────────────
  function sexCode(v) {
    if (v === null || v === undefined) return ''
    const s = String(v).trim().toUpperCase()
    if (s === 'M' || s === 'MALE' || s === '1' || s === '男') return 'M'
    if (s === 'F' || s === 'FEMALE' || s === '2' || s === '女') return 'F'
    return ''
  }
  function sexLabel(v) {
    const code = sexCode(v)
    if (code === 'M') return '男'
    if (code === 'F') return '女'
    return v === null || v === undefined ? '' : String(v).trim()
  }

  // ── 標準範圍色帶（BMI / 體脂率 / 內臟脂肪）──────────────────────────
  const BMI_ZONES = [
    {to: 18.5, label: '過輕', color: '#38bdf8'},
    {to: 24,   label: '正常', color: '#10b981'},
    {to: 27,   label: '過重', color: '#f59e0b'},
    {to: 40,   label: '肥胖', color: '#f43f5e'},
  ]
  function fatZones(sex) {
    return sex === 'M'
            ? [{to: 14, label: '過低', color: '#38bdf8'}, {to: 20, label: '正常', color: '#10b981'}, {to: 25, label: '過重', color: '#f59e0b'}, {to: 50, label: '偏高', color: '#f43f5e'}]
            : [{to: 21, label: '過低', color: '#38bdf8'}, {to: 27, label: '正常', color: '#10b981'}, {to: 32, label: '過重', color: '#f59e0b'}, {to: 55, label: '偏高', color: '#f43f5e'}]
  }
  const VFAT_ZONES = [
    {to: 10, label: '正常', color: '#10b981'},
    {to: 15, label: '偏高', color: '#f59e0b'},
    {to: 30, label: '過高', color: '#f43f5e'},
  ]

  function buildRangeBar(title, value, zones, digits = 1) {
    const n = Number(value)
    if (Number.isNaN(n)) return null
    const max = zones[zones.length - 1].to
    let from = 0
    const segments = zones.map(z => {
      const seg = {left: (from / max) * 100, width: ((z.to - from) / max) * 100, color: z.color, label: z.label}
      from = z.to
      return seg
    })
    const markerPct  = Math.min(100, Math.max(0, (n / max) * 100))
    const activeZone = zones.find(z => n <= z.to) ?? zones[zones.length - 1]
    return {title, valueLabel: n.toFixed(digits), segments, markerPct, markerColor: activeZone.color}
  }

  const latestRecord = computed(() => records.value[0] ?? null)

  const rangeBars = computed(() => {
    if (!latestRecord.value) return []
    const sex = sexCode(bindStatus.value?.customer?.sex) || 'F'
    return [
      buildRangeBar('BMI', latestRecord.value.bmi, BMI_ZONES),
      buildRangeBar('體脂率 %', latestRecord.value.fatp, fatZones(sex)),
      buildRangeBar('內臟脂肪等級', latestRecord.value.vfatl, VFAT_ZONES, 0),
    ].filter(b => b !== null)
  })

  // ── 格式化輔助 ────────────────────────────────────────────────────
  function fmtNum(v, digits = 1) {
    if (v === null || v === undefined || v === '') return '–'
    const n = Number(v)
    if (Number.isNaN(n)) return '–'
    return n.toFixed(digits)
  }
  function fmtDate(v) {
    if (!v) return '–'
    return String(v).slice(0, 10)
  }
  function fmtMonth(v) {
    return fmtDate(v).slice(0, 7)
  }
  function fmtDay(v) {
    return fmtDate(v).slice(8, 10)
  }
</script>

<template>
  <div>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink>
        > 會員中心 > 身體組成分析
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-9 col-lg-8 rounded bg-lightGreen py-4 px-3 px-sm-4">

                <!-- 未登入 -->
                <div v-if="!customer" class="profile-empty text-center">
                  <p class="profile-empty__hint">請先登入 Google 帳號查看您的身體組成分析紀錄</p>
                  <GoogleLoginButton @login="onLogin"/>
                </div>

                <!-- 已登入 -->
                <template v-else>

                  <div v-if="loading" class="profile-loading">載入中…</div>

                  <!-- 尚未綁定 -->
                  <div v-else-if="!bindStatus?.bound" class="bc-bind">
                    <p class="bc-bind__title">尚未綁定身體組成分析帳號</p>
                    <p class="bc-bind__hint">
                      請至櫃檯出示您的 Google 登入帳號（{{ customer?.email }}），
                      由服務人員協助綁定後，即可在此查看您的歷史檢測紀錄。
                    </p>
                    <button class="profile-refresh-btn bc-bind__refresh" @click="refresh" :disabled="refreshing" title="重新整理">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="{ 'profile-refresh-spin': refreshing }"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      已完成綁定？重新整理
                    </button>
                  </div>

                  <!-- 已綁定：個人身體組成資料 -->
                  <div v-else>
                    <div class="profile-tabs">
                      <span class="bc-bound-name">
                        {{ bindStatus.customer?.lastname }}{{ bindStatus.customer?.firstname }}
                        <span v-if="sexLabel(bindStatus.customer?.sex)" class="bc-bound-sex">
                          （{{ sexLabel(bindStatus.customer?.sex) }}）
                        </span>
                      </span>
                      <button class="profile-refresh-btn" @click="refresh" :disabled="refreshing" title="重新整理">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="{ 'profile-refresh-spin': refreshing }"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      </button>
                    </div>

                    <div v-if="!records.length" class="profile-empty-tab">
                      尚無檢測紀錄，歡迎至櫃檯進行身體組成分析檢測。
                    </div>

                    <template v-else>

                      <!-- 最新一次檢測摘要 -->
                      <div class="bc-latest">
                        <p class="bc-latest__date">最新檢測日期：{{ fmtDate(latestRecord.datetime) }}</p>

                        <div v-for="bar in rangeBars" :key="bar.title" class="bc-range">
                          <div class="bc-range__head">
                            <span class="bc-range__title">{{ bar.title }}</span>
                            <span class="bc-range__value">{{ bar.valueLabel }}</span>
                          </div>
                          <div class="bc-range__track">
                            <div
                                    v-for="(seg, i) in bar.segments"
                                    :key="i"
                                    class="bc-range__seg"
                                    :style="{ left: seg.left + '%', width: seg.width + '%', backgroundColor: seg.color }"
                            />
                            <div class="bc-range__marker" :style="{ left: bar.markerPct + '%', borderColor: bar.markerColor }"/>
                          </div>
                        </div>

                        <div class="bc-latest__grid">
                          <div class="bc-latest__cell">
                            <span>體重</span>
                            <b>{{ fmtNum(latestRecord.weight) }} kg</b>
                          </div>
                          <div class="bc-latest__cell">
                            <span>肌肉量</span>
                            <b>{{ fmtNum(latestRecord.pmm) }} kg</b>
                          </div>
                          <div class="bc-latest__cell">
                            <span>體脂肪量</span>
                            <b>{{ fmtNum(latestRecord.fatm) }} kg</b>
                          </div>
                          <div class="bc-latest__cell">
                            <span>基礎代謝</span>
                            <b>{{ fmtNum(latestRecord.bmr, 0) }} kcal</b>
                          </div>
                        </div>
                      </div>

                      <!-- 歷史檢測紀錄 -->
                      <p class="bc-history__title">歷史檢測紀錄</p>
                      <div
                              v-for="rec in records"
                              :key="rec.datetime"
                              class="profile-card"
                      >
                        <div class="profile-card__date profile-card__date--teal">
                          <p class="profile-card__date-month">{{ fmtMonth(rec.datetime) }}</p>
                          <p class="profile-card__date-day profile-card__date-day--teal">{{ fmtDay(rec.datetime) }}</p>
                        </div>
                        <div class="profile-card__body">
                          <div class="profile-card__meta">
                            <span>BMI {{ fmtNum(rec.bmi) }}</span>
                            <span>體脂率 {{ fmtNum(rec.fatp) }}%</span>
                            <span>肌肉量 {{ fmtNum(rec.pmm) }} kg</span>
                            <span>內臟脂肪 {{ fmtNum(rec.vfatl, 0) }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
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

  /* ── 頂列（姓名 + 重新整理）── */
  .profile-tabs {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 2px solid #e0d8cc;
    margin-bottom: 20px;
    padding-bottom: 10px;
  }
  .bc-bound-name {
    font-size: 15px;
    font-weight: 700;
    color: #1a3d28;
  }
  .bc-bound-sex {
    font-size: 13px;
    font-weight: 500;
    color: #888;
  }
  .profile-refresh-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    color: #aaa;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .profile-refresh-btn:hover:not(:disabled) { color: #1FC29C; }
  .profile-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .profile-refresh-btn svg { width: 16px; height: 16px; }
  .profile-refresh-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

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

  /* ── 綁定表單 ── */
  .bc-bind {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 28px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  .bc-bind__title {
    font-size: 16px;
    font-weight: 700;
    color: #1a3d28;
    margin: 0 0 8px;
  }
  .bc-bind__hint {
    font-size: 13px;
    color: #666;
    line-height: 1.7;
    margin: 0 0 16px;
  }
  .bc-bind__refresh {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    color: #3d7a52;
    background: #f0f9f4;
    border: 1px solid #b8d8c4;
    border-radius: 10px;
    margin-left: 0;
  }
  .bc-bind__refresh:hover:not(:disabled) { background: #ddf0e8; }
  .bc-bind__refresh svg { width: 14px; height: 14px; }

  /* ── 最新一次檢測摘要 ── */
  .bc-latest {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 18px 16px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  .bc-latest__date {
    font-size: 13px;
    color: #888;
    margin: 0 0 16px;
  }
  .bc-range { margin-bottom: 14px; }
  .bc-range__head {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    margin-bottom: 5px;
  }
  .bc-range__title { color: #666; }
  .bc-range__value { font-weight: 700; color: #1a3d28; }
  .bc-range__track {
    position: relative;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: #f0f0f0;
  }
  .bc-range__seg {
    position: absolute;
    top: 0;
    height: 100%;
  }
  .bc-range__marker {
    position: absolute;
    top: -3px;
    width: 3px;
    height: 14px;
    background: #fff;
    border: 2px solid #333;
    border-radius: 2px;
    transform: translateX(-50%);
  }
  .bc-latest__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 18px;
  }
  .bc-latest__cell {
    background: #f8faf8;
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .bc-latest__cell span { font-size: 11.5px; color: #999; }
  .bc-latest__cell b { font-size: 15px; color: #1a3d28; }

  /* ── 歷史紀錄清單標題 ── */
  .bc-history__title {
    font-size: 13px;
    font-weight: 700;
    color: #666;
    margin: 0 0 10px;
  }

  /* ── 卡片（沿用個人中心樣式）── */
  .profile-card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 14px 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  .profile-card__date {
    flex-shrink: 0;
    width: 50px;
    min-width: 50px;
    text-align: center;
    border-radius: 10px;
    padding: 7px 4px;
  }
  .profile-card__date--teal { background-color: #eef7f5; }
  .profile-card__date-month {
    font-size: 10px;
    color: #aaa;
    margin: 0;
  }
  .profile-card__date-day {
    font-size: 20px;
    font-weight: 900;
    margin: 0;
    line-height: 1.2;
  }
  .profile-card__date-day--teal { color: #1FC29C; }
  .profile-card__body {
    flex: 1;
    min-width: 0;
  }
  .profile-card__meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 13px;
    color: #666;
  }
</style>