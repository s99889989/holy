<script setup>
definePageMeta({ layout: false })
useSiteHead({
  title: '豆製品訂購 | 台東聖母健康農莊',
  description: '聖母健康農莊每週二、四新鮮現做豆漿與豆腐，歡迎線上預訂。',
  ogTitle: '豆製品訂購 | 台東聖母健康農莊',
  ogDescription: '聖母健康農莊每週二、四新鮮現做豆漿與豆腐，歡迎線上預訂。',
  ogImage: 'https://holymotherfarm.netlify.app/images/order/soybeans_og.jpg',
  twitterImage: 'https://holymotherfarm.netlify.app/images/order/soybeans_og.jpg',
  ogUrl: 'https://holymotherfarm.netlify.app/front/order/soybeans',
})

import { ref, computed } from 'vue'

// ── 日期工具 ────────────────────────────────────────────────────
function getNext(dow) {
  const now = new Date(), d = now.getDay()
  const diff = ((dow - d + 7) % 7) || 7
  const n = new Date(now)
  n.setDate(now.getDate() + diff)
  return n
}
function fmt(d) { return `${d.getMonth() + 1}月${d.getDate()}日` }

const tueDateStr = fmt(getNext(2))
const friDateStr = fmt(getNext(5))

// ── 狀態 ────────────────────────────────────────────────────────
const selDay = ref('tue')
const name   = ref('')
const remark = ref('')
const tofuQty = ref(0)

// 尺寸清單（固定，不依賴 client）
const soymilkQty = ref(0)
// 名稱建議
// 名稱建議
const knownNames = ref([])
const suggestions = ref([])
const showSuggest = ref(false)

// 聯絡方式
const contact = ref('')

// 送出成功 modal
const successModal = ref(false)
const successMsg = ref('')

// ── localStorage ────────────────────────────────────────────────
function adjSoy(delta) {
  soymilkQty.value = Math.max(0, soymilkQty.value + delta)
}

function adjTofu(delta) {
  tofuQty.value = Math.max(0, tofuQty.value + delta)
}

// ── 名稱建議 ────────────────────────────────────────────────────
function onNameInput(v) {
  if (!v) { showSuggest.value = false; return }
  const m = knownNames.value.filter(n => n.includes(v) && n !== v)
  suggestions.value = m.slice(0, 5)
  showSuggest.value = m.length > 0
}
function pickName(n) { name.value = n; showSuggest.value = false }

// ── 摘要計算 ────────────────────────────────────────────────────
const hasOrder = computed(() => soymilkQty.value > 0 || tofuQty.value > 0)
const dayLabel = computed(() => selDay.value === 'tue' ? `週二 ${tueDateStr}` : `週五 ${friDateStr}`)
const totalPrice = computed(() => soymilkQty.value * 50 + tofuQty.value * 50)

// ── 送出 ────────────────────────────────────────────────────────
function doSubmit() {
  if (!name.value.trim()) { alert('請輸入姓名'); return }
  if (!contact.value.trim()) { alert('請輸入聯絡方式'); return }
  if (!hasOrder.value) { alert('請選擇豆漿規格或豆腐數量'); return }

  // 記住姓名
  try {
    const names = knownNames.value
    if (!names.includes(name.value)) {
      names.unshift(name.value)
      if (names.length > 30) names.pop()
      localStorage.setItem('sm_names', JSON.stringify(names))
    }
  } catch {}

  const contactStr = contact.value.trim()
  let msg = `訂購人：${name.value}　聯絡：${contactStr}　取貨日：${dayLabel.value}\n\n`
  if (soymilkQty.value) msg += `豆漿 800cc × ${soymilkQty.value} 袋\n`
  if (tofuQty.value) msg += `豆腐 × ${tofuQty.value} 塊\n`
  if (remark.value.trim()) msg += `\n備註：${remark.value.trim()}`
  msg += `\n\n合計：$${totalPrice.value}`

  successMsg.value = msg
  successModal.value = true
}
</script>

<template>
  <div class="sb-page">

    <!-- Header -->
    <div class="sb-header">
      <div class="sb-header__inner">
        <NuxtLink to="/" class="sb-header__logo">
          <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊" class="sb-header__logo-img" />
        </NuxtLink>
        <div class="sb-header__text">
          <h1 class="sb-header__title">豆製品訂購</h1>
          <p class="sb-header__sub">每週二、四新鮮現做・豆漿與豆腐</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="sb-wrap">

      <!-- 提醒 -->
      <div class="sb-notice sb-notice--warn">
        <svg xmlns="http://www.w3.org/2000/svg" class="sb-notice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        豆子需提前一天浸泡，請盡早完成訂購，以便我們準備。
      </div>
      <!-- 取貨日 tabs -->
      <div class="sb-day-tabs">
        <button
            class="sb-day-tab"
            :class="{ active: selDay === 'tue' }"
            @click="selDay = 'tue'"
        >
          <span class="sb-day-tab__label">週二</span>
          <span class="sb-day-tab__date">{{ tueDateStr }}</span>
        </button>
        <button
            class="sb-day-tab"
            :class="{ active: selDay === 'fri' }"
            @click="selDay = 'fri'"
        >
          <span class="sb-day-tab__label">週五</span>
          <span class="sb-day-tab__date">{{ friDateStr }}</span>
        </button>
      </div>

      <!-- 訂購人卡片 -->
      <div class="sb-card">
        <div class="sb-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          訂購人
        </div>
        <div class="sb-field">
          <label>姓名 <span class="sb-required">*</span></label>
          <div class="sb-field__suggest-wrap">
            <input
                v-model="name"
                type="text"
                placeholder="請輸入姓名"
                autocomplete="off"
                @input="onNameInput(name)"
                @blur="setTimeout(() => showSuggest = false, 150)"
            />
            <div v-if="showSuggest" class="sb-suggest">
              <div
                  v-for="n in suggestions"
                  :key="n"
                  class="sb-suggest__item"
                  @mousedown.prevent="pickName(n)"
              >{{ n }}</div>
            </div>
          </div>
        </div>
        <div class="sb-field">
          <label>聯絡方式（電話／農莊分機）<span class="sb-required">*</span></label>
          <input
              v-model="contact"
              type="tel"
              placeholder="例：0912-345-678 或分機 888"
              autocomplete="off"
          />
        </div>
        <div class="sb-field">
          <label>備註（選填）</label>
          <textarea v-model="remark" placeholder="例如：取貨時間、特殊需求" rows="2"></textarea>
        </div>
      </div>

      <!-- 豆漿卡片 -->
      <div class="sb-card">
        <div class="sb-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          豆漿
        </div>
        <div class="sb-order-rows">
          <div class="sb-order-row">
            <div class="sb-order-row__label">
              豆漿 800cc
              <span class="sb-order-row__sub">$50／袋</span>
            </div>
            <div class="sb-qty-ctrl">
              <button @click="adjSoy(-1)">−</button>
              <input
                  type="number"
                  :value="soymilkQty"
                  min="0"
                  @input="soymilkQty = Math.max(0, parseInt($event.target.value) || 0)"
              />
              <button @click="adjSoy(1)">+</button>
            </div>
          </div>
        </div>
        <p class="sb-price-note">$50／袋（800cc）</p>
      </div>

      <!-- 豆腐卡片 -->
      <div class="sb-card">
        <div class="sb-card__title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          豆腐
        </div>
        <div class="sb-order-rows">
          <div class="sb-order-row">
            <div class="sb-order-row__label">
              豆腐
              <span class="sb-order-row__sub">$50／塊</span>
            </div>
            <div class="sb-qty-ctrl">
              <button @click="adjTofu(-1)">−</button>
              <input
                  type="number"
                  :value="tofuQty"
                  min="0"
                  @input="tofuQty = Math.max(0, parseInt($event.target.value) || 0)"
              />
              <button @click="adjTofu(1)">+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 摘要 -->
      <div v-if="hasOrder" class="sb-summary">
        <div v-if="soymilkQty" class="sb-summary__row">
          <span>豆漿 800cc × {{ soymilkQty }} 袋</span>
          <span>${{ soymilkQty * 50 }}</span>
        </div>
        <div v-if="tofuQty" class="sb-summary__row">
          <span>豆腐 × {{ tofuQty }} 塊</span>
          <span>${{ tofuQty * 50 }}</span>
        </div>
        <div class="sb-summary__row sb-summary__row--total">
          <span>合計</span>
          <span>${{ totalPrice }}</span>
        </div>
        <div class="sb-summary__row">
          <span>取貨日</span>
          <span>{{ dayLabel }}</span>
        </div>
      </div>

      <!-- 送出 -->
      <button class="sb-submit" @click="doSubmit">確認送出訂單</button>

    </div><!-- /sb-wrap -->

    <!-- 送出成功 Modal -->
    <Teleport to="body">
      <Transition name="sb-modal-fade">
        <div v-if="successModal" class="sb-modal-backdrop" @click.self="successModal = false">
          <div class="sb-modal sb-modal--success">
            <div class="sb-modal__success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 class="sb-modal__title">訂單已送出！</h3>
            <pre class="sb-modal__content">{{ successMsg }}</pre>
            <div class="sb-modal__btns">
              <button class="confirm" @click="successModal = false; name = ''; contact = ''; remark = ''; soymilkQty = 0; tofuQty = 0">確認</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Page ── */
.sb-page {
  min-height: 100vh;
  background: #f4f7f2;
  font-family: 'Noto Sans TC', sans-serif;
}

/* ── Header ── */
.sb-header {
  background: linear-gradient(135deg, #2d5a3d 0%, #1a3d28 100%);
  padding: 1.25rem 1.5rem;
}
.sb-header__inner {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.sb-header__logo-img {
  height: 44px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.sb-header__text { flex: 1; }
.sb-header__title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 2px;
}
.sb-header__sub {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.65);
  margin: 0;
}

/* ── Wrap ── */
.sb-wrap {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

/* ── Notice ── */
.sb-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 0.75rem;
  line-height: 1.55;
}
.sb-notice--warn { background: #fff8e6; border: 1px solid #f0d080; color: #7a5800; }
.sb-notice--info { background: #e8f4f0; border: 1px solid #b0d8cc; color: #1a5c48; }
.sb-notice__icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

/* ── Day Tabs ── */
.sb-day-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 1.25rem;
}
.sb-day-tab {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #d0daca;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: all .15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.sb-day-tab.active { border-color: #3d7a52; background: #f0f9f4; }
.sb-day-tab__label { font-size: 15px; font-weight: 500; color: #2a2e25; }
.sb-day-tab__date  { font-size: 11px; color: #8a9e84; }
.sb-day-tab.active .sb-day-tab__label { color: #1a5c3a; }

/* ── Card ── */
.sb-card {
  background: #fff;
  border: 1px solid #dce8d8;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  margin-bottom: 1rem;
}
.sb-card__title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 600;
  color: #1a3d28;
  margin-bottom: 1rem;
  font-family: 'Noto Serif TC', serif;
}
.sb-card__title svg { width: 18px; height: 18px; color: #3d7a52; flex-shrink: 0; }

/* ── Field ── */
.sb-field { margin-bottom: 1rem; }
.sb-field:last-child { margin-bottom: 0; }
.sb-field label { display: block; font-size: 13px; color: #5a6e54; margin-bottom: 5px; font-weight: 500; }
.sb-field input[type=text],
.sb-field input[type=tel],
.sb-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #c5d4be;
  border-radius: 8px;
  font-size: 14px;
  background: #fafcf9;
  color: #2a2e25;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.sb-field input[type=text]:focus,
.sb-field input[type=tel]:focus,
.sb-field textarea:focus { border-color: #3d7a52; }
.sb-field textarea { resize: none; }
.sb-required { color: #c0392b; }

/* ── Suggest ── */
.sb-field__suggest-wrap { position: relative; }
.sb-suggest {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #c5d4be;
  border-radius: 8px;
  margin-top: 3px;
  z-index: 50;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.sb-suggest__item {
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  color: #2a2e25;
  border-bottom: 1px solid #eef2ec;
  transition: background 0.12s;
}
.sb-suggest__item:last-child { border-bottom: none; }
.sb-suggest__item:hover { background: #f0f9f4; }

/* ── Size Grid ── */
.sb-size-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.sb-size-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border: 1.5px solid #c5d4be;
  border-radius: 8px;
  background: #fafcf9;
  cursor: pointer;
  font-size: 14px;
  color: #3a4e36;
  font-family: inherit;
  transition: all .15s;
}
.sb-size-chip.selected { border-color: #3d7a52; background: #f0f9f4; color: #1a5c3a; font-weight: 600; }
.sb-size-chip--add { display: none; }

/* ── Contact ── */
.sb-contact-type {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.sb-contact-btn {
  flex: 1;
  padding: 7px;
  border: 1.5px solid #c5d4be;
  border-radius: 8px;
  background: #fafcf9;
  color: #5a6e54;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all .15s;
}
.sb-contact-btn.active {
  border-color: #3d7a52;
  background: #f0f9f4;
  color: #1a5c3a;
  font-weight: 600;
}
.sb-contact-input-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #c5d4be;
  border-radius: 8px;
  overflow: hidden;
  background: #fafcf9;
}
.sb-contact-prefix {
  padding: 8px 10px;
  font-size: 13px;
  color: #8a9e84;
  background: #f0f4ee;
  border-right: 1px solid #c5d4be;
  white-space: nowrap;
  flex-shrink: 0;
}
.sb-contact-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #2a2e25;
  font-family: inherit;
  outline: none;
  min-width: 0;
}
.sb-chip-icon { width: 13px; height: 13px; flex-shrink: 0; }
.sb-chip-sub { font-size: 11px; opacity: 0.7; }

/* ── Order Rows ── */
.sb-order-rows { display: flex; flex-direction: column; gap: 8px; }
.sb-order-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f4f9f2;
  border-radius: 8px;
}
.sb-order-row__label { flex: 1; font-size: 14px; color: #2a2e25; }
.sb-order-row__sub { display: block; font-size: 12px; color: #8a9e84; margin-top: 2px; }
.sb-empty-hint { font-size: 13px; color: #aab8a6; padding: 4px 0; }
.sb-price-note { font-size: 12px; color: #8a9e84; margin-top: 10px; margin-bottom: 0; }

/* ── Qty Ctrl ── */
.sb-qty-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sb-qty-ctrl button {
  width: 30px;
  height: 30px;
  border: 1.5px solid #c5d4be;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
  font-size: 17px;
  color: #3a4e36;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.sb-qty-ctrl button:hover { background: #f0f9f4; }
.sb-qty-ctrl input {
  width: 46px;
  text-align: center;
  padding: 4px 2px;
  border: 1.5px solid #c5d4be;
  border-radius: 7px;
  font-size: 14px;
  background: #fff;
  color: #2a2e25;
  font-family: inherit;
}

/* ── Summary ── */
.sb-summary {
  background: #fff;
  border: 1px solid #dce8d8;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 1rem;
}
.sb-summary__row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 3px 0;
  color: #5a6e54;
}
.sb-summary__row--total {
  font-size: 14px;
  font-weight: 600;
  color: #1a3d28;
  border-top: 1px solid #dce8d8;
  margin-top: 6px;
  padding-top: 8px;
}

/* ── Submit ── */
.sb-submit {
  width: 100%;
  padding: 13px;
  background: #3d7a52;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.18s;
}
.sb-submit:hover { background: #2a5c3a; }

/* ── Modal ── */
.sb-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}
.sb-modal {
  background: #fff;
  border-radius: 14px;
  padding: 1.5rem;
  width: 280px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
.sb-modal--success { width: 320px; text-align: center; }
.sb-modal__title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3d28;
  margin: 0 0 1rem;
  font-family: 'Noto Serif TC', serif;
}
.sb-modal__input {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #c5d4be;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 6px;
  font-family: inherit;
  outline: none;
}
.sb-modal__input:focus { border-color: #3d7a52; }
.sb-modal__hint { font-size: 12px; color: #8a9e84; margin-bottom: 12px; }
.sb-modal__content {
  font-size: 13px;
  color: #3a4e36;
  background: #f4f9f2;
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
  text-align: left;
  margin: 0 0 1rem;
  line-height: 1.7;
  font-family: inherit;
}
.sb-modal__success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e8f5ee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}
.sb-modal__success-icon svg { width: 26px; height: 26px; color: #3d7a52; }
.sb-modal__btns { display: flex; gap: 8px; }
.sb-modal__btns button {
  flex: 1;
  padding: 9px;
  border: 1.5px solid #c5d4be;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  background: #fafcf9;
  color: #3a4e36;
  font-family: inherit;
  transition: background 0.15s;
}
.sb-modal__btns button.confirm {
  background: #3d7a52;
  color: #fff;
  border-color: #3d7a52;
}
.sb-modal__btns button.confirm:hover { background: #2a5c3a; }

/* ── Transitions ── */
.sb-modal-fade-enter-active, .sb-modal-fade-leave-active { transition: opacity 0.2s; }
.sb-modal-fade-enter-from, .sb-modal-fade-leave-to { opacity: 0; }
</style>