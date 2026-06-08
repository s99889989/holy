<script setup>
definePageMeta({ layout: 'front' })
useSiteHead()

import { ref, computed } from 'vue'

const categories = [
  {
    key: 'nature',
    label: '一起嗨翻大自然',
    icon: '🌲',
    desc: '走進農莊的自然生態，從野炊、釣魚、射箭到攀樹，讓身體與土地接觸，感受最純粹的自然探索。',
    courses: [
      { name:'烤蛇麵', intro:'烤蛇麵是簡單有趣的野外求生技能之一，體驗者學習利用簡單的材料、器具，製作出美味的食物。', images:['1757310173882.jpg','1757310169962.jpg'], tags:['200元/人','體驗時長50分鐘'], coming:false },
      { name:'釣魚體驗', intro:'認識釣魚的裝備與技術與釣到的魚種，並讓學生實際操作，討論永續捕撈的觀念。反思等待與專注在日常生活中的價值。', images:['113688387_10207494443877017_5427047683684616840_n.jpg','112548189_10207494440116923_1092746691232875894_n.jpg','eb505f91-1b38-4a2c-b616-f2c2ff1b34f4.png'], tags:['200元/人','兩人即可體驗!','即時體驗','體驗時長50分鐘'], coming:false },
      { name:'射箭體驗', intro:'', images:['113631703_10207494450637186_4085282491151356325_n.jpg'], tags:['200元/人','兩人即可體驗!','體驗時長30分鐘'], coming:false },
      { name:'攀樹訓練', intro:'', images:['114608480_10207488659932422_4214454026137651409_n.jpg','110934881_10207488639251905_6518065758967220873_n.jpg','109780332_10207488641211954_652403600013723264_n.jpg'], tags:['800元/人','兩人即可體驗!','體驗時長90分鐘'], coming:false },
      { name:'秋日灌蟋蟀', intro:'', images:[], tags:['季節限定課程'], coming:true },
      { name:'認識園區鳥類', intro:'', images:[], tags:[], coming:true },
    ]
  },
  {
    key: 'handcraft',
    label: '手作遊樂園',
    icon: '🎨',
    desc: '用雙手創造屬於自己的作品，從植物染、香草魚、豆腐到草本捶捶棒，每件作品都是獨一無二的自然禮物。',
    courses: [
      { name:'植物敲拓染', intro:'學習植物的天然色素特性，提升對大自然的觀察力。強調環保概念，減少塑膠袋的使用。發揮想像與創造力，製作獨一無二環保帆布袋。', images:['b592e6ff-622b-4661-9320-a2c51db0967a.png','bf43f2fa-2b77-43ea-8521-1a53f70ee27a.png'], tags:['350元/人','即時體驗','成品帶回家!','體驗時長50分鐘'], coming:false },
      { name:'手作香草魚', intro:'鍛鍊創意思維和設計能力，了解香草植物氣味特色與如何將香草應用於手作中，增添作品獨特感。', images:['8ff0ab92-c740-4ce1-8fbc-0a3af93e1db5.png','6f758524-7272-4359-9a9c-611f5a663215.png'], tags:['300元/人','即時體驗','成品帶回家!','體驗時長50分鐘'], coming:false },
      { name:'鹽滷豆腐', intro:'了解豆腐的製作過程與原理，學習食品製作過程的衛生與安全，透過實踐提升動手操作的能力。', images:['ec5f0415-98e2-4b17-aae4-67315e76bfed.png','a28a1f48-6eef-430a-b304-046ff3fe07d9.png'], tags:['1000元/組(3-5人)','體驗時長50分鐘'], coming:false },
      { name:'香藥草捶捶棒', intro:'', images:[], tags:['350元/人','成品帶回家!','體驗時長90分鐘'], coming:false },
    ]
  },
  {
    key: 'green',
    label: '綠生活篇',
    icon: '🌱',
    desc: '從植物扦插到無患子清潔液、手洗愛玉，深入了解自然循環與環保生活，讓生活更貼近大自然。',
    courses: [
      { name:'植物扦插', intro:'了解植物的繁殖方式能更清楚地知道植物如何繁延後代。如何選擇合適的繁殖方法和環保的種植方式減少對化學用品的依賴。能有助於對環境的保護和農業發展。', images:['22bd452e-3178-4705-b85c-a9439ef2912d.png','e02a3496-59cc-4ade-a210-480c48d03641.png'], tags:['200元/人','成品帶回家!','體驗時長50分鐘'], coming:false },
      { name:'無患子清潔液', intro:'了解無患子樹的生態與果實構造。介紹清潔原理與環保特性。演示且實際製作無患子清潔液。', images:['d0bc0bce-23cd-4e25-8411-d440ee3e9416.png','79dc1690-c399-45f1-9bef-89410c370e1f.png'], tags:['250元/人','季節限定課程','成品帶回家!','體驗時長50分鐘'], coming:false },
      { name:'手洗愛玉', intro:'了解愛玉子的生態與構造，何謂隱花果、果膠特性和凝固原理。愛玉是如何授粉並加深對自然食材的了解，並學習如何與其他食物搭配。', images:['9af9354d-3243-453f-83e4-8926edefc8c2.png','e2cc5721-66e6-4254-94ad-738b5c25c17b.png'], tags:['200元/人','即時體驗','體驗時長50分鐘'], coming:false },
    ]
  },
  {
    key: 'baking',
    label: '食農烘焙體驗',
    icon: '🍕',
    desc: '從田間到餐桌，親手製作香草披薩、小餐包，並走訪香藥草園，體驗食物與農業之間最真實的連結。',
    courses: [
      { name:'烘焙披薩', intro:'認識小麥種植過程與如何變成麵粉，介紹麵粉的特性與用途。講解園區自種友善農耕香草的環保議題，帶領學員親手製作屬於自己的披薩。通過這些實踐，學員能更好地理解食物與農業緊密的關係，提升對自然的尊重與感恩之心。', images:['ee74b7fa-fbeb-43dc-9112-7562bc60c8bb.png','d9878a79-61ab-4324-b84f-2d8c98c4c785.png','9cdda085-18ca-4d28-819d-081df6e26b5b.png'], tags:['1500元/組(3-5人)','體驗時長60分鐘'], coming:false },
      { name:'烘焙小餐包', intro:'了解烘焙的基本原理（如發酵、揉捏）與食材的選擇。講解園區自種友善農耕香草的環保議題，帶領學員親手製作屬於自己的小餐包。通過這些實踐，學員能更好地理解食物與農業緊密的關係，提升對自然的尊重與感恩之心。', images:['臉書貼文_(1).png','07366da2-fd6d-40f7-ae91-8d0deb959084.png','c3566679-ab70-48b4-822f-b1ec62c7c4ab.png'], tags:['1000元/組(3-5人)','體驗時長60分鐘'], coming:false },
      { name:'香藥草園導覽', intro:'認識香藥草植物', images:['臉書貼文.png'], tags:['2000元/場(20人以下)','即時體驗','體驗時長20-40分鐘'], coming:false },
    ]
  },
  {
    key: 'senior',
    label: '高齡運動專業知能',
    icon: '🏃',
    desc: '專為不同年齡層設計的健康運動課程，結合地板滾球、精油運動與環形運動，促進身心健康，享受活動的樂趣。',
    courses: [
      { name:'地板滾球競賽', intro:'提高精確度與控制力，在比賽中對每一次推球的力度與方向進行精確控制。促進團隊合作與競爭精神，根據對方的行動迅速做出反應並調整策略。寓教於樂，增強學習樂趣。', images:['5bf961dc-eb46-44a7-b264-dbf1ef0834aa.png','49b59b5e-5e5c-437d-a322-ef321d93b575.png'], tags:['550元/人','體驗時長90分鐘'], coming:false },
      { name:'精油運動', intro:'精油的使用能有效幫助學員提升精神集中力，增進運動舒適度與效能。結合運動創造了更具趣味和療癒感的運動體驗。', images:['b6136977-a265-48f3-8420-2076352570d1.png','07e4a21c-1e0b-464d-9669-aea45d66d19d.png','9a9fc814-b024-4eef-9686-cf697568edc9.png'], tags:['350元/人','體驗時長50分鐘'], coming:false },
      { name:'環形運動', intro:'適合不同年齡層，整合上下肢、核心、背部等多個部位的偕同運作，多變的路徑和不同挑戰模式使得課程充滿趣味。對日常活動中的動作協調和反應能力有極大的提升，並能有效緩解壓力。', images:['78907d2d-961e-4306-8690-dc2d2659dcf0.png','da7817bf-1cbf-4eb2-9882-a0157ac6943f.png'], tags:['250元/人','體驗時長50分鐘'], coming:false },
      { name:'地板滾球體驗', intro:'讓學員了解地板滾球的基本規則及技巧，提升動作協調性、專注力與團隊合作精神，讓學員在競爭中獲得樂趣並學習如何控制運動強度。', images:['87f4886e-753f-4ddb-bd38-5a3eca9782ca.png','f8a1bbdb-bb64-4c44-b11d-0cf7720c4699.png'], tags:['400元/人','體驗時長60分鐘'], coming:false },
      { name:'精油運動(含精油隨身瓶)', intro:'精油的使用能有效幫助學員提升精神集中力，增進運動舒適度與效能。結合運動創造了更具趣味和療癒感的運動體驗。', images:['b6136977-a265-48f3-8420-2076352570d1.png','07e4a21c-1e0b-464d-9669-aea45d66d19d.png','9a9fc814-b024-4eef-9686-cf697568edc9.png'], tags:['600元/人','成品帶回家!','體驗時長50分鐘'], coming:false },
      { name:'高齡體驗', intro:'', images:[], tags:[], coming:true },
    ]
  },
]

const activeCat = ref('nature')
const modal = ref(null)
const activeImg = ref(0)

const currentCat = computed(() => categories.find(c => c.key === activeCat.value))

const openModal = (course) => {
  modal.value = course
  activeImg.value = 0
}
const closeModal = () => { modal.value = null }

const tagClass = (tag) => {
  if (tag.includes('元')) return 'ctag-price'
  if (tag.includes('成品帶回家')) return 'ctag-gift'
  if (tag.includes('即時體驗')) return 'ctag-instant'
  if (tag.includes('季節限定')) return 'ctag-season'
  if (tag.includes('時長')) return 'ctag-time'
  if (tag.includes('兩人即可')) return 'ctag-min'
  return 'ctag-default'
}

const tagIcon = (tag) => {
  if (tag.includes('元')) return '💰'
  if (tag.includes('成品帶回家')) return '🎁'
  if (tag.includes('即時體驗')) return '⚡'
  if (tag.includes('季節限定')) return '🍂'
  if (tag.includes('時長')) return '⏱'
  if (tag.includes('兩人即可')) return '👥'
  return '•'
}
</script>

<template>
  <div class="overflow">

    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/cafe/mobile-cafe-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/cafe/cafe-cover.png" alt="">
        <img class="cover-title" src="/images/course/course-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 體驗課程
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3 sub-nav">體驗課程</div>
        <div class="bar-green bar-green-center"></div>

        <div class="row bg-greenweb py-4 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-4 px-3">

                <!-- Category Tabs -->
                <div class="tc-cat-tabs mb-3">
                  <button
                      v-for="cat in categories"
                      :key="cat.key"
                      class="tc-cat-tab"
                      :class="{ active: activeCat === cat.key }"
                      @click="activeCat = cat.key"
                  >
                    <span>{{ cat.icon }}</span>
                    <span class="tc-tab-label">{{ cat.label }}</span>
                    <span class="tc-tab-count">{{ cat.courses.length }}</span>
                  </button>
                </div>

                <!-- Category Description -->
                <p class="tc-cat-desc mb-4">{{ currentCat.desc }}</p>

                <!-- Course Grid -->
                <div class="tc-courses-grid">
                  <div
                      v-for="course in currentCat.courses"
                      :key="course.name"
                      class="tc-card"
                      :class="{ 'is-coming': course.coming }"
                      @click="!course.coming && openModal(course)"
                  >
                    <div class="tc-card-img-wrap">
                      <img
                          v-if="course.images.length"
                          :src="`/images/book/trial-course/${course.images[0]}`"
                          :alt="course.name"
                          class="tc-card-img"
                      />
                      <div v-else class="tc-card-img-placeholder">
                        <span>{{ currentCat.icon }}</span>
                      </div>
                      <div v-if="course.coming" class="tc-coming-badge">籌備中</div>
                      <div v-if="!course.coming" class="tc-card-hover-hint">查看詳情</div>
                    </div>
                    <div class="tc-card-body">
                      <h3 class="tc-card-name">{{ course.name }}</h3>
                      <p v-if="course.intro" class="tc-card-intro">{{ course.intro }}</p>
                      <p v-else class="tc-card-intro muted">課程籌備中，敬請期待</p>
                      <div class="tc-card-tags">
                        <span v-for="tag in course.tags" :key="tag" class="ctag" :class="tagClass(tag)">{{ tag }}</span>
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
    <Teleport to="body">
      <Transition name="tc-modal-fade">
        <div v-if="modal" class="tc-modal-backdrop" @click.self="closeModal">
          <div class="tc-modal-box">
            <button class="tc-modal-close" @click="closeModal">✕</button>

            <div class="tc-modal-gallery" v-if="modal.images.length">
              <div class="tc-gallery-main">
                <img
                    :src="`/images/book/trial-course/${modal.images[activeImg]}`"
                    :alt="modal.name"
                    class="tc-gallery-main-img"
                />
              </div>
              <div v-if="modal.images.length > 1" class="tc-gallery-thumbs">
                <img
                    v-for="(img, i) in modal.images"
                    :key="i"
                    :src="`/images/course/sub/${img}`"
                    class="tc-gallery-thumb"
                    :class="{ active: activeImg === i }"
                    @click="activeImg = i"
                />
              </div>
            </div>
            <div v-else class="tc-modal-no-img">
              <span>{{ currentCat.icon }}</span>
            </div>

            <div class="tc-modal-info">
              <div class="tc-modal-cat-badge">{{ currentCat.label }}</div>
              <h2 class="tc-modal-name">{{ modal.name }}</h2>
              <p v-if="modal.intro" class="tc-modal-intro">{{ modal.intro }}</p>
              <div class="tc-modal-details">
                <div v-for="tag in modal.tags" :key="tag" class="tc-detail-row">
                  <span class="tc-detail-icon">{{ tagIcon(tag) }}</span>
                  <span class="tc-detail-text">{{ tag }}</span>
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
/* ── Category Tabs ── */
.tc-cat-tabs {
  display: flex; flex-wrap: wrap; gap: 0.4rem;
}
.tc-cat-tab {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  border: 1.5px solid #dce8d8; border-radius: 999px;
  background: #fff; color: #5a6e54;
  font-family: inherit; font-size: 0.82rem;
  cursor: pointer; white-space: nowrap; transition: all 0.18s;
}
.tc-cat-tab:hover { border-color: #3d7a52; color: #1a3d28; }
.tc-cat-tab.active { background: #3d7a52; border-color: #3d7a52; color: #fff; }
.tc-tab-label { font-weight: 500; }
.tc-tab-count {
  font-size: 0.68rem; background: rgba(0,0,0,0.08);
  padding: 0.08rem 0.4rem; border-radius: 999px;
}
.tc-cat-tab.active .tc-tab-count { background: rgba(255,255,255,0.25); }

/* ── Category Description ── */
.tc-cat-desc {
  font-size: 0.86rem; color: #5a6e54; line-height: 1.65;
  background: #f4f9f2; border-radius: 8px;
  padding: 0.75rem 1rem; margin: 0;
  border-left: 3px solid #3d7a52;
}

/* ── Grid ── */
.tc-courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* ── Card ── */
.tc-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  transition: transform 0.22s, box-shadow 0.22s;
  display: flex; flex-direction: column;
}
.tc-card:not(.is-coming) { cursor: pointer; }
.tc-card:not(.is-coming):hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.12); }
.is-coming { opacity: 0.6; }
.tc-card-img-wrap { position: relative; height: 190px; background: #e8f0eb; overflow: hidden; }
.tc-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.tc-card:not(.is-coming):hover .tc-card-img { transform: scale(1.04); }
.tc-card-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; background: linear-gradient(135deg, #e8f0eb, #d4e6da);
}
.tc-coming-badge {
  position: absolute; top: 0.65rem; left: 0.65rem;
  background: rgba(40,80,50,0.8); color: #fff;
  font-size: 0.7rem; padding: 0.18rem 0.6rem; border-radius: 999px;
}
.tc-card-hover-hint {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(30,60,30,0.6); color: #fff;
  text-align: center; font-size: 0.76rem; padding: 0.4rem;
  opacity: 0; transition: opacity 0.22s;
}
.tc-card:hover .tc-card-hover-hint { opacity: 1; }
.tc-card-body { padding: 1rem 1.1rem 1.1rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.tc-card-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 1rem; font-weight: 600; margin: 0; color: #1a3d28;
}
.tc-card-intro {
  font-size: 0.81rem; line-height: 1.7; color: #4a5e44; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.tc-card-intro.muted { color: #8a9e84; font-style: italic; }
.tc-card-tags { display: flex; flex-wrap: wrap; gap: 0.28rem; margin-top: auto; }

/* ── Tags ── */
.ctag { font-size: 0.68rem; padding: 0.13rem 0.5rem; border-radius: 999px; font-weight: 500; }
.ctag-price   { background: #fef3e2; color: #92400e; }
.ctag-gift    { background: #fce7f3; color: #9d174d; }
.ctag-instant { background: #ecfdf5; color: #065f46; }
.ctag-season  { background: #fff7ed; color: #c2410c; }
.ctag-time    { background: #eff6ff; color: #1e40af; }
.ctag-min     { background: #f5f3ff; color: #5b21b6; }
.ctag-default { background: #f0f4ee; color: #5a6e54; }

/* ── Modal ── */
.tc-modal-backdrop {
  position: fixed; inset: 0; background: rgba(10,25,15,0.78); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; backdrop-filter: blur(5px);
}
.tc-modal-box {
  background: #fff; border-radius: 16px;
  max-width: 760px; width: 100%; max-height: 90vh; overflow-y: auto;
  position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.35);
}
.tc-modal-close {
  position: sticky; top: 1rem; float: right; margin: 1rem 1rem 0 0;
  background: #f0f4ee; border: none; width: 1.9rem; height: 1.9rem;
  border-radius: 50%; cursor: pointer; font-size: 0.85rem; color: #4a6044;
  display: flex; align-items: center; justify-content: center; z-index: 2;
}
.tc-modal-close:hover { background: #dce8d8; }
.tc-gallery-main { height: 260px; background: #e8f0eb; overflow: hidden; border-radius: 16px 16px 0 0; }
.tc-gallery-main-img { width: 100%; height: 100%; object-fit: cover; }
.tc-gallery-thumbs { display: flex; gap: 0.45rem; padding: 0.65rem 1rem; }
.tc-gallery-thumb {
  width: 56px; height: 42px; object-fit: cover; border-radius: 5px;
  border: 2px solid transparent; cursor: pointer; opacity: 0.65; transition: all 0.15s;
}
.tc-gallery-thumb:hover { opacity: 1; }
.tc-gallery-thumb.active { border-color: #3d7a52; opacity: 1; }
.tc-modal-no-img {
  height: 140px; background: linear-gradient(135deg, #e8f0eb, #d4e6da);
  display: flex; align-items: center; justify-content: center;
  font-size: 3.5rem; border-radius: 16px 16px 0 0;
}
.tc-modal-info { padding: 1.1rem 1.5rem 1.75rem; }
.tc-modal-cat-badge {
  display: inline-block; font-size: 0.7rem;
  background: #e8f2e5; color: #3d7a52;
  padding: 0.15rem 0.55rem; border-radius: 999px; margin-bottom: 0.5rem; font-weight: 500;
}
.tc-modal-name {
  font-family: 'Noto Serif TC', serif;
  font-size: 1.5rem; font-weight: 700; color: #1a3d28; margin: 0 0 0.65rem;
}
.tc-modal-intro { font-size: 0.88rem; line-height: 1.85; color: #3a4e36; margin: 0 0 1.1rem; }
.tc-modal-details { display: flex; flex-direction: column; gap: 0.4rem; }
.tc-detail-row { display: flex; align-items: center; gap: 0.55rem; font-size: 0.84rem; color: #4a5e44; }
.tc-detail-icon { width: 1.3rem; text-align: center; flex-shrink: 0; }
.tc-detail-text { font-weight: 500; }

.tc-modal-fade-enter-active, .tc-modal-fade-leave-active { transition: opacity 0.25s; }
.tc-modal-fade-enter-from, .tc-modal-fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .tc-gallery-main { height: 190px; }
  .tc-cat-tab { font-size: 0.76rem; padding: 0.42rem 0.7rem; }
}
</style>