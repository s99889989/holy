<script setup>
definePageMeta({ layout: 'front' })
useSiteHead()

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findHerbByName, tagColor } from '~/composables/useHerbsData'

const route  = useRoute()
const router = useRouter()

const result = computed(() => findHerbByName(decodeURIComponent(route.params.name)))
const herb         = computed(() => result.value?.herb)
const sectionKey   = computed(() => result.value?.sectionKey)
const sectionLabel = computed(() => result.value?.sectionLabel)
</script>

<template>
  <div class="overflow">

    <!-- Not found -->
    <div v-if="!herb" class="container py-5 text-center">
      <p style="color:#8a9e84; font-size:1.1rem;">找不到「{{ $route.params.name }}」這種植物</p>
      <NuxtLink to="/front/herbs-encyclopedia" class="hd-back-link mt-3 d-inline-block">← 回到香藥草圖鑑</NuxtLink>
    </div>

    <template v-else>

      <!-- Hero -->
      <div class="hd-hero">
        <div class="hd-hero-img-wrap">
          <img
            :src="`/images/plant/${sectionKey}/${herb.file}`"
            :alt="herb.name"
            class="hd-hero-img"
          />
        </div>
        <div class="hd-hero-overlay">
          <span class="hd-section-badge">{{ sectionLabel }}</span>
          <h1 class="hd-hero-name">{{ herb.name }}</h1>
          <p class="hd-hero-latin">{{ herb.latin }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="container hd-content">

        <!-- Breadcrumb -->
        <nav class="hd-breadcrumb">
          <NuxtLink to="/front/public">首頁</NuxtLink>
          <span> › </span>
          <NuxtLink to="/front/herbs-encyclopedia">香藥草植物圖鑑</NuxtLink>
          <span> › </span>
          <span>{{ herb.name }}</span>
        </nav>

        <!-- Tags -->
        <div class="herb-tags mb-4">
          <span
            v-for="t in herb.tags"
            :key="t"
            class="htag"
            :class="`htag-${tagColor(t)}`"
          >{{ t }}</span>
        </div>

        <!-- Meta card -->
        <div class="hd-meta-card">
          <div class="hd-meta-row">
            <span class="hd-meta-label">科屬</span>
            <span>{{ herb.family }}</span>
          </div>
          <div class="hd-meta-row">
            <span class="hd-meta-label">學名</span>
            <span style="font-style:italic">{{ herb.latin }}</span>
          </div>
          <div class="hd-meta-row">
            <span class="hd-meta-label">別名</span>
            <span>{{ herb.aliases }}</span>
          </div>
        </div>

        <!-- Effect -->
        <section class="hd-effect-section">
          <h2 class="hd-section-title">功效與用途</h2>
          <p
            v-for="(para, i) in herb.effect"
            :key="i"
            class="hd-effect-para"
          >{{ para }}</p>
        </section>

        <!-- Back button -->
        <div class="hd-footer">
          <button class="hd-back-btn" @click="router.back()">
            ← 返回上一頁
          </button>
          <NuxtLink to="/front/herbs-encyclopedia" class="hd-back-link">
            回到香藥草圖鑑
          </NuxtLink>
        </div>

      </div>
    </template>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>

  </div>
</template>

<style scoped>
/* ── Hero ── */
.hd-hero {
  position: relative;
  width: 100%;
  height: 360px;
  overflow: hidden;
  background: #edf3ea;
}
.hd-hero-img-wrap {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.hd-hero-img {
  max-height: 340px;
  max-width: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.12));
}
.hd-hero-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 1.5rem 2rem;
  background: linear-gradient(to top, rgba(10,30,15,0.72) 0%, transparent 100%);
}
.hd-section-badge {
  display: inline-block;
  font-size: 0.7rem; background: rgba(255,255,255,0.2);
  color: #d4f0d4; border: 1px solid rgba(255,255,255,0.3);
  padding: 0.15rem 0.6rem; border-radius: 999px;
  margin-bottom: 0.4rem; font-weight: 500;
  backdrop-filter: blur(4px);
}
.hd-hero-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 2.2rem; font-weight: 700; color: #fff;
  margin: 0 0 0.2rem; text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.hd-hero-latin {
  font-size: 0.9rem; color: rgba(255,255,255,0.75);
  font-style: italic; margin: 0;
}

/* ── Content ── */
.hd-content {
  max-width: 780px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}
.hd-breadcrumb {
  font-size: 0.78rem; color: #8a9e84; margin-bottom: 1.25rem;
}
.hd-breadcrumb a { color: #3d7a52; text-decoration: none; }
.hd-breadcrumb a:hover { text-decoration: underline; }

/* ── Meta card ── */
.hd-meta-card {
  background: #f4f9f2; border-radius: 10px;
  padding: 1rem 1.25rem; margin-bottom: 2rem;
  display: flex; flex-direction: column; gap: 0.5rem;
  border-left: 3px solid #3d7a52;
}
.hd-meta-row {
  font-size: 0.85rem; display: flex; gap: 0.75rem; align-items: baseline;
}
.hd-meta-label {
  font-weight: 600; color: #3d7a52;
  min-width: 2.4rem; flex-shrink: 0;
}

/* ── Effect ── */
.hd-effect-section { margin-bottom: 2rem; }
.hd-section-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.05rem; font-weight: 600; color: #1a3d28;
  margin: 0 0 0.75rem;
  padding-bottom: 0.4rem; border-bottom: 2px solid #d4e8cd;
}
.hd-effect-para {
  font-size: 0.9rem; line-height: 1.9; color: #3a4e36;
  margin: 0 0 0.65rem;
}

/* ── Footer ── */
.hd-footer {
  display: flex; align-items: center; gap: 1rem;
  padding-top: 1rem; border-top: 1px solid #e8f0eb;
}
.hd-back-btn {
  background: none; border: 1.5px solid #c5d4be;
  color: #5a6e54; padding: 0.4rem 1rem;
  border-radius: 999px; font-size: 0.82rem;
  cursor: pointer; transition: all 0.15s;
}
.hd-back-btn:hover { border-color: #3d7a52; color: #3d7a52; }
.hd-back-link {
  font-size: 0.82rem; color: #3d7a52;
  text-decoration: none;
}
.hd-back-link:hover { text-decoration: underline; }

/* ── Tags (共用) ── */
.herb-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.htag { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 500; }
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

@media (max-width: 600px) {
  .hd-hero { height: 260px; }
  .hd-hero-name { font-size: 1.6rem; }
  .hd-content { padding-top: 1rem; }
}
</style>
