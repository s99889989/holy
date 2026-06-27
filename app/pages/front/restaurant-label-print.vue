<script setup>
import { ref, computed } from 'vue'
import { labelSections, allLabels } from '~/composables/useRestaurantLabels'

definePageMeta({ layout: false })

// ── 勾選控制 ──
const selected = ref(new Set(allLabels.map((_, i) => i)))

function toggleItem(idx) {
  if (selected.value.has(idx)) selected.value.delete(idx)
  else selected.value.add(idx)
  selected.value = new Set(selected.value)
}

function toggleSection(section) {
  const indices = sectionIndices(section)
  const allOn = indices.every(i => selected.value.has(i))
  const next = new Set(selected.value)
  indices.forEach(i => allOn ? next.delete(i) : next.add(i))
  selected.value = next
}

function sectionIndices(section) {
  const base = labelSections.slice(0, labelSections.indexOf(section))
      .reduce((a, s) => a + s.items.length, 0)
  return section.items.map((_, i) => base + i)
}

const selectedLabels = computed(() =>
    allLabels.filter((_, i) => selected.value.has(i))
)

// ── tag 顏色 ──
function tagColor(tag) {
  if (!tag) return ''
  if (tag === '葷' || tag === '非常辣') return 'red'
  if (tag === '素' || tag === '天然微甜') return 'green'
  return 'orange'
}

function enTagColor(enTag) {
  if (!enTag) return ''
  if (enTag === 'Non-Veg' || enTag === 'Spicy') return 'red'
  if (enTag === 'Vegan' || enTag === 'Naturally Sweetened') return 'green'
  return 'orange'
}

// ── 產生 .docx ──
const generating = ref(false)
const genStatus = ref('')
const genMessage = ref('')

async function generateDocx() {
  const selections = selectedLabels.value.map(item => ({
    zh: item.zh,
    zh_tag: item.tag ? `(${item.tag})` : '',
    en: item.en,
    en_tag: item.enTag ? `(${item.enTag})` : '',
    count: 1,
  }))
  if (!selections.length) return

  generating.value = true
  genStatus.value = ''
  genMessage.value = ''

  try {
    const res = await fetch('/holy/cards/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(selections),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw new Error(msg || `HTTP ${res.status}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `桌牌_${new Date().toISOString().slice(0, 10)}.docx`
    a.click()
    URL.revokeObjectURL(url)
    genStatus.value = 'ok'
    genMessage.value = '✅ 檔案已下載！'
  } catch (e) {
    genStatus.value = 'error'
    genMessage.value = '❌ 產生失敗：' + (e?.message || '未知錯誤')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="rl-wrap">

    <!-- 側邊控制欄 -->
    <aside class="rl-sidebar">
      <div class="rl-sidebar-head">
        <img src="/images/other/holy_logo.jpg" alt="聖母農莊" class="rl-logo"/>
        <h1 class="rl-title">餐廳標籤桌牌</h1>
        <p class="rl-sub">勾選後產生 .docx，每頁 3 張 A4 橫向</p>
      </div>

      <div class="rl-list">
        <template v-for="section in labelSections" :key="section.key">
          <div class="rl-section-head">
            <button class="rl-section-toggle" @click="toggleSection(section)">
              {{ sectionIndices(section).every(i => selected.has(i)) ? '☑' : '☐' }}
            </button>
            <span class="rl-section-label">{{ section.label }}</span>
          </div>
          <label
              v-for="(item, j) in section.items"
              :key="j"
              class="rl-item"
          >
            <input
                type="checkbox"
                :checked="selected.has(labelSections.slice(0, labelSections.indexOf(section)).reduce((a,s)=>a+s.items.length,0) + j)"
                @change="toggleItem(labelSections.slice(0, labelSections.indexOf(section)).reduce((a,s)=>a+s.items.length,0) + j)"
            />
            <span class="rl-item-zh">{{ item.zh }}<span v-if="item.tag" class="rl-item-tag" :class="tagColor(item.tag)">（{{
                item.tag
              }}）</span></span>
          </label>
        </template>
      </div>

      <div class="rl-footer">
        <div class="rl-count">已選 <strong>{{ selectedLabels.length }}</strong> 張</div>
        <div v-if="genMessage" class="rl-status" :class="genStatus">{{ genMessage }}</div>
        <button
            class="rl-btn-print"
            :disabled="selectedLabels.length === 0 || generating"
            @click="generateDocx"
        >
          <span v-if="generating">⏳ 產生中…</span>
          <span v-else>📄 產生 .docx</span>
        </button>
      </div>
    </aside>

    <!-- 預覽區 -->
    <main class="rl-preview">
      <div
          v-for="(item, i) in selectedLabels"
          :key="i"
          class="label-card"
      >
        <div class="lc-header">
          <img src="/images/other/holy_logo.jpg" alt="聖母農莊" class="lc-logo"/>
          <div class="lc-brand">
            <div class="lc-brand-zh">台東聖母健康農莊</div>
            <div class="lc-brand-en">TAITUNG ST. MARY'S HEALTH FARM</div>
          </div>
        </div>
        <div class="lc-body">
          <div class="lc-zh">
            {{ item.zh }}<span v-if="item.tag" class="lc-tag" :class="tagColor(item.tag)">（{{ item.tag }}）</span>
          </div>
          <div class="lc-en">
            {{ item.en }}<span v-if="item.enTag" class="lc-en-tag" :class="enTagColor(item.enTag)"> ({{
              item.enTag
            }})</span>
          </div>
        </div>
        <div class="lc-footer">
          <div class="lc-footer-zh">從土壤到餐桌～祝您用餐愉快</div>
          <div class="lc-footer-en">From soil to table ~ Wish you a pleasant meal</div>
        </div>
      </div>

      <div v-if="selectedLabels.length === 0" class="rl-empty">
        請從左側勾選要產生的標籤
      </div>
    </main>

  </div>
</template>

<style scoped>
.rl-wrap {
  display: flex;
  min-height: 100vh;
  background: #f5f0eb;
  font-family: 'Noto Serif TC', 'Songti TC', serif;
}

/* ── 側邊欄 ── */
.rl-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: hidden;
}

.rl-sidebar-head {
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.rl-logo {
  height: 36px;
  object-fit: contain;
}

.rl-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #4a2c00;
  margin: 0;
}

.rl-sub {
  font-size: 0.68rem;
  color: #999;
  margin: 0;
  font-family: sans-serif;
}

.rl-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
}

.rl-section-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0 0.2rem;
  border-bottom: 1px solid #e8e0d8;
  margin-bottom: 0.25rem;
}

.rl-section-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  color: #7a5c2e;
}

.rl-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7a5c2e;
  font-family: sans-serif;
}

.rl-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.22rem 0.3rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #2a1a00;
}

.rl-item:hover {
  background: #fdf6ee;
}

.rl-item input {
  cursor: pointer;
  accent-color: #7a5c2e;
}

.rl-item-tag.red {
  color: #c0392b;
}

.rl-item-tag.green {
  color: #2e7d32;
}

.rl-item-tag.orange {
  color: #d4700a;
}

.rl-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e8e0d8;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rl-count {
  font-size: 0.78rem;
  color: #999;
  text-align: center;
  font-family: sans-serif;
}

.rl-count strong {
  color: #4a2c00;
}

.rl-status {
  font-size: 0.75rem;
  text-align: center;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  font-family: sans-serif;
}

.rl-status.ok {
  background: #edf7f0;
  color: #2e7d32;
}

.rl-status.error {
  background: #fdf0ef;
  color: #c0392b;
}

.rl-btn-print {
  background: #7a2424;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: sans-serif;
}

.rl-btn-print:hover:not(:disabled) {
  background: #5c1a1a;
}

.rl-btn-print:disabled {
  background: #ccc;
  cursor: default;
}

/* ── 預覽區 ── */
.rl-preview {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-content: flex-start;
}

.rl-empty {
  width: 100%;
  text-align: center;
  margin-top: 4rem;
  color: #bbb;
  font-size: 0.9rem;
  font-family: sans-serif;
}

/* ── 標籤卡 ── */
.label-card {
  width: 8.9cm;
  height: 5.9cm;
  background: #fff;
  border: 0.5px solid #ccc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.lc-header {
  display: flex;
  align-items: center;
  gap: 0.35cm;
  padding: 0.22cm 0.3cm 0.15cm;
  border-bottom: 1.5px solid #e8c87a;
  flex-shrink: 0;
}

.lc-logo {
  height: 0.85cm;
  object-fit: contain;
  flex-shrink: 0;
}

.lc-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lc-brand-zh {
  font-size: 8.5pt;
  font-weight: 700;
  color: #2e6b32;
  line-height: 1.2;
  letter-spacing: 0.04em;
}

.lc-brand-en {
  font-size: 5pt;
  color: #888;
  letter-spacing: 0.06em;
  font-family: 'Arial Narrow', Arial, sans-serif;
  line-height: 1.3;
}

.lc-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 0.35cm;
  gap: 0.05cm;
}

.lc-zh {
  font-size: 22pt;
  font-weight: 900;
  color: #1a1200;
  line-height: 1.1;
  letter-spacing: 0.04em;
}

.lc-tag.red {
  color: #c0392b;
}

.lc-tag.green {
  color: #2e7d32;
}

.lc-tag.orange {
  color: #d4700a;
}

.lc-en {
  font-size: 9pt;
  font-weight: 700;
  color: #2a1a00;
  font-family: 'Arial Narrow', Arial, sans-serif;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.lc-en-tag.red {
  color: #c0392b;
}

.lc-en-tag.green {
  color: #2e7d32;
}

.lc-en-tag.orange {
  color: #d4700a;
}

.lc-footer {
  background: #c0392b;
  color: #fff;
  text-align: center;
  padding: 0.1cm 0.2cm;
  flex-shrink: 0;
}

.lc-footer-zh {
  font-size: 7.5pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.4;
}

.lc-footer-en {
  font-size: 5.5pt;
  letter-spacing: 0.04em;
  font-family: 'Arial Narrow', Arial, sans-serif;
  opacity: 0.9;
}
</style>