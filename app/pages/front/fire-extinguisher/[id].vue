<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

// 這頁是公開頁(掃碼看歷史紀錄不用登入),所以不用 staff layout
definePageMeta({ layout: false })

const commonStore = useCommonStore()
const API_BASE = computed(() => commonStore.data.just_url + '/holy/fire-extinguisher')

const customerStore = useCustomerStore()
const isLoggedIn = computed(() => customerStore.isLoggedIn)
const inspectorName = computed(() => customerStore.customer?.name || '')

const route = useRoute()
const extinguisherId = route.params.id // 網址與 QR Code 上編碼的是永久 id,不是編號,改編號不會讓舊 QR 失效

// 未登入只看得到「巡檢紀錄」分頁；登入後才會多出「填寫新檢查」
const activeTab = ref('history')

const items = ['外觀(無銹蝕變形)', '壓力表(指針在綠區)', '安全插銷/鉛封', '軟管/噴嘴', '標示牌與效期', '放置狀態正常']
const state = reactive({})
const notes = reactive({})
items.forEach((i) => {
  state[i] = null
  notes[i] = ''
})

const extinguisher = ref(null)
const loading = ref(true)
const loadError = ref('')

const history = ref([])
const historyLoading = ref(true)

async function loadExtinguisher() {
  loading.value = true
  try {
    // /get 不管有沒有停用都查得到，這樣就算滅火器被停用了，掃碼還是能看到歷史紀錄
    const data = await $fetch(`${API_BASE.value}/get/${encodeURIComponent(extinguisherId)}`)
    if (data?.error) {
      loadError.value = data.error
    } else {
      extinguisher.value = data
    }
  } catch (e) {
    console.error(e)
    loadError.value = '無法載入滅火器資料'
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const data = await $fetch(`${API_BASE.value}/inspection/list/${encodeURIComponent(extinguisherId)}`)
    history.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  loadExtinguisher()
  loadHistory()
})

const doneCount = computed(() => items.filter(i => state[i] !== null).length)
const hasFail = computed(() => items.some(i => state[i] === 'fail'))
const gaugeOffset = computed(() => 157 - (157 * doneCount.value / items.length))
const gaugeColor = computed(() =>
  doneCount.value === items.length ? '#2F7D5C' : (hasFail.value ? '#B4740E' : '#C1272D')
)

const photoFile = ref(null)
const photoPreview = ref('')

function onPhotoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const failWithoutNote = computed(() =>
  items.some(i => state[i] === 'fail' && !notes[i].trim())
)
const canSubmit = computed(() =>
  doneCount.value === items.length && photoFile.value && !failWithoutNote.value
)

const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')
const submitStamp = ref('')

async function submit() {
  if (!canSubmit.value || !isLoggedIn.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const checklist = {}
    let combinedNote = ''
    items.forEach((i) => {
      checklist[i] = state[i]
      if (state[i] === 'fail' && notes[i]) combinedNote += `【${i}】${notes[i]}\n`
    })

    const formData = new FormData()
    formData.append('extinguisherId', extinguisherId)
    formData.append('code', extinguisher.value?.code || extinguisherId) // 存這次檢查當下的編號快照
    formData.append('checklist', JSON.stringify(checklist))
    formData.append('note', combinedNote)
    formData.append('inspector', inspectorName.value)
    formData.append('photo', photoFile.value)

    const res = await fetch(`${API_BASE.value}/inspection/save`, {
      method: 'POST', body: formData, credentials: 'include'
    })
    const result = await res.json()
    if (result?.error) {
      submitError.value = result.error
      return
    }

    submitted.value = true
    submitStamp.value = result.inspectedAt || new Date().toLocaleString('zh-TW')
    loadHistory() // 順便把新紀錄補進歷史列表
  } catch (e) {
    console.error(e)
    submitError.value = '送出失敗，請檢查網路後再試一次'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  items.forEach((i) => {
    state[i] = null
    notes[i] = ''
  })
  photoFile.value = null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = ''
  submitted.value = false
  activeTab.value = 'history'
}

const statusColor = status => ({
  正常: { bg: '#E4F1EA', fg: '#2F7D5C', line: '#9FCBB4' },
  待處理: { bg: '#FBE8E7', fg: '#C1272D', line: '#E7A6A2' },
  送修中: { bg: '#FCF0D9', fg: '#B4740E', line: '#EFC97C' },
  已更換: { bg: '#E4F1EA', fg: '#2F7D5C', line: '#9FCBB4' },
  已報廢: { bg: '#EFF0EC', fg: '#5B615D', line: '#DADDD6' }
}[status] || { bg: '#EFF0EC', fg: '#5B615D', line: '#DADDD6' })
</script>

<template>
  <div style="min-height:100vh;background:#F5F6F4;color:#1C2321;font-family:'Noto Sans TC','PingFang TC',sans-serif;">
    <div
      style="height:6px;width:100%;background:repeating-linear-gradient(135deg,#1C2321 0 10px,#B4740E 10px 20px);"
    />

    <div style="max-width:420px;margin:0 auto;padding:16px 18px 40px;">
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 18px;">
        <div
          style="width:28px;height:28px;border-radius:8px;background:#C1272D;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;"
        >
          🧯
        </div>
        <span style="font-weight:700;">滅火器巡檢</span>
      </div>

      <p
        v-if="loading"
        style="text-align:center;color:#5B615D;padding:40px 0;"
      >
        載入中...
      </p>
      <p
        v-else-if="loadError"
        style="text-align:center;color:#C1272D;padding:40px 0;"
      >
        {{ loadError }}
      </p>

      <template v-else>
        <div
          v-if="extinguisher.active === false"
          style="display:flex;align-items:center;gap:6px;font-size:13px;color:#B4740E;font-weight:500;margin-bottom:16px;background:#FCF0D9;border:1px solid #EFC97C;border-radius:8px;padding:8px 12px;"
        >
          ⚠ 此滅火器已停用,以下僅顯示歷史紀錄
        </div>
        <div
          v-else
          style="display:flex;align-items:center;gap:6px;font-size:13px;color:#2F7D5C;font-weight:500;margin-bottom:16px;"
        >
          <span style="width:7px;height:7px;border-radius:50%;background:#2F7D5C;" />
          已掃描,連結至該滅火器
        </div>

        <div
          style="background:#fff;border:1px dashed #DADDD6;border-radius:12px;padding:14px 16px;margin-bottom:18px;font-family:'IBM Plex Mono',monospace;font-size:13px;"
        >
          <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span
              style="color:#5B615D;"
            >編號</span><span>{{ extinguisher.code }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span
              style="color:#5B615D;"
            >位置</span><span>{{ extinguisher.location }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span
              style="color:#5B615D;"
            >批號</span><span>{{ extinguisher.batchNo }}</span>
          </div>
        </div>

        <!-- 分頁切換：未登入、或滅火器已停用，都只有巡檢紀錄一個分頁 -->
        <div
          v-if="isLoggedIn && extinguisher.active !== false"
          style="display:flex;gap:6px;margin-bottom:16px;background:#EFF0EC;border-radius:10px;padding:4px;"
        >
          <button
            :style="{ flex: 1,
                      padding: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab==='history' ? '#fff' : 'transparent',
                      color: activeTab==='history' ? '#1C2321' : '#5B615D' }"
            @click="activeTab = 'history'"
          >
            巡檢紀錄
          </button>
          <button
            :style="{ flex: 1,
                      padding: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab==='inspect' ? '#fff' : 'transparent',
                      color: activeTab==='inspect' ? '#1C2321' : '#5B615D' }"
            @click="activeTab = 'inspect'"
          >
            填寫新檢查
          </button>
        </div>

        <!-- ── 巡檢紀錄(公開,不用登入) ── -->
        <template v-if="activeTab === 'history' || extinguisher.active === false">
          <p
            v-if="historyLoading"
            style="text-align:center;color:#5B615D;padding:20px 0;font-size:13px;"
          >
            載入紀錄中...
          </p>
          <p
            v-else-if="!history.length"
            style="text-align:center;color:#5B615D;padding:20px 0;font-size:13px;background:#fff;border:1px dashed #DADDD6;border-radius:12px;"
          >
            這支滅火器目前還沒有巡檢紀錄
          </p>
          <div
            v-for="log in history"
            v-else
            :key="log.id"
            style="background:#fff;border:1px solid #DADDD6;border-radius:12px;padding:14px 16px;margin-bottom:10px;"
          >
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#5B615D;">{{
                log.inspectedAt
              }}<span v-if="log.code && log.code !== extinguisher.code"> ・當時編號 {{ log.code }}</span></span>
              <span
                :style="{ fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 10px',
                          borderRadius: '999px',
                          background: statusColor(log.status).bg,
                          color: statusColor(log.status).fg,
                          border: '1px solid '+statusColor(log.status).line }"
              >{{ log.status }}</span>
            </div>
            <p
              v-if="log.note"
              style="font-size:13px;color:#1C2321;white-space:pre-line;margin:6px 0;"
            >
              {{
                log.note
              }}
            </p>
            <a
              v-if="log.photoUrl"
              :href="log.photoUrl"
              target="_blank"
              style="font-size:12px;color:#2563EB;text-decoration:underline;"
            >查看照片</a>
          </div>
        </template>

        <!-- ── 填寫新檢查(登入且滅火器仍在使用中才看得到) ── -->
        <template v-else-if="!submitted">
          <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px;">
            <svg
              width="120"
              height="70"
              viewBox="0 0 120 70"
            >
              <path
                d="M10 65 A50 50 0 0 1 110 65"
                fill="none"
                stroke="#DADDD6"
                stroke-width="10"
                stroke-linecap="round"
              />
              <path
                d="M10 65 A50 50 0 0 1 110 65"
                fill="none"
                :stroke="gaugeColor"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="157"
                :stroke-dashoffset="gaugeOffset"
                style="transition:stroke-dashoffset .3s,stroke .3s"
              />
            </svg>
            <div style="font-family:'Oswald',sans-serif;font-size:26px;font-weight:600;margin-top:-8px;">
              {{
                doneCount
              }}/{{ items.length }}
            </div>
            <div style="font-size:12px;color:#5B615D;">
              已完成檢查項目
            </div>
          </div>

          <div style="font-size:13px;color:#5B615D;margin:0 0 8px;font-weight:500;">
            檢查項目
          </div>
          <div
            v-for="i in items"
            :key="i"
            style="background:#fff;border:1px solid #DADDD6;border-radius:12px;padding:12px 14px;margin-bottom:10px;"
          >
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="font-size:14px;">{{ i }}</span>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                <button
                  :style="{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + (state[i]==='pass' ? '#9FCBB4' : '#DADDD6'), background: state[i]==='pass' ? '#E4F1EA' : '#fff', color: state[i]==='pass' ? '#2F7D5C' : '#5B615D' }"
                  @click="state[i] = 'pass'"
                >
                  正常
                </button>
                <button
                  :style="{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid ' + (state[i]==='fail' ? '#E7A6A2' : '#DADDD6'), background: state[i]==='fail' ? '#FBE8E7' : '#fff', color: state[i]==='fail' ? '#C1272D' : '#5B615D' }"
                  @click="state[i] = 'fail'"
                >
                  異常
                </button>
              </div>
            </div>
            <textarea
              v-if="state[i] === 'fail'"
              v-model="notes[i]"
              placeholder="請描述異常狀況(必填)"
              style="width:100%;margin-top:10px;border:1px solid #E7A6A2;border-radius:8px;padding:8px 10px;font-size:13px;resize:vertical;min-height:52px;background:#FBE8E7;font-family:inherit;color:#1C2321;"
            />
          </div>

          <div style="font-size:13px;color:#5B615D;margin:14px 0 8px;font-weight:500;">
            拍照佐證
          </div>
          <label
            style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:1px dashed #DADDD6;border-radius:12px;padding:26px;cursor:pointer;background:#fff;margin-bottom:22px;"
          >
            <template v-if="photoPreview">
              <img
                :src="photoPreview"
                style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;"
              >
            </template>
            <template v-else>
              <span style="font-size:22px;">📷</span>
              <span style="font-size:13px;color:#5B615D;">點擊拍攝壓力表與外觀</span>
            </template>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style="display:none"
              @change="onPhotoChange"
            >
          </label>

          <p style="font-size:12px;color:#5B615D;text-align:center;margin:-14px 0 14px;">
            檢查人：{{ inspectorName || '（未取得姓名）' }}
          </p>

          <p
            v-if="submitError"
            style="color:#C1272D;font-size:13px;text-align:center;margin-bottom:10px;"
          >
            {{ submitError }}
          </p>

          <button
            :disabled="!canSubmit || submitting"
            :style="{ width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      background: (!canSubmit || submitting) ? '#C9CCC6' : '#1C2321',
                      color: (!canSubmit || submitting) ? '#8B8E88' : '#fff',
                      cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }"
            @click="submit"
          >
            {{
              submitting ? '送出中...' : (canSubmit ? '送出檢查紀錄' : `送出檢查紀錄(${doneCount}/${items.length}${photoFile ? '' : ',尚未拍照'}${failWithoutNote ? ',請填寫異常說明' : ''})`)
            }}
          </button>
        </template>

        <div
          v-else
          style="text-align:center;padding:36px 10px;"
        >
          <div
            style="width:56px;height:56px;border-radius:50%;background:#E4F1EA;border:1px solid #9FCBB4;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:26px;color:#2F7D5C;"
          >
            ✓
          </div>
          <h3 style="font-family:'Oswald',sans-serif;font-size:18px;margin:0 0 6px;">
            檢查紀錄已送出
          </h3>
          <p style="font-size:13px;color:#5B615D;font-family:'IBM Plex Mono',monospace;margin:0 0 16px;">
            {{
              submitStamp
            }}
          </p>
          <button
            style="padding:8px 18px;border-radius:8px;border:1px solid #DADDD6;background:#fff;font-size:13px;cursor:pointer;color:#1C2321;"
            @click="resetForm"
          >
            回到巡檢紀錄
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
