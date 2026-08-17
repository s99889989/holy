<script setup>
definePageMeta({ layout: 'front' })
useSiteHead()

import { ref, computed, reactive } from 'vue'

const venues = [
  { name: '快樂運動館B1大禮堂', location: '', capacity: '250', activities: '大型活動，活動，會議', price: 15000, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'F飲水機', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: '活動中心', location: '', capacity: '500', activities: '大型活動，活動，會議', price: 6000, equipment: ['D擴音設備', 'F飲水機', 'G桌子', 'H椅子'], images: [] },
  { name: '療癒森林大草坪', location: '', capacity: '500', activities: '戶外活動，野餐', price: 6000, equipment: [], images: [] },
  { name: '烘培坊烘培教室', location: '', capacity: '20', activities: '烘培教室，活動', price: 6000, equipment: ['E冷氣', 'F飲水機', 'G桌子'], images: [] },
  { name: '快樂競技館', location: '', capacity: '30', activities: '運動課程，活動', price: 6000, equipment: ['B 液晶螢幕', 'E冷氣', 'F飲水機', 'G桌子', 'Ｃ電腦'], images: [] },
  { name: '樂活教室', location: '', capacity: '40-60', activities: '中型會議，聚會', price: 6000, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'F飲水機', 'G桌子', 'Ｃ電腦'], images: [] },
  { name: '聖堂', location: 'A棟', capacity: '100', activities: '禮儀，祈禱，靈修', price: 4000, equipment: ['D擴音設備', 'E冷氣', 'H椅子'], images: [] },
  { name: '心靈教室', location: '', capacity: '30', activities: '禮儀，祈禱，靈修', price: 4000, equipment: ['B 液晶螢幕', 'D擴音設備', 'E冷氣', 'F飲水機', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: '快樂運動館樂功能軟墊教室', location: '', capacity: '25-30', activities: '運動，活動，小團體', price: 4000, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'Ｃ電腦'], images: [] },
  { name: '手作教室', location: '', capacity: '40', activities: '體驗課程，炊事', price: 4000, equipment: ['A 投影機', 'F飲水機', 'G桌子', 'H椅子'], images: [] },
  { name: 'A棟201教室', location: '', capacity: '40', activities: '中型會議，活動，聚會', price: 4000, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: 'Ａ棟202教室', location: '', capacity: '40', activities: '中型會議，活動，聚會', price: 4000, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: 'A棟簡報室', location: '', capacity: '60', activities: '中型會議，活動，聚會', price: 3500, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: '森林好食光廚房及餐廳', location: '', capacity: '16', activities: '廚藝，炊事，聚餐', price: 3000, equipment: ['B 液晶螢幕', 'E冷氣', 'F飲水機', 'G桌子', 'H椅子'], images: [] },
  { name: 'A棟203教室', location: '', capacity: '25', activities: '小型會議，活動，聚會', price: 2500, equipment: ['A 投影機', 'D擴音設備', 'E冷氣', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: '靈修中心靜心室', location: '', capacity: '20', activities: '禮儀，祈禱，靈修', price: 2500, equipment: ['E冷氣'], images: [] },
  { name: '靈修中心客廳', location: '', capacity: '16', activities: '講習，工作坊，靈修', price: 2500, equipment: ['B 液晶螢幕', 'E冷氣', 'F飲水機', 'G桌子', 'H椅子'], images: [] },
  { name: '接待室及小會議室', location: '', capacity: '12', activities: '會談，小型會議，聚會', price: 2500, equipment: ['B 液晶螢幕', 'E冷氣', 'F飲水機', 'G桌子', 'H椅子', 'Ｃ電腦'], images: [] },
  { name: '營火場', location: '', capacity: '150', activities: '營火', price: 2000, equipment: [], images: [] },
  { name: '多功能教室', location: '', capacity: '', activities: '', price: 6000, equipment: [], images: ['1757388033567.jpg', '1757388037022.jpg', '1757388035355.jpg', '1757388038676.jpg'] },
]

const filters = [
  { label: '全部', value: 'all' },
  { label: '大型場地 (100人+)', value: 'large' },
  { label: '中型場地 (30–99人)', value: 'medium' },
  { label: '小型場地 (<30人)', value: 'small' },
  { label: '戶外', value: 'outdoor' },
  { label: '靈修 / 祈禱', value: 'spiritual' },
]

const activeFilter = ref('all')
const activeImage = reactive({})

const setActiveImage = (venueName, img) => {
  activeImage[venueName] = img
}

const lightbox = reactive({ open: false, images: [], index: 0, name: '' })

const openLightbox = (venue, currentImg) => {
  lightbox.images = venue.images
  lightbox.index = venue.images.indexOf(currentImg)
  lightbox.name = venue.name
  lightbox.open = true
}
const closeLightbox = () => { lightbox.open = false }
const lightboxPrev = () => { lightbox.index = (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length }
const lightboxNext = () => { lightbox.index = (lightbox.index + 1) % lightbox.images.length }

const filteredVenues = computed(() => {
  return venues.filter(v => {
    const cap = parseInt(v.capacity)
    switch (activeFilter.value) {
      case 'large':    return cap >= 100
      case 'medium':   return cap >= 30 && cap < 100
      case 'small':    return cap > 0 && cap < 30
      case 'outdoor':  return v.activities.includes('戶外') || v.name.includes('草坪') || v.name.includes('營火')
      case 'spiritual':return v.activities.includes('靈修') || v.activities.includes('祈禱')
      default:         return true
    }
  })
})

const formatPrice = (price) => {
  if (!price) return '洽詢'
  return price.toLocaleString()
}

const venueIcon = (venue) => {
  if (venue.activities.includes('靈修') || venue.activities.includes('祈禱')) return '⛪'
  if (venue.activities.includes('戶外') || venue.name.includes('草坪')) return '🌿'
  if (venue.activities.includes('營火')) return '🔥'
  if (venue.activities.includes('烘培') || venue.activities.includes('廚藝') || venue.activities.includes('炊事')) return '🍳'
  if (venue.activities.includes('運動')) return '🏃'
  if (venue.activities.includes('大型活動')) return '🏛️'
  return '🏫'
}

const equipmentClass = (eq) => {
  if (eq.includes('投影機')) return 'eq-projector'
  if (eq.includes('液晶'))   return 'eq-screen'
  if (eq.includes('電腦'))   return 'eq-computer'
  if (eq.includes('擴音'))   return 'eq-audio'
  if (eq.includes('冷氣'))   return 'eq-ac'
  if (eq.includes('飲水'))   return 'eq-water'
  return 'eq-default'
}
</script>

<template>
  <div class="overflow">

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/cafe/mobile-cafe-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/cafe/cafe-cover.png" alt="">
        <img class="cover-title" src="/images/venue/venue-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 場地租借
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3 sub-nav">場地租借目錄</div>
        <div class="bar-green bar-green-center"></div>

        <div class="row bg-greenweb py-4 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-4 px-3">

                <!-- Filter -->
                <div class="vr-filter-row mb-4">
                  <button
                      v-for="filter in filters"
                      :key="filter.value"
                      class="vr-filter-btn"
                      :class="{ active: activeFilter === filter.value }"
                      @click="activeFilter = filter.value"
                  >{{ filter.label }}</button>
                </div>

                <!-- Venue Grid -->
                <div class="vr-venue-grid">
                  <div v-for="venue in filteredVenues" :key="venue.name" class="vr-card">
                    <!-- Image -->
                    <div class="vr-card-image">
                      <img
                          v-if="venue.images.length"
                          :src="`/images/venue/sub/${activeImage[venue.name] || venue.images[0]}`"
                          :alt="venue.name"
                          class="vr-main-img"
                          @click="openLightbox(venue, activeImage[venue.name] || venue.images[0])"
                      />
                      <div v-else class="vr-card-image-placeholder">
                        <span>{{ venueIcon(venue) }}</span>
                      </div>
                      <div class="vr-price-badge">
                        NT$ {{ formatPrice(venue.price) }} <span>/ 時段</span>
                      </div>
                    </div>

                    <!-- Body -->
                    <div class="vr-card-body">
                      <div class="vr-card-header-row">
                        <h2 class="vr-venue-name">{{ venue.name }}</h2>
                        <span v-if="venue.location" class="vr-venue-location">{{ venue.location }}</span>
                      </div>

                      <div class="vr-venue-meta">
                        <span v-if="venue.capacity" class="vr-meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z"/></svg>
                          {{ venue.capacity }} 人
                        </span>
                        <span v-if="venue.activities" class="vr-meta-item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clip-rule="evenodd"/></svg>
                          {{ venue.activities }}
                        </span>
                      </div>

                      <div v-if="venue.equipment.length" class="vr-equipment-tags">
                        <span
                            v-for="eq in venue.equipment"
                            :key="eq"
                            class="vr-eq-tag"
                            :class="equipmentClass(eq)"
                        >{{ eq }}</span>
                      </div>

                      <div v-if="venue.images.length > 1" class="vr-extra-images">
                        <img
                            v-for="(img, idx) in venue.images"
                            :key="idx"
                            :src="`/images/book/venue-rental-catalog/${img}`"
                            :alt="`${venue.name} ${idx + 1}`"
                            class="vr-thumb"
                            :class="{ 'vr-thumb-active': (activeImage[venue.name] || venue.images[0]) === img }"
                            @click="setActiveImage(venue.name, img)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

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

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox.open" class="vr-lightbox" @click.self="closeLightbox">
        <button class="vr-lb-close" @click="closeLightbox">✕</button>
        <button v-if="lightbox.images.length > 1" class="vr-lb-arrow vr-lb-prev" @click="lightboxPrev">&#8249;</button>
        <img
            class="vr-lb-img"
            :src="`/images/book/venue-rental-catalog/${lightbox.images[lightbox.index]}`"
            :alt="lightbox.name"
        />
        <button v-if="lightbox.images.length > 1" class="vr-lb-arrow vr-lb-next" @click="lightboxNext">&#8250;</button>
        <div v-if="lightbox.images.length > 1" class="vr-lb-dots">
          <span
              v-for="(_, i) in lightbox.images"
              :key="i"
              class="vr-lb-dot"
              :class="{ active: i === lightbox.index }"
              @click="lightbox.index = i"
          />
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Filter ── */
.vr-filter-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.vr-filter-btn {
  padding: 0.38rem 0.9rem; border-radius: 999px;
  border: 1.5px solid #c5d4be; background: transparent;
  color: #5a6e54; font-size: 0.83rem; font-family: inherit;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.vr-filter-btn:hover { border-color: #3d7a52; color: #3d7a52; }
.vr-filter-btn.active { background: #3d7a52; border-color: #3d7a52; color: #fff; }

/* ── Grid ── */
.vr-venue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ── Card ── */
.vr-card {
  background: #fff; border-radius: 10px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; flex-direction: column;
}
.vr-card:hover { transform: translateY(-3px); box-shadow: 0 8px 22px rgba(0,0,0,0.12); }

.vr-card-image {
  position: relative; height: 170px;
  background: linear-gradient(135deg, #e8f0eb, #d4e6da); overflow: hidden;
}
.vr-main-img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform 0.3s; }
.vr-main-img:hover { transform: scale(1.03); }
.vr-card-image-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center; font-size: 3rem; opacity: 0.55;
}
.vr-price-badge {
  position: absolute; bottom: 0.65rem; right: 0.65rem;
  background: rgba(15,41,24,0.88); color: #fff;
  padding: 0.25rem 0.65rem; border-radius: 999px;
  font-size: 0.88rem; font-weight: 500; backdrop-filter: blur(4px);
}
.vr-price-badge span { font-size: 0.72rem; opacity: 0.8; }

.vr-card-body { padding: 1.1rem; flex: 1; display: flex; flex-direction: column; gap: 0.65rem; }
.vr-card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.vr-venue-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 1rem; font-weight: 600; margin: 0; line-height: 1.4; color: #1a3d28;
}
.vr-venue-location {
  font-size: 0.72rem; background: #e8f0eb; color: #5a6e54;
  padding: 0.13rem 0.45rem; border-radius: 4px; white-space: nowrap; flex-shrink: 0;
}
.vr-venue-meta { display: flex; flex-direction: column; gap: 0.3rem; }
.vr-meta-item {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.83rem; color: #4a5e44;
}
.vr-meta-item svg { width: 14px; height: 14px; flex-shrink: 0; color: #3d7a52; }
.vr-equipment-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.vr-eq-tag { font-size: 0.72rem; padding: 0.18rem 0.45rem; border-radius: 4px; font-weight: 400; }
.eq-projector { background: #eff6ff; color: #1d4ed8; }
.eq-screen    { background: #f0fdf4; color: #166534; }
.eq-computer  { background: #fdf4ff; color: #7e22ce; }
.eq-audio     { background: #fff7ed; color: #c2410c; }
.eq-ac        { background: #f0f9ff; color: #0369a1; }
.eq-water     { background: #f0fdfa; color: #0f766e; }
.eq-default   { background: #f0f4ee; color: #5a6e54; }

.vr-extra-images { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.vr-thumb {
  width: 54px; height: 40px; object-fit: cover; border-radius: 4px;
  border: 2px solid transparent; cursor: pointer; transition: border-color 0.15s, opacity 0.15s; opacity: 0.7;
}
.vr-thumb:hover { opacity: 1; border-color: #3d7a52; }
.vr-thumb-active { opacity: 1; border-color: #3d7a52; }

/* ── Lightbox ── */
.vr-lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.vr-lb-img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 6px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
.vr-lb-close {
  position: absolute; top: 1.25rem; right: 1.5rem;
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  font-size: 1.25rem; width: 2.25rem; height: 2.25rem; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;
}
.vr-lb-close:hover { background: rgba(255,255,255,0.3); }
.vr-lb-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  font-size: 2.5rem; width: 3rem; height: 3rem; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;
}
.vr-lb-arrow:hover { background: rgba(255,255,255,0.3); }
.vr-lb-prev { left: 1.25rem; }
.vr-lb-next { right: 1.25rem; }
.vr-lb-dots {
  position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
  display: flex; gap: 0.5rem;
}
.vr-lb-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: background 0.2s; }
.vr-lb-dot.active { background: #fff; }
</style>