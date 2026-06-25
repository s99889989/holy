<script setup>

useSiteHead()

import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {findHerbByName, tagColor} from '~/composables/useHerbsData'

const route = useRoute()

const result = computed(() => findHerbByName(decodeURIComponent(route.params.name)))
const herb = computed(() => result.value?.herb)
const sectionKey = computed(() => result.value?.sectionKey)
const sectionLabel = computed(() => result.value?.sectionLabel)
</script>

<template>
  <div class="overflow">

    <!-- Not found -->
    <div v-if="!herb" class="container py-5 text-center">
      <p style="color:#8a9e84; font-size:1.1rem;">找不到「{{ $route.params.name }}」這種植物</p>
      <NuxtLink to="/front/herbs" class="hd-back-link mt-3 d-inline-block">← 回到香藥草圖鑑</NuxtLink>
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

        <!-- Back link -->
        <NuxtLink to="/front/herbs" class="hd-back-link">← 回到香藥草圖鑑</NuxtLink>

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

      </div>
    </template>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>

  </div>
</template>

<style scoped>
/* ── Back link ── */
.hd-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #3d7a52;
  text-decoration: none;
  margin-bottom: 1.25rem;
  transition: color 0.15s;
}

.hd-back-link:hover {
  color: #1a3d28;
}

/* ── Hero ── */
.hd-hero {
  position: relative;
  width: 100%;
  height: 460px;
  overflow: hidden;
  background: #edf3ea;
  margin-top: -1px;
}

.hd-hero-img-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 5rem;
}

.hd-hero-img {
  max-height: 100%;
  max-width: 85%;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12));
}

.hd-hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem 1.5rem 1.25rem;
  background: linear-gradient(to top, rgba(10, 30, 15, 0.82) 0%, rgba(10, 30, 15, 0.3) 60%, transparent 100%);
}

.hd-section-badge {
  display: inline-block;
  font-size: 0.68rem;
  background: rgba(255, 255, 255, 0.18);
  color: #d4f0d4;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.35rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.hd-hero-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.hd-hero-latin {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  font-style: italic;
  margin: 0;
}

/* ── Content ── */
.hd-content {
  max-width: 780px;
  padding-top: 1.25rem;
  padding-bottom: 3rem;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

/* ── Meta card ── */
.hd-meta-card {
  background: #f4f9f2;
  border-radius: 10px;
  padding: 1rem 1.1rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-left: 3px solid #3d7a52;
}

.hd-meta-row {
  font-size: 0.88rem;
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  line-height: 1.6;
}

.hd-meta-label {
  font-weight: 700;
  color: #3d7a52;
  min-width: 2.4rem;
  flex-shrink: 0;
}

/* ── Effect ── */
.hd-effect-section {
  margin-bottom: 2rem;
}

.hd-section-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #1a3d28;
  margin: 0 0 0.85rem;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid #d4e8cd;
}

.hd-effect-para {
  font-size: 0.92rem;
  line-height: 1.95;
  color: #3a4e36;
  margin: 0 0 0.75rem;
}

/* ── Tags ── */
.herb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.htag {
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-weight: 500;
}

.htag-green {
  background: #e8f5e9;
  color: #2e7d32;
}

.htag-red {
  background: #fdecea;
  color: #b71c1c;
}

.htag-teal {
  background: #e0f2f1;
  color: #00695c;
}

.htag-purple {
  background: #f3e5f5;
  color: #6a1b9a;
}

.htag-blue {
  background: #e3f2fd;
  color: #1565c0;
}

.htag-amber {
  background: #fff8e1;
  color: #e65100;
}

.htag-orange {
  background: #fff3e0;
  color: #bf360c;
}

.htag-lime {
  background: #f9fbe7;
  color: #558b2f;
}

.htag-cyan {
  background: #e0f7fa;
  color: #006064;
}

.htag-pink {
  background: #fce4ec;
  color: #880e4f;
}

.htag-rose {
  background: #fde8ec;
  color: #ad1457;
}

.htag-indigo {
  background: #e8eaf6;
  color: #283593;
}

.htag-emerald {
  background: #e8f5e9;
  color: #1b5e20;
}

.htag-violet {
  background: #ede7f6;
  color: #4527a0;
}

.htag-sky {
  background: #e1f5fe;
  color: #01579b;
}

.htag-fuchsia {
  background: #fce4ec;
  color: #6a0080;
}

.htag-brown {
  background: #efebe9;
  color: #4e342e;
}

.htag-slate {
  background: #eceff1;
  color: #37474f;
}

@media (max-width: 600px) {
  .hd-hero {
    height: 420px;
  }

  .hd-hero-name {
    font-size: 1.7rem;
  }

  .hd-hero-img {
    max-width: 90%;
  }
}
</style>