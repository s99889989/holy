<script setup>
import { ref, computed } from 'vue'
import { herbSections } from '~/composables/useHerbsData'

const BASE_URL = 'https://www.smhealthfarm.com.tw/front/herbs/'
const PER_PAGE = 8  // 4欄 × 2列

const qty = ref({})
herbSections.forEach(section => {
  section.herbs.forEach(herb => { qty.value[herb.name] = 0 })
})

const totalCount = computed(() =>
    Object.values(qty.value).reduce((a, b) => a + b, 0)
)
const totalPages = computed(() => Math.ceil(totalCount.value / PER_PAGE))

function changeQty(name, delta) {
  qty.value[name] = Math.max(0, Math.min(99, (qty.value[name] || 0) + delta))
}

function clearAll() {
  Object.keys(qty.value).forEach(k => { qty.value[k] = 0 })
  sheets.value = []
}

// ── 預覽資料 ──
const sheets = ref([])   // [[ { name, qrDataUrl } | null, ... ], ...]
const generating = ref(false)

async function generate() {
  generating.value = true
  sheets.value = []

  const { default: QRCode } = await import('qrcode')

  const labels = []
  herbSections.forEach(section => {
    section.herbs.forEach(herb => {
      for (let i = 0; i < (qty.value[herb.name] || 0); i++) labels.push(herb.name)
    })
  })

  const pages = []
  for (let p = 0; p < Math.ceil(labels.length / PER_PAGE); p++) {
    const pageLabels = labels.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
    const cells = await Promise.all(
        pageLabels.map(async name => {
          const url = BASE_URL + encodeURIComponent(name)
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#ffffff' }
          })
          return { name, qrDataUrl }
        })
    )
    while (cells.length < PER_PAGE) cells.push(null)
    pages.push(cells)
  }

  sheets.value = pages
  generating.value = false
}

// ── 用 iframe 列印，完全不受 scoped style 干擾 ──
function printViaIframe() {
  // 組出每頁的格子 HTML
  const pagesHtml = sheets.value.map(page => {
    const cellsHtml = page.map(cell => {
      if (!cell) return `<div class="label-cell empty"></div>`
      return `
        <div class="label-cell">
          <img class="label-qr" src="${cell.qrDataUrl}" alt="${cell.name}" />
          <div class="label-text">${cell.name}</div>
        </div>`
    }).join('')
    return `<div class="a4-page">${cellsHtml}</div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: A4 landscape; margin: 0; }

  body { background: #fff; }

  .a4-page {
    width: 297mm;
    height: 210mm;
    padding: 5mm;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 100mm);
    gap: 0;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
  }

  .label-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 0.5px dashed #bbb;
    padding: 3mm 3mm 4mm;
    gap: 2mm;
    overflow: hidden;
  }
  .label-cell.empty { border-color: transparent; }

  .label-qr {
    width: 54mm;
    height: 54mm;
    object-fit: contain;
    display: block;
  }

  .label-text {
    font-family: 'Noto Serif TC', 'Songti TC', serif;
    font-size: 18pt;
    font-weight: 700;
    color: #000;
    text-align: center;
    letter-spacing: 0.08em;
    line-height: 1.3;
  }
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()

  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    // 列印對話框關閉後移除 iframe
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }
}
</script>

<template>
  <div class="lp-wrap">

    <!-- 側邊欄 -->
    <aside class="lp-sidebar">
      <div class="lp-sidebar-head">
        <h1 class="lp-title">🌿 植物標籤列印</h1>
        <p class="lp-sub">每張約 71 × 66 mm，每頁 A4 橫排 8 張</p>
      </div>

      <div class="lp-plant-list">
        <template v-for="section in herbSections" :key="section.key">
          <div class="lp-section-label">{{ section.icon }} {{ section.label }}</div>
          <div v-for="herb in section.herbs" :key="herb.name" class="lp-row">
            <span class="lp-herb-name">{{ herb.name }}</span>
            <div class="lp-qty">
              <button class="lp-btn" @click="changeQty(herb.name, -1)">−</button>
              <input
                  class="lp-input"
                  type="number" min="0" max="99"
                  :value="qty[herb.name]"
                  @change="qty[herb.name] = Math.max(0, Math.min(99, parseInt($event.target.value) || 0))"
              />
              <button class="lp-btn" @click="changeQty(herb.name, 1)">+</button>
            </div>
          </div>
        </template>
      </div>

      <div class="lp-footer">
        <div class="lp-count-info">
          已選 <strong>{{ totalCount }}</strong> 張，共 <strong>{{ totalPages }}</strong> 頁
        </div>
        <!-- 產生預覽 -->
        <button
            class="lp-btn-generate"
            :disabled="totalCount === 0 || generating"
            @click="generate"
        >
          {{ generating ? '產生中…' : '產生預覽' }}
        </button>
        <!-- 列印（只在有預覽時顯示） -->
        <button
            v-if="sheets.length > 0"
            class="lp-btn-print"
            @click="printViaIframe"
        >
          🖨️ 列印
        </button>
        <button class="lp-btn-clear" @click="clearAll">清除全部</button>
      </div>
    </aside>

    <!-- 空白提示 -->
    <main class="lp-preview" v-if="sheets.length === 0 && !generating">
      <div class="lp-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3d7a52" stroke-width="1.2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M14 14h2v2h-2zM16 16h2v2h-2zM14 18v2M18 14v2M18 18h2"/>
        </svg>
        <p>設定每種植物的數量<br>點「產生預覽」確認後再列印</p>
      </div>
    </main>

    <!-- 螢幕預覽（僅供確認，不會直接列印） -->
    <div class="lp-sheets-area" v-if="sheets.length > 0">
      <div v-for="(page, pi) in sheets" :key="pi" class="a4-page">
        <div
            v-for="(cell, ci) in page"
            :key="ci"
            class="label-cell"
            :class="{ empty: !cell }"
        >
          <template v-if="cell">
            <img class="label-qr" :src="cell.qrDataUrl" :alt="`${cell.name} QR Code`" />
            <div class="label-text">{{ cell.name }}</div>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.lp-wrap {
  display: flex;
  min-height: 100vh;
  background: #f4f9f2;
}

/* ── 側邊欄 ── */
.lp-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #d4e8cd;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow: hidden;
}
.lp-sidebar-head {
  padding: 1.25rem 1rem 0.75rem;
  border-bottom: 1px solid #e8f0eb;
}
.lp-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a3d28;
  margin: 0 0 0.2rem;
}
.lp-sub {
  font-size: 0.73rem;
  color: #6a8e63;
  margin: 0;
}
.lp-plant-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
}
.lp-section-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #6a8e63;
  padding: 0.75rem 0 0.25rem;
  border-bottom: 1px solid #e8f0eb;
  margin-bottom: 0.35rem;
}
.lp-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.28rem 0.3rem;
  border-radius: 6px;
  transition: background 0.12s;
}
.lp-row:hover { background: #f0f8ec; }
.lp-herb-name { flex: 1; font-size: 0.84rem; color: #1a3d28; }
.lp-qty { display: flex; align-items: center; gap: 3px; }
.lp-btn {
  width: 22px; height: 22px;
  border-radius: 4px;
  border: 1px solid #c5d4be;
  background: transparent;
  color: #3d7a52;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s;
  flex-shrink: 0;
}
.lp-btn:hover { background: #e8f5e9; }
.lp-input {
  width: 38px;
  text-align: center;
  border: 1px solid #c5d4be;
  border-radius: 4px;
  font-size: 0.8rem;
  padding: 2px 0;
  color: #1a3d28;
  background: #f8faf7;
}
.lp-input:focus { outline: none; border-color: #3d7a52; }
.lp-input::-webkit-inner-spin-button,
.lp-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.lp-input { -moz-appearance: textfield; }

.lp-footer {
  padding: 0.875rem 1rem;
  border-top: 1px solid #d4e8cd;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lp-count-info { font-size: 0.78rem; color: #6a8e63; text-align: center; }
.lp-count-info strong { color: #1a3d28; }

.lp-btn-generate {
  background: #3d7a52;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.65rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.lp-btn-generate:hover:not(:disabled) { background: #2d5e3e; }
.lp-btn-generate:disabled { background: #a8c5b0; cursor: default; }

.lp-btn-print {
  background: #1a5c8a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.65rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.lp-btn-print:hover { background: #134870; }

.lp-btn-clear {
  background: transparent;
  color: #8a9e84;
  border: 1px solid #c5d4be;
  border-radius: 8px;
  padding: 0.4rem;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.12s;
}
.lp-btn-clear:hover { background: #fdecea; color: #b71c1c; border-color: #e8a0a0; }

/* ── 空白提示 ── */
.lp-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #8a9e84;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.7;
  opacity: 0.7;
}

/* ── 螢幕預覽區 ── */
.lp-sheets-area {
  flex: 1;
  padding: 1.5rem;
  overflow-x: auto;
}

.a4-page {
  width: 297mm;
  height: 210mm;
  padding: 5mm;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 100mm);
  gap: 0;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin: 0 auto 1.5rem;
  overflow: hidden;
  box-sizing: border-box;
}

.label-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0.5px dashed #b0c8a8;
  padding: 3mm 3mm 4mm;
  gap: 2mm;
  box-sizing: border-box;
  overflow: hidden;
}
.label-cell.empty { border-color: #e4ede1; }

.label-qr {
  width: 54mm;
  height: 54mm;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.label-text {
  font-family: 'Noto Serif TC', 'Songti TC', '宋體', serif;
  font-size: 16pt;
  font-weight: 700;
  color: #000;
  text-align: center;
  letter-spacing: 0.08em;
  line-height: 1.3;
}

/* 列印時完全隱藏頁面，由 iframe 負責 */
@media print {
  * { display: none !important; }
}

@media (max-width: 768px) {
  .lp-wrap { flex-direction: column; }
  .lp-sidebar { width: 100%; height: auto; position: static; }
  .lp-sheets-area { padding: 0.75rem; }
  .a4-page {
    width: 100%;
    height: auto;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
  .label-cell { height: auto; min-height: 40vw; padding: 2vw; gap: 1.5vw; }
  .label-qr { width: 24vw; height: 24vw; }
  .label-text { font-size: 4vw; }
}
</style>