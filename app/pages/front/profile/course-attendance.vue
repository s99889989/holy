<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import {useCommonStore} from '~/stores/common.js'
import {useCustomerStore} from '~/stores/customer.js'
import GoogleLoginButton from '~/components/GoogleLoginButton.vue'

definePageMeta({ layout: 'front' })

useSiteHead()

const commonStore    = useCommonStore()
const customerStore  = useCustomerStore()
const COURSE_BASE    = computed(() => commonStore.data.main_url + '/holy/course-reg')

const customer = computed(() => customerStore.customer)

// ── 我的課程報名 / 簽到情況 ──────────────────────────────────────────
const loading    = ref(false)
const refreshing = ref(false)
const courses    = ref([]) // [{ courseId, courseName, paymentEnabled, sessionDates, registration }]

async function loadMyRegistrations(showLoading = false) {
  if (showLoading) loading.value = true
  try {
    const res  = await fetch(`${COURSE_BASE.value}/my-registrations`, {credentials: 'include'})
    const data = await res.json()
    courses.value = Array.isArray(data) ? data : []
  } catch {
    courses.value = []
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  refreshing.value = true
  await loadMyRegistrations()
  refreshing.value = false
}

const onLogin = async () => { await loadMyRegistrations(true) }

watch(customer, async (c) => {
  if (c) await loadMyRegistrations(true)
  else courses.value = []
})

onMounted(async () => {
  if (customer.value) await loadMyRegistrations(true)
})

// ── 出席統計（有 sessionDates 才算場次出席率）────────────────────────
function attendedCount(item) {
  const dates = item.sessionDates || []
  const att   = item.registration?.attendance || {}
  return dates.filter(d => att[d]).length
}
function totalSessions(item) {
  return (item.sessionDates || []).length
}
</script>

<template>
  <div>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink>
        > 會員中心 > 課程簽到情況
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 col-md-9 col-lg-8 rounded bg-lightGreen py-4 px-3 px-sm-4">

                <!-- 未登入 -->
                <div v-if="!customer" class="profile-empty text-center">
                  <p class="profile-empty__hint">請先登入 Google 帳號查看您的課程簽到情況</p>
                  <GoogleLoginButton @login="onLogin"/>
                </div>

                <!-- 已登入 -->
                <template v-else>

                  <div class="profile-tabs">
                    <span class="ca-title">我的課程簽到情況</span>
                    <button class="profile-refresh-btn" @click="refresh" :disabled="refreshing" title="重新整理">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="{ 'profile-refresh-spin': refreshing }"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    </button>
                  </div>

                  <div v-if="loading" class="profile-loading">載入中…</div>

                  <div v-else-if="!courses.length" class="profile-empty-tab">
                    尚無課程報名紀錄
                  </div>

                  <div v-else>
                    <div v-for="item in courses" :key="item.courseId" class="ca-card">
                      <div class="ca-card__head">
                        <span class="ca-card__name">{{ item.courseName || '未命名課程' }}</span>
                        <span v-if="totalSessions(item)" class="profile-badge profile-badge--teal">
                          已出席 {{ attendedCount(item) }} / {{ totalSessions(item) }} 場
                        </span>
                        <span v-else class="profile-badge" :class="item.registration?.picked ? 'profile-badge--success' : 'profile-badge--muted'">
                          {{ item.registration?.picked ? '已簽到' : '尚未簽到' }}
                        </span>
                      </div>

                      <!-- 多場次：逐場出席狀態 -->
                      <div
                        v-if="totalSessions(item)"
                        class="ca-sessions"
                      >
                        <span
                          v-for="d in item.sessionDates"
                          :key="d"
                          class="ca-session"
                          :class="item.registration?.attendance?.[d] ? 'ca-session--attended' : 'ca-session--absent'"
                        >
                          {{ d }}
                        </span>
                      </div>

                      <p v-if="item.registration?.submittedAt" class="ca-card__meta">
                        報名時間：{{ item.registration.submittedAt }}
                      </p>
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

/* ── 頂列（標題 + 重新整理）── */
.profile-tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2px solid #e0d8cc;
  margin-bottom: 20px;
  padding-bottom: 10px;
}
.ca-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a3d28;
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

/* ── 狀態 Badge（沿用個人中心樣式）── */
.profile-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
}
.profile-badge--teal    { background-color: #d0f0eb; color: #0a7a63; }
.profile-badge--success { background-color: #d1f0e8; color: #0d6e4f; }
.profile-badge--muted   { background-color: #f0f0f0; color: #888; }

/* ── 課程卡片 ── */
.ca-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 14px 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.ca-card__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.ca-card__name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.ca-card__meta {
  font-size: 12px;
  color: #aaa;
  margin: 8px 0 0;
}

/* ── 逐場次出席格子 ── */
.ca-sessions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.ca-session {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.ca-session--attended {
  background: rgba(34, 197, 94, 0.12);
  border-color: #22c55e;
  color: #158a4d;
}
.ca-session--absent {
  background: #f5f5f5;
  border-color: #eee;
  color: #aaa;
}
</style>
