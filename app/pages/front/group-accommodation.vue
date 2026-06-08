<script setup>
definePageMeta({ layout: 'front' })
useSiteHead()

import { ref, computed } from 'vue'

const selectedItem = ref(null)
const currentIndex = ref(0)
const slideDir = ref('slide-left')
let touchStartX = 0

const modalImages = computed(() => selectedItem.value?.images || [])

function openModal(item) {
  selectedItem.value = item
  currentIndex.value = 0
}
function closeModal() { selectedItem.value = null }
function prevImage() {
  if (modalImages.value.length <= 1) return
  slideDir.value = 'slide-right'
  currentIndex.value = (currentIndex.value - 1 + modalImages.value.length) % modalImages.value.length
}
function nextImage() {
  if (modalImages.value.length <= 1) return
  slideDir.value = 'slide-left'
  currentIndex.value = (currentIndex.value + 1) % modalImages.value.length
}
function goTo(i) {
  slideDir.value = i > currentIndex.value ? 'slide-left' : 'slide-right'
  currentIndex.value = i
}
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 40) diff > 0 ? nextImage() : prevImage()
}

const sections = ref([
  {
    id: 'agape',
    name: '愛加倍靈修中心',
    items: [
      { id: 'agape-1', name: '兩大床四人客房', images: [], tags: [{ label: '4000元/晚', color: 'tag-yellow' }], description: '寬敞四人房，配備兩張大床，適合家庭或小團體入住。' },
      { id: 'agape-2', name: '愛加倍交誼廳',  images: [], tags: [{ label: '一拼報2500元', color: 'tag-green' }], description: '提供舒適的交誼空間，適合小型聚會與交流。' },
      { id: 'agape-3', name: '靜心室',        images: [], tags: [{ label: '一拼報2500元', color: 'tag-green' }], description: '靜心冥想空間，適合個人靈修與放鬆。' }
    ]
  },
  {
    id: 'heli',
    name: '合力居',
    items: [
      { id: 'heli-1', name: '雙床房',    images: [], tags: [], description: '' },
      { id: 'heli-2', name: '有窗雙人房', images: [], tags: [], description: '' },
      { id: 'heli-3', name: '無窗雙人房', images: [], tags: [], description: '' },
      { id: 'heli-4', name: '有窗單人房', images: [], tags: [], description: '' },
      { id: 'heli-5', name: '無窗單人房', images: [], tags: [], description: '' }
    ]
  },
  {
    id: 'sport',
    name: '快樂運動館',
    items: [
      { id: 'sport-1', name: '植物扦插', images: [
          '/images/stay/sub/22bd452e-3178-4705-b85c-a9439ef2912d.png',
          '/images/stay/sub/e02a3496-59cc-4ade-a210-480c48d03641.png',
        ], tags: [{ label: '成品帶回家', color: 'tag-brown' }, { label: '200元/人', color: 'tag-yellow' }, { label: '體驗時長5分鐘', color: 'tag-gray' }], description: '學習植物扦插技巧，帶著自己親手種植的植物回家。' },
      { id: 'sport-2', name: '手洗窯玉', images: [
          '/images/stay/sub/9af9354d-3243-453f-83e4-8926edefc8c2.png',
          '/images/stay/sub/e2cc5721-66e6-4254-94ad-738b5c25c17b.png',
        ], tags: [{ label: '200元/人', color: 'tag-yellow' }, { label: '即時體驗', color: 'tag-blue' }, { label: '體驗時長50分鐘', color: 'tag-gray' }], description: '體驗陶藝製作，在農莊享受手工創作的樂趣。' },
      { id: 'sport-3', name: '無患子溝渠液', images: [
          '/images/stay/sub/d0bc0bce-23cd-4e25-8411-d440ee3e9416.png',
          '/images/stay/sub/79dc1690-c399-45f1-9bef-89410c370e1f.png',
        ], tags: [{ label: '250元/人', color: 'tag-yellow' }, { label: '體驗時長50分鐘', color: 'tag-gray' }, { label: '季節限定', color: 'tag-red' }], description: '使用天然無患子製作環保清潔液，認識自然素材。' }
    ]
  },
  {
    id: 'kitchen',
    name: '樂智家園盟親廚房',
    items: [
      { id: 'kitchen-1', name: '手作香草魚', images: [
          '/images/stay/sub/8ff0ab92-c740-4ce1-8fbc-0a3af93e1db5.png',
          '/images/stay/sub/6f758524-7272-4359-9a9c-611f5a663215.png',
        ], tags: [{ label: '即時體驗', color: 'tag-blue' }, { label: '300元/人', color: 'tag-yellow' }, { label: '體驗時長50分鐘', color: 'tag-gray' }], description: '學習以新鮮香草料理魚料理，品嚐農莊在地食材的美味。' },
      { id: 'kitchen-2', name: '植物紮托染', images: [
          '/images/stay/sub/b592e6ff-622b-4661-9320-a2c51db0967a.png',
          '/images/stay/sub/bf43f2fa-2b77-43ea-8521-1a53f70ee27a.png',
        ], tags: [{ label: '即時體驗', color: 'tag-blue' }, { label: '350元/人', color: 'tag-yellow' }, { label: '體驗時長50分鐘', color: 'tag-gray' }], description: '利用天然植物染料體驗傳統紮染工藝，創作獨一無二的作品。' },
      { id: 'kitchen-3', name: '醬滷豆腐', images: [
          '/images/stay/sub/ec5f0415-98e2-4b17-aae4-67315e76bfed.png',
          '/images/stay/sub/a28a1f48-6eef-430a-b304-046ff3fe07d9.png',
        ], tags: [{ label: '體驗時長30分鐘', color: 'tag-gray' }, { label: '1000元/組(3-5人)', color: 'tag-yellow' }], description: '學習傳統醬滷豆腐製作，感受台灣在地飲食文化。' }
    ]
  },
  {
    id: 'camping',
    name: '露營地租借',
    items: [
      { id: 'camp-1', name: '環形運動', images: [
          '/images/stay/sub/78907d2d-961e-4306-8690-dc2d2659dcf0 (1).png',
          '/images/stay/sub/da7817bf-1cbf-4eb2-9882-a0157ac6943f (1).png',
        ], tags: [{ label: '250元/人', color: 'tag-yellow' }, { label: '體驗時長50分鐘', color: 'tag-gray' }], description: '在寬闊戶外空間體驗環形團體運動，增進團隊向心力。' },
      { id: 'camp-2', name: '桶油運動', images: [
          '/images/stay/sub/b6136977-a265-48f3-8420-2076352570d1 (1).png',
          '/images/stay/sub/07e4a21c-1e0b-464d-9669-aea45d66d19d (1).png',
          '/images/stay/sub/9a9fc814-b024-4eef-9686-cf697568edc9 (1).png',
        ], tags: [{ label: '350元/人', color: 'tag-yellow' }, { label: '體驗時長50分鐘', color: 'tag-gray' }], description: '趣味性十足的桶油競技，適合各年齡層參與。' },
      { id: 'camp-3', name: '地板滾球體驗', images: [
          '/images/stay/sub/87f4886e-753f-4ddb-bd38-5a3eca9782ca (1).png',
          '/images/stay/sub/f8a1bbdb-bb64-4c44-b11d-0cf7720c4699 (1).png',
        ], tags: [{ label: '400元/人', color: 'tag-yellow' }, { label: '體驗時長60分鐘', color: 'tag-gray' }], description: '體驗地板滾球競賽，老少咸宜的益智運動。' },
      { id: 'camp-4', name: '地板滾球競賽', images: [
          '/images/stay/sub/5bf961dc-eb46-44a7-b264-dbf1ef0834aa (1).png',
          '/images/stay/sub/49b59b5e-5e5c-437d-a322-ef321d93b575 (1).png',
        ], tags: [{ label: '體驗時長90分鐘', color: 'tag-gray' }, { label: '350元/人', color: 'tag-yellow' }], description: '進階版地板滾球正式競賽，激烈精彩、樂趣無窮。' }
    ]
  }
])
</script>

<template>
  <div>

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/cafe/mobile-cafe-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/cafe/cafe-cover.png" alt="">
        <img class="cover-title" src="/images/stay/stay-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 團體住宿空間
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3 sub-nav">聖母健康園區 團體住宿空間</div>
        <div class="bar-green bar-green-center"></div>

        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-4 px-3">

                <p class="ga-contact-hint text-center mb-1">疑問及預約，歡迎來電聖母健康農莊洽詢</p>
                <p class="ga-contact-phone text-center mb-4">089-381581 #888 服務中心 賈小姐</p>

                <!-- Sections -->
                <div v-for="section in sections" :key="section.id" class="ga-section mb-5">
                  <h2 class="ga-section-title">{{ section.name }}</h2>
                  <div class="ga-cards-grid">
                    <div
                        v-for="item in section.items"
                        :key="item.id"
                        class="ga-card"
                        @click="openModal(item)"
                    >
                      <div class="ga-card-img-wrap">
                        <img v-if="item.images && item.images.length" :src="item.images[0]" :alt="item.name" class="ga-card-img" />
                        <div v-else class="ga-card-img-placeholder" />
                      </div>
                      <div class="ga-card-body">
                        <p class="ga-card-name">{{ item.name }}</p>
                        <div class="ga-card-tags">
                          <span v-for="tag in item.tags" :key="tag.label" class="ga-tag" :class="tag.color">{{ tag.label }}</span>
                        </div>
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

    <!-- Modal -->
    <Transition name="ga-modal">
      <div v-if="selectedItem" class="ga-modal-overlay" @click.self="closeModal">
        <div class="ga-modal-box">
          <button class="ga-modal-close" @click="closeModal">✕</button>

          <!-- Carousel -->
          <div class="ga-modal-img-wrap" @touchstart="onTouchStart" @touchend="onTouchEnd">
            <template v-if="modalImages.length">
              <Transition :name="slideDir" mode="out-in">
                <img :key="currentIndex" :src="modalImages[currentIndex]" :alt="selectedItem.name" class="ga-modal-img" />
              </Transition>
              <button v-if="modalImages.length > 1" class="ga-carousel-btn prev" @click.stop="prevImage">&#8249;</button>
              <button v-if="modalImages.length > 1" class="ga-carousel-btn next" @click.stop="nextImage">&#8250;</button>
              <div v-if="modalImages.length > 1" class="ga-carousel-counter">{{ currentIndex + 1 }} / {{ modalImages.length }}</div>
            </template>
            <div v-else class="ga-modal-img-placeholder" />
          </div>

          <!-- Thumbnail Strip -->
          <div v-if="modalImages.length > 1" class="ga-thumb-strip">
            <img
                v-for="(img, i) in modalImages"
                :key="i"
                :src="img"
                :alt="`圖片 ${i + 1}`"
                class="ga-thumb"
                :class="{ 'ga-thumb-active': i === currentIndex }"
                @click="goTo(i)"
            />
          </div>

          <div class="ga-modal-content">
            <h3 class="ga-modal-title">{{ selectedItem.name }}</h3>
            <div class="ga-card-tags mt-2">
              <span v-for="tag in selectedItem.tags" :key="tag.label" class="ga-tag" :class="tag.color">{{ tag.label }}</span>
            </div>
            <p v-if="selectedItem.description" class="ga-modal-desc">{{ selectedItem.description }}</p>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── Contact ── */
.ga-contact-hint { font-size: 0.88rem; color: #5a6e54; }
.ga-contact-phone { font-size: 0.88rem; color: #3d7a52; font-weight: 500; }

/* ── Section ── */
.ga-section-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1a3d28;
  border-left: 3px solid #3d7a52;
  padding-left: 10px;
  margin: 0 0 14px;
}

/* ── Cards Grid ── */
.ga-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ga-card {
  background: #fff;
  border: 1px solid #dce8d8;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}
.ga-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}
.ga-card-img-wrap {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: #e8f0eb;
  position: relative;
}
.ga-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.ga-card:hover .ga-card-img { transform: scale(1.04); }
.ga-card-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8f0eb 0%, #d4e6da 100%);
}
.ga-card-body { padding: 10px 10px 12px; }
.ga-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e3a28;
  margin: 0 0 6px;
  line-height: 1.4;
}
.ga-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }

/* ── Tags ── */
.ga-tag {
  display: inline-block;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 400;
  white-space: nowrap;
}
.tag-yellow { background: #fff3cd; color: #856404; }
.tag-green  { background: #d1f5e0; color: #1a6b3a; }
.tag-blue   { background: #dbeafe; color: #1d4ed8; }
.tag-brown  { background: #ede0d4; color: #6b3a1f; }
.tag-gray   { background: #f0f0f0; color: #555; }
.tag-red    { background: #fde8e8; color: #991b1b; }

/* ── Modal ── */
.ga-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,25,15,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}
.ga-modal-box {
  background: #fff;
  border-radius: 12px;
  max-width: 460px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.ga-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.9);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.ga-modal-close:hover { background: #fff; color: #111; }
.ga-modal-img-wrap {
  width: 100%;
  aspect-ratio: 4/3;
  background: #e8f0eb;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.ga-modal-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ga-modal-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8f0eb 0%, #d4e6da 100%);
}
.ga-carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.85);
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 22px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 5;
}
.ga-carousel-btn.prev { left: 10px; }
.ga-carousel-btn.next { right: 10px; }
.ga-carousel-counter {
  position: absolute;
  bottom: 10px;
  right: 12px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.ga-thumb-strip {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  background: #f4f9f2;
  border-bottom: 1px solid #dce8d8;
  flex-shrink: 0;
}
.ga-thumb {
  width: 52px;
  height: 40px;
  object-fit: cover;
  border-radius: 5px;
  cursor: pointer;
  border: 2px solid transparent;
  flex-shrink: 0;
  opacity: 0.65;
  transition: opacity 0.15s, border-color 0.15s;
}
.ga-thumb:hover { opacity: 1; }
.ga-thumb-active { border-color: #3d7a52; opacity: 1; }
.ga-modal-content { padding: 16px 20px 22px; overflow-y: auto; }
.ga-modal-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1a3d28;
}
.ga-modal-desc {
  font-size: 13px;
  line-height: 1.7;
  color: #555;
  margin: 12px 0 0;
}

/* ── Slide transitions ── */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}
.slide-left-enter-from  { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to    { transform: translateX(-100%); opacity: 0; }
.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to   { transform: translateX(100%); opacity: 0; }

.ga-modal-enter-active, .ga-modal-leave-active { transition: opacity 0.2s; }
.ga-modal-enter-from, .ga-modal-leave-to { opacity: 0; }
.ga-modal-enter-active .ga-modal-box, .ga-modal-leave-active .ga-modal-box { transition: transform 0.2s; }
.ga-modal-enter-from .ga-modal-box, .ga-modal-leave-to .ga-modal-box { transform: scale(0.95) translateY(10px); }

/* ── Responsive ── */
@media (max-width: 600px) {
  .ga-cards-grid { grid-template-columns: repeat(2, 1fr); }
  .ga-modal-overlay { align-items: flex-end; padding: 0; }
  .ga-modal-box { max-width: 100%; border-radius: 12px 12px 0 0; max-height: 88vh; }
}
@media (max-width: 380px) {
  .ga-cards-grid { grid-template-columns: 1fr; }
}
</style>