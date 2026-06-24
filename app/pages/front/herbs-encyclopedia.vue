<script setup>
definePageMeta({ layout: 'front' })
useSiteHead()

import { ref, computed } from 'vue'
import { herbSections, tagColor } from '~/composables/useHerbsData'

const sections = herbSections

const activeSection = ref('production-area')
const search = ref('')
const activeTag = ref('')
const modal = ref(null)

const currentSection = computed(() => sections.find(s => s.key === activeSection.value))
const currentTags = computed(() => currentSection.value.tags)

const filtered = computed(() => {
  const herbs = currentSection.value.herbs
  return herbs.filter(h => {
    const q = search.value.trim().toLowerCase()
    const matchSearch = !q || h.name.includes(q) || h.aliases.toLowerCase().includes(q) || h.effect.some(e => e.includes(q))
    const matchTag = !activeTag.value || h.tags.includes(activeTag.value)
    return matchSearch && matchTag
  })
})

const openModal = (herb) => { modal.value = herb }
const closeModal = () => { modal.value = null }
</script>

<template>
  <div class="overflow">

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/cafe/mobile-cafe-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/cafe/cafe-cover.png" alt="">
        <img class="cover-title" src="/images/plant/plant-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 香藥草植物圖鑑
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3 sub-nav">香藥草植物圖鑑</div>
        <div class="bar-green bar-green-center"></div>

        <div class="row bg-greenweb py-4 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-4 px-3">

                <!-- Section Tabs -->
                <div class="herbs-section-tabs mb-3">
                  <button
                      v-for="section in sections"
                      :key="section.key"
                      class="herbs-tab"
                      :class="{ active: activeSection === section.key }"
                      @click="activeSection = section.key; activeTag = ''"
                  >
                    <span>{{ section.icon }}</span>
                    {{ section.label }}
                    <span class="herbs-tab-count">{{ section.herbs.length }}</span>
                  </button>
                </div>

                <!-- Filter Bar -->
                <div class="herbs-filter-row mb-3">
                  <div class="herbs-search-wrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" clip-rule="evenodd"/></svg>
                    <input v-model="search" type="text" placeholder="搜尋名稱、別名或功效…" class="herbs-search-input" />
                  </div>
                  <button
                      v-for="tag in currentTags"
                      :key="tag"
                      class="herbs-tag-btn"
                      :class="{ active: activeTag === tag }"
                      @click="activeTag = activeTag === tag ? '' : tag"
                  >{{ tag }}</button>
                </div>

                <p class="herbs-result-count mb-3">共 {{ filtered.length }} 種植物</p>

                <!-- Grid -->
                <p v-if="filtered.length === 0" class="text-center py-4" style="color:#8a9e84;">找不到符合的植物</p>
                <TransitionGroup name="herb-card-list" tag="div" class="herbs-grid">
                  <div
                      v-for="herb in filtered"
                      :key="herb.name"
                      class="herb-card"
                      @click="openModal(herb)"
                  >
                    <div class="herb-card-img-wrap">
                      <img :src="`/images/plant/${activeSection}/${herb.file}`" :alt="herb.name" class="herb-card-img" loading="lazy" />
                      <div class="herb-card-overlay"><span>查看詳情</span></div>
                    </div>
                    <div class="herb-card-foot">
                      <h2 class="herb-name">{{ herb.name }}</h2>
                      <p class="herb-latin">{{ herb.latin }}</p>
                      <div class="herb-tags">
                        <span v-for="t in herb.tags" :key="t" class="htag" :class="`htag-${tagColor(t)}`">{{ t }}</span>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>

              </div>
            </div>
          </div>
        </div>

        <div class="bar-green bar-green-center2"></div>
      </section>
    </div>

    <div class="col-12 col-md-12 text-center my-5">
      <div class="btn col-md-6 cus-button">
        <NuxtLink to="/front/public">回聖母健康農莊首頁</NuxtLink>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="herbs-modal-fade">
        <div v-if="modal" class="herbs-modal-backdrop" @click.self="closeModal">
          <div class="herbs-modal-box">
            <div class="herbs-modal-inner">

              <!-- 左：圖片欄 -->
              <div class="herbs-modal-img-col">
                <img :src="`/images/plant/${activeSection}/${modal.file}`" :alt="modal.name" class="herbs-modal-img" />
              </div>

              <!-- 右：資訊欄（獨立捲動） -->
              <div class="herbs-modal-info-col">
                <button class="herbs-modal-close" @click="closeModal">✕</button>
                <div class="herbs-modal-badge">{{ currentSection.label }}</div>
                <h2 class="herbs-modal-name">{{ modal.name }}</h2>
                <p class="herbs-modal-latin">{{ modal.latin }}</p>
                <div class="herbs-modal-meta">
                  <div class="herbs-meta-row"><span class="herbs-meta-label">科屬</span><span>{{ modal.family }}</span></div>
                  <div class="herbs-meta-row"><span class="herbs-meta-label">學名</span><span style="font-style:italic">{{ modal.latin }}</span></div>
                  <div class="herbs-meta-row"><span class="herbs-meta-label">別名</span><span>{{ modal.aliases }}</span></div>
                </div>
                <div class="herbs-modal-effect">
                  <h3 class="herbs-effect-title">功效與用途</h3>
                  <p v-for="(para, i) in modal.effect" :key="i" class="herbs-effect-para">{{ para }}</p>
                </div>
                <div class="herb-tags mt-2">
                  <span v-for="t in modal.tags" :key="t" class="htag" :class="`htag-${tagColor(t)}`">{{ t }}</span>
                </div>
                <div class="herbs-modal-detail-btn-wrap">
                  <NuxtLink
                      :to="`/front/herbs/${encodeURIComponent(modal.name)}`"
                      class="herbs-modal-detail-btn"
                      @click="closeModal"
                  >
                    🔗 開啟獨立頁面
                  </NuxtLink>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Section Tabs ── */
.herbs-section-tabs { display: flex; gap: 0; flex-wrap: wrap; }
.herbs-tab {
  padding: 0.6rem 1.2rem;
  border: 1.5px solid #dce8d8;
  background: #fff;
  color: #5a6e54;
  font-family: inherit;
  font-size: 0.86rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  border-radius: 0;
  white-space: nowrap;
}
.herbs-tab:first-child { border-radius: 6px 0 0 6px; }
.herbs-tab:last-child  { border-radius: 0 6px 6px 0; border-left: none; }
.herbs-tab:hover { background: #e8f0eb; color: #1a3d28; }
.herbs-tab.active { background: #3d7a52; border-color: #3d7a52; color: #fff; }
.herbs-tab-count {
  font-size: 0.7rem;
  background: rgba(0,0,0,0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.herbs-tab.active .herbs-tab-count { background: rgba(255,255,255,0.25); }

/* ── Filter ── */
.herbs-filter-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.herbs-search-wrap { position: relative; flex: 0 0 200px; }
.herbs-search-wrap svg {
  position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%);
  width: 13px; height: 13px; color: #8a9e84;
}
.herbs-search-input {
  width: 100%; padding: 0.35rem 0.7rem 0.35rem 1.9rem;
  border: 1.5px solid #d0daca; border-radius: 999px;
  font-size: 0.82rem; font-family: inherit; outline: none;
  background: #f8faf7; color: #2a2e25; transition: border-color 0.2s;
}
.herbs-search-input:focus { border-color: #3d7a52; }
.herbs-tag-btn {
  padding: 0.25rem 0.7rem; border-radius: 999px;
  border: 1.5px solid #c5d4be; background: transparent;
  color: #5a6e54; font-size: 0.76rem; font-family: inherit;
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.herbs-tag-btn:hover { border-color: #3d7a52; color: #3d7a52; }
.herbs-tag-btn.active { background: #3d7a52; border-color: #3d7a52; color: #fff; }
.herbs-result-count { font-size: 0.8rem; color: #8a9e84; margin: 0; }

/* ── Grid ── */
.herbs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.herb-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  transition: transform 0.22s, box-shadow 0.22s;
}
.herb-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.12); }
.herb-card-img-wrap { position: relative; height: 170px; overflow: hidden; background: #e8f0eb; }
.herb-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.herb-card:hover .herb-card-img { transform: scale(1.04); }
.herb-card-overlay {
  position: absolute; inset: 0;
  background: rgba(20,50,28,0);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 0.75rem; transition: background 0.25s;
}
.herb-card:hover .herb-card-overlay { background: rgba(20,50,28,0.32); }
.herb-card-overlay span {
  color: #fff; font-size: 0.75rem;
  opacity: 0; transform: translateY(6px); transition: opacity 0.25s, transform 0.25s;
}
.herb-card:hover .herb-card-overlay span { opacity: 1; transform: translateY(0); }
.herb-card-foot { padding: 0.75rem 0.875rem 0.875rem; }
.herb-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 0.95rem; font-weight: 600; margin: 0 0 0.2rem; color: #1a3d28;
}
.herb-latin { font-size: 0.68rem; color: #8a9e84; margin: 0 0 0.4rem; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.herb-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }

/* ── Tags ── */
.htag { font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 999px; font-weight: 500; }
.htag-green   { background: #e8f5e9; color: #2e7d32; }
.htag-red     { background: #fdecea; color: #b71c1c; }
.htag-teal    { background: #e0f2f1; color: #00695c; }
.htag-purple  { background: #f3e5f5; color: #6a1b9a; }
.htag-blue    { background: #e3f2fd; color: #1565c0; }
.htag-amber   { background: #fff8e1; color: #e65100; }
.htag-orange  { background: #fff3e0; color: #bf360c; }
.htag-lime    { background: #f9fbe7; color: #558b2f; }
.htag-cyan    { background: #e0f7fa; color: #006064; }
.htag-pink    { background: #fce4ec; color: #880e4f; }
.htag-rose    { background: #fde8ec; color: #ad1457; }
.htag-indigo  { background: #e8eaf6; color: #283593; }
.htag-emerald { background: #e8f5e9; color: #1b5e20; }
.htag-violet  { background: #ede7f6; color: #4527a0; }
.htag-sky     { background: #e1f5fe; color: #01579b; }
.htag-fuchsia { background: #fce4ec; color: #6a0080; }
.htag-brown   { background: #efebe9; color: #4e342e; }
.htag-slate   { background: #eceff1; color: #37474f; }

/* ── Modal ── */
.herbs-modal-backdrop {
  position: fixed; inset: 0; background: rgba(10,25,15,0.78); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; backdrop-filter: blur(5px);
}
.herbs-modal-box {
  background: #fff; border-radius: 16px;
  max-width: 840px; width: 100%; max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  display: flex;
}
.herbs-modal-inner {
  display: contents;
}

/* 左欄：固定不動 */
.herbs-modal-img-col {
  background: #edf3ea;
  border-radius: 16px 0 0 16px;
  flex: 0 0 42%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  align-self: stretch;
}
.herbs-modal-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1.25rem;
  box-sizing: border-box;
}

/* 右欄：獨立捲動 */
.herbs-modal-info-col {
  flex: 1;
  position: relative;
  padding: 1.5rem 1.75rem 1.75rem 1.5rem;
  overflow-y: auto;
  max-height: 90vh;
}
.herbs-modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: #f0f4ee; border: none; width: 1.9rem; height: 1.9rem;
  border-radius: 50%; cursor: pointer; font-size: 0.85rem; color: #4a6044;
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.herbs-modal-close:hover { background: #dce8d8; }
.herbs-modal-badge {
  display: inline-block; font-size: 0.7rem; background: #e8f2e5; color: #3d7a52;
  padding: 0.15rem 0.55rem; border-radius: 999px; margin-bottom: 0.5rem; font-weight: 500;
}
.herbs-modal-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.6rem; font-weight: 700; color: #1a3d28; margin: 0 0 0.2rem;
}
.herbs-modal-latin { font-size: 0.8rem; color: #8a9e84; font-style: italic; margin: 0 0 1rem; }
.herbs-modal-meta {
  background: #f4f9f2; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;
  display: flex; flex-direction: column; gap: 0.35rem;
}
.herbs-meta-row { font-size: 0.8rem; display: flex; gap: 0.5rem; align-items: baseline; }
.herbs-meta-label { font-weight: 600; color: #3d7a52; min-width: 2.4rem; flex-shrink: 0; }
.herbs-effect-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 0.9rem; font-weight: 600; color: #1a3d28;
  margin: 0 0 0.6rem; padding-bottom: 0.3rem; border-bottom: 2px solid #d4e8cd;
}
.herbs-effect-para { font-size: 0.84rem; line-height: 1.85; color: #3a4e36; margin: 0 0 0.5rem; }

.herbs-modal-detail-btn-wrap {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e8f0eb;
}
.herbs-modal-detail-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: #3d7a52; color: #fff;
  padding: 0.5rem 1.1rem; border-radius: 999px;
  font-size: 0.82rem; text-decoration: none;
  transition: background 0.15s;
}
.herbs-modal-detail-btn:hover { background: #2d5e3e; color: #fff; }
.herbs-modal-fade-enter-active, .herbs-modal-fade-leave-active { transition: opacity 0.25s; }
.herbs-modal-fade-enter-from, .herbs-modal-fade-leave-to { opacity: 0; }
.herb-card-list-enter-active { transition: opacity 0.3s, transform 0.3s; }
.herb-card-list-enter-from { opacity: 0; transform: translateY(10px); }
.herb-card-list-leave-active { transition: opacity 0.2s; position: absolute; }
.herb-card-list-leave-to { opacity: 0; }

@media (max-width: 680px) {
  .herbs-modal-box { flex-direction: column; }
  .herbs-modal-img-col { border-radius: 16px 16px 0 0; flex: 0 0 auto; min-height: 240px; align-self: auto; }
  .herbs-modal-info-col { max-height: 55vh; }
  .herbs-search-wrap { flex: 1 1 100%; }
}
</style>