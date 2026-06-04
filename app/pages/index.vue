<script setup>
import { useCommonStore } from '~/stores/common.js'

definePageMeta({ layout: 'front' })

useSiteHead()

onMounted(() => {
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display
        = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block'
          : 'none'
    }
  }

  nextTick(() => {
    // ✅ 初始化 AOS
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({
        duration: 800,
        once: true // 因為所有元素都用了 data-aos-once="true"
      })
    }
  })
  fetchNews()
  fetchProducts().then(() => {
    nextTick(() => {
      if (typeof window !== 'undefined' && window.$) {
        window.$('#carousel-mobile').carousel({ interval: 5000, ride: 'carousel' })
        window.$('#carousel-with-lb').carousel({ interval: 5000, ride: 'carousel' })
      }
    })
  })
})

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

function carouselPrev() {
  if (typeof window !== 'undefined' && window.$) {
    window.$('#carousel-mobile').carousel('prev')
    window.$('#carousel-with-lb').carousel('prev')
  }
}

function carouselNext() {
  if (typeof window !== 'undefined' && window.$) {
    window.$('#carousel-mobile').carousel('next')
    window.$('#carousel-with-lb').carousel('next')
  }
}

const commonStore = useCommonStore()
const BASE_NEWS = computed(() => commonStore.data.main_url + '/holy/news')
const BASE_PRODUCT = computed(() => commonStore.data.main_url + '/holy/product')
const API_ORIGIN = computed(() => commonStore.data.main_url)

const apiUrl = (path) => {
  if (!path || path.startsWith('http')) return path
  return API_ORIGIN.value + path
}

// ── 最新消息 ──────────────────────────────────────────────────────
const allNews = ref([])
const newsLoading = ref(false)
const fetchNews = async () => {
  newsLoading.value = true
  try {
    allNews.value = await (await fetch(`${BASE_NEWS.value}/list`)).json()
  } catch {
    allNews.value = []
  } finally {
    newsLoading.value = false
  }
}

// ── 推薦農產品 ─────────────────────────────────────────────────────
const allProducts = ref([])
const fetchProducts = async () => {
  try {
    allProducts.value = await (await fetch(`${BASE_PRODUCT.value}/list`)).json()
  } catch {
    allProducts.value = []
  }
}

// mobile 每頁 2 張，desktop 每頁 4 張
const productSlidesMobile = computed(() => chunkArray(allProducts.value, 2))
const productSlidesDesktop = computed(() => chunkArray(allProducts.value, 4))

function openProductLink(item) {
  if (item.link) {
    window.open(item.link, '_blank', 'noopener')
  }
}

function chunkArray(arr, size) {
  const result = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}
</script>

<template>
  <div class="overflow">
    <!-- Cover -->
    <section />
    <div class="por d-xl-none" />
    <img
      class="img-fluid d-lg-none"
      src="/images/homepage/healthfarm_hp_mobilephoto1.jpg"
      style="opacity: 0;"
      alt=""
    >
    <div class="homepage-cover d-lg-none">
      <img
        class="img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_mobilephoto4.jpg"
        alt=""
      >
      <img
        class="img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_mobilephoto3.jpg"
        alt=""
      >
      <img
        class="img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_mobilephoto2.jpg"
        alt=""
      >
      <img
        class="img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_mobilephoto1.jpg"
        alt=""
      >
    </div>
    <img
      class="img-fluid d-none d-lg-inline-block"
      src="/images/homepage/healthfarm_hp_topphoto1.jpg"
      style="opacity: 0;"
      alt=""
    >
    <div class="homepage-cover d-none d-lg-inline-block">
      <img
        class="desktop-cover-mask img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_topphoto4.jpg"
        alt=""
      >
      <img
        class="desktop-cover-mask img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_topphoto3.jpg"
        alt=""
      >
      <img
        class="desktop-cover-mask img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_topphoto2.jpg"
        alt=""
      >
      <img
        class="desktop-cover-mask img-fluid cover-slider"
        src="/images/homepage/healthfarm_hp_topphoto1.jpg"
        alt=""
      >
    </div>
    <img
      src="/images/homepage/healthfarm_hp_ill_sun.png"
      class="sun"
      alt=""
    >

    <!-- Introduce -->
    <div class="container mb-5 pb-5">
      <div class="row justify-content-center por mb-0 mb-md-5">
        <img
          src="/images/homepage/healthfarm_hp_ill_cloud1.png"
          class="hp-cloud1"
          alt=""
        >
        <img
          src="/images/homepage/healthfarm_hp_ill_cloud2.png"
          class="hp-cloud2"
          alt=""
        >
        <img
          src="/images/homepage/healthfarm_hp_ill_cloud3.png"
          class="hp-cloud3"
          alt=""
        >
        <div class="text-center py-3 mt-5">
          <img
            src="/images/homepage/healthfarm_hp_four_title.png"
            class="intro-title mt-4 mt-md-0"
            alt=""
          >
        </div>
        <div class="col-12">
          <p class="text-center intro-text">
            健康由安全飲食出發，<br class="d-md-none">我們希望能成為民眾健康的促進者，<br class="d-md-none">除提供安全的飲食外，<br
              class="d-none d-md-inline-block"
            >
            也積極與部落及小農合作，<br class="d-md-none">輔導提供安全或有機的食材，<br>
            期盼能帶動部落朝向安全有機發展，<br class="d-md-none">進而改善促進部落與小農經濟。
          </p>
        </div>
      </div>
    </div>

    <!-- Four Features -->
    <div class="bg-greenweb por pt-3 py-md-5">
      <div class="container">
        <!-- Mobile -->
        <div class="row d-md-none px-4">
          <NuxtLink
            to="/front/about"
            class="col-6 col-md-3"
          >
            <img
              src="/images/homepage/mb-four-about.png"
              class="img-fluid mob-four"
              alt=""
            >
          </NuxtLink>
          <NuxtLink
            to="/front/production"
            class="col-6 col-md-3"
          >
            <img
              src="/images/homepage/mb-four-prod.png"
              class="img-fluid mob-four"
              alt=""
            >
          </NuxtLink>
          <NuxtLink
            to="/front/cafe"
            class="col-6 col-md-3"
          >
            <img
              src="/images/homepage/mb-four-cafe.png"
              class="img-fluid mob-four2"
              alt=""
            >
          </NuxtLink>
          <NuxtLink
            to="/front/restaurant"
            class="col-6 col-md-3"
          >
            <img
              src="/images/homepage/mb-four-restaruant.png"
              class="img-fluid mob-four2"
              alt=""
            >
          </NuxtLink>
        </div>
        <!-- Desktop -->
        <div class="row por pb-3">
          <div
            class="col-3 por d-none d-md-inline-block"
            data-aos="fade-up"
            data-aos-once="true"
          >
            <NuxtLink to="/front/about">
              <img
                src="/images/homepage/healthfarm_hp_four_about.png"
                class="cycle-title-top"
                alt=""
              >
              <img
                src="/images/homepage/healthfarm_hp_four_grassring.png"
                class="cycle-grass-top"
                alt=""
              >
              <div class="cycle-top-mask">
                <img
                  src="/images/homepage/healthfarm_hp_four_about_photo.png"
                  class="cycle-top"
                  alt=""
                >
              </div>
            </NuxtLink>
          </div>
          <div
            class="col-3 por d-none d-md-inline-block"
            data-aos="fade-up"
            data-aos-once="true"
          >
            <NuxtLink to="/front/production">
              <img
                src="/images/homepage/healthfarm_hp_four_prod.png"
                class="cycle-title-bottom"
                alt=""
              >
              <img
                src="/images/homepage/healthfarm_hp_four_grassring.png"
                class="cycle-grass-bottom"
                alt=""
              >
              <div class="cycle-bottom-mask">
                <img
                  src="/images/homepage/healthfarm_hp_four_prod_photo.png"
                  class="cycle-bottom"
                  alt=""
                >
              </div>
            </NuxtLink>
          </div>
          <div
            class="col-3 por d-none d-md-inline-block"
            data-aos="fade-up"
            data-aos-once="true"
          >
            <NuxtLink to="/front/restaurant">
              <img
                src="/images/homepage/healthfarm_hp_four_restaurant.png"
                class="cycle-title-bottom"
                alt=""
              >
              <img
                src="/images/homepage/healthfarm_hp_four_grassring.png"
                class="cycle-grass-bottom"
                alt=""
              >
              <div class="cycle-bottom-mask">
                <img
                  src="/images/homepage/healthfarm_hp_four_restaurant_photo.png"
                  class="cycle-bottom"
                  alt=""
                >
              </div>
            </NuxtLink>
          </div>
          <div
            class="col-3 por d-none d-md-inline-block"
            data-aos="fade-up"
            data-aos-once="true"
          >
            <NuxtLink to="/front/cafe">
              <img
                src="/images/homepage/healthfarm_hp_four_cafe.png"
                class="cycle-title-top"
                alt=""
              >
              <img
                src="/images/homepage/healthfarm_hp_four_grassring.png"
                class="cycle-grass-top"
                alt=""
              >
              <div class="cycle-top-mask">
                <img
                  src="/images/homepage/healthfarm_hp_four_cafe_photo.png"
                  class="cycle-top"
                  alt=""
                >
              </div>
            </NuxtLink>
          </div>
        </div>
        <div class="py-md-5" />
      </div>
    </div>

    <!-- News -->
    <div class="container mt-2 por">
      <div class="col-12 bar-green bar-green-center2" />
      <img
        src="/images/homepage/healthfarm_hp_news_ill_flowers.png"
        class="ill-flowsers-reverse"
        alt=""
      >
      <img
        src="/images/homepage/healthfarm_hp_news_ill_flowers.png"
        class="ill-flowsers"
        alt=""
      >
      <div class="row justify-content-center">
        <div>
          <img
            src="/images/homepage/healthfarm_hp_news_title.png"
            class="my-lg-5 mt-md-5 feature-title"
            alt=""
          >
        </div>
      </div>
      <div class="por">
        <img
          src="/images/homepage/healthfarm_hp_ill_butterfly1.png"
          class="butterfly1"
          alt=""
        >
        <img
          src="/images/homepage/healthfarm_hp_ill_butterfly2.png"
          class="butterfly2"
          alt=""
        >
        <img
          src="/images/homepage/healthfarm_hp_ill_butterfly3.png"
          class="butterfly3"
          alt=""
        >
      </div>
      <div class="row justify-content-center no-gutters mt-5">
        <div class="col-10 bg-white rounded por justify-content-center">
          <img
            src="/images/homepage/people2.png"
            class="d-none d-lg-inline-block img-fluid col-md-5 news-people"
            style="transform: translate(0, -100%);"
            data-aos="fade-up"
            data-aos-once="true"
            alt=""
          >
          <img
            src="/images/homepage/healthfarm_hp_news_tape.png"
            class="news-tape"
            alt=""
          >
          <div
            data-aos="fade-up"
            data-aos-delay="1000"
            data-aos-once="true"
          >
            <img
              src="/images/homepage/healthfarm_hp_news_talk1.png"
              class="d-none d-lg-inline-block col-md-2 img-fluid news-talk1"
              alt=""
            >
          </div>
          <div
            data-aos="fade-up"
            data-aos-delay="1500"
            data-aos-once="true"
          >
            <img
              src="/images/homepage/healthfarm_hp_news_talk2.png"
              class="d-none d-lg-inline-block col-md-2 img-fluid news-talk2"
              alt=""
            >
          </div>
          <div class="row no-gutters justify-content-center mt-md-3">
            <template
              v-for="item in allNews.slice(0, 3)"
              :key="item.id"
            >
              <div class="col-10 my-3">
                <NuxtLink
                  :to="`/front/news/${item.id}`"
                  style="color: #44271a; text-decoration: none;"
                >
                  <span class="news-date">{{ item.date }} {{ item.title }}</span>
                </NuxtLink>
              </div>
              <div class="col-10 bar-black-dashed my-2" />
            </template>
            <div class="col-12 text-center my-3">
              <div class="btn col-md-6 cus-button">
                <NuxtLink to="/front/news">更多最新消息</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="py-5" />
    </div>
    <div class="bg-greenweb py-2 por">
      <img
        src="/images/homepage/healthfarm_hp_news_bgphoto.png"
        alt=""
        class="img-fluid news-photo"
      >
    </div>

    <!-- Products -->
    <div class="container py-lg-4">
      <div class="por mt-2 mx-3 mob-prod">
        <div class="text-center my-2">
          <img
            src="/images/homepage/healthfarm_hp_prod_title.png"
            class="feature-title my-md-5"
            alt=""
          >
        </div>
        <div
          class="col-sm-12"
          style="transform: translate(0);"
        >
          <div class="row mx-auto">
            <a
              href="javascript:void(0)"
              @click.prevent="carouselPrev"
            >
              <img
                src="/images/homepage/healthfarm_hp_prod_arrow.png"
                class="arrow-left2"
                alt=""
              >
            </a>
            <a
              href="javascript:void(0)"
              @click.prevent="carouselNext"
            >
              <img
                src="/images/homepage/healthfarm_hp_prod_arrow.png"
                class="arrow-right2"
                alt=""
              >
            </a>
            <div class="col-sm-12 por">
              <!-- ── Mobile Carousel（每 slide 2 張）d-lg-none ── -->
              <div
                id="carousel-mobile"
                class="carousel slide carousel-multi-item d-lg-none"
                data-ride="carousel"
              >
                <div
                  class="carousel-inner"
                  role="listbox"
                >
                  <template v-if="allProducts.length > 0">
                    <div
                      v-for="(slide, si) in productSlidesMobile"
                      :key="'m'+si"
                      :class="['carousel-item text-center', si === 0 ? 'active' : '']"
                    >
                      <div class="row justify-content-center mb-2">
                        <figure
                          v-for="item in slide"
                          :key="item.id"
                          class="col-6"
                        >
                          <a
                            href="javascript:void(0)"
                            :style="item.link ? 'cursor:pointer' : 'cursor:default'"
                            @click.prevent="openProductLink(item)"
                          >
                            <img
                              v-if="item.coverUrl"
                              :src="apiUrl(item.coverUrl)"
                              class="img-fluid"
                              :alt="item.name"
                            >
                            <div
                              v-else
                              class="img-fluid bg-stone-100 rounded"
                              style="aspect-ratio:1;"
                            />
                            <p class="text-center prod-text">{{ item.name }}</p>
                          </a>
                        </figure>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="carousel-item active text-center">
                      <div class="row justify-content-center mb-2">
                        <figure class="col-6">
                          <NuxtLink to="/front/production">
                            <img
                              src="/images/homepage/prod/healthfarm_hp_prod_photo1.png"
                              class="img-fluid"
                              alt=""
                            >
                            <p class="text-center prod-text">火龍果小餐包</p>
                          </NuxtLink>
                        </figure>
                        <figure class="col-6">
                          <NuxtLink to="/front/production">
                            <img
                              src="/images/homepage/prod/healthfarm_hp_prod_photo2.png"
                              class="img-fluid"
                              alt=""
                            >
                            <p class="text-center prod-text">香蕉巧克力蛋糕</p>
                          </NuxtLink>
                        </figure>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- ── Desktop Carousel（每 slide 4 張）d-none d-lg-block ── -->
              <div
                id="carousel-with-lb"
                class="carousel slide carousel-multi-item d-none d-lg-block"
                data-ride="carousel"
              >
                <div
                  class="carousel-inner mdb-lightbox"
                  role="listbox"
                >
                  <div id="mdb-lightbox-ui">
                    <template v-if="allProducts.length > 0">
                      <div
                        v-for="(slide, si) in productSlidesDesktop"
                        :key="'d'+si"
                        :class="['carousel-item text-center', si === 0 ? 'active' : '']"
                      >
                        <div class="row justify-content-center mb-2">
                          <figure
                            v-for="item in slide"
                            :key="item.id"
                            class="col-lg-3"
                          >
                            <a
                              href="javascript:void(0)"
                              :style="item.link ? 'cursor:pointer' : 'cursor:default'"
                              @click.prevent="openProductLink(item)"
                            >
                              <img
                                v-if="item.coverUrl"
                                :src="apiUrl(item.coverUrl)"
                                class="img-fluid"
                                :alt="item.name"
                              >
                              <div
                                v-else
                                class="img-fluid bg-stone-100 rounded"
                                style="aspect-ratio:1;"
                              />
                              <p class="text-center prod-text">{{ item.name }}</p>
                            </a>
                          </figure>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="carousel-item active text-center">
                        <div class="row justify-content-center mb-2">
                          <figure class="col-lg-3">
                            <NuxtLink to="/front/production">
                              <img
                                src="/images/homepage/prod/healthfarm_hp_prod_photo1.png"
                                class="img-fluid"
                                alt=""
                              >
                              <p class="text-center prod-text">火龍果小餐包</p>
                            </NuxtLink>
                          </figure>
                          <figure class="col-lg-3">
                            <NuxtLink to="/front/production">
                              <img
                                src="/images/homepage/prod/healthfarm_hp_prod_photo2.png"
                                class="img-fluid"
                                alt=""
                              >
                              <p class="text-center prod-text">香蕉巧克力蛋糕</p>
                            </NuxtLink>
                          </figure>
                          <figure class="col-lg-3">
                            <NuxtLink to="/front/production">
                              <img
                                src="/images/homepage/prod/healthfarm_hp_prod_photo3.png"
                                class="img-fluid"
                                alt=""
                              >
                              <p class="text-center prod-text">好體力茶</p>
                            </NuxtLink>
                          </figure>
                          <figure class="col-lg-3">
                            <NuxtLink to="/front/production">
                              <img
                                src="/images/homepage/prod/healthfarm_hp_prod_photo4.png"
                                class="img-fluid"
                                alt=""
                              >
                              <p class="text-center prod-text">一口酥綜合禮盒</p>
                            </NuxtLink>
                          </figure>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 text-center mb-5">
        <div class="btn cus-button">
          <NuxtLink to="/front/production">更多農產品</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Restaurant - Mobile -->
    <div class="d-lg-none">
      <div
        class="bg-restaurant py-lg-4"
        style="background-color:#b6e0d1"
      >
        <div class="row justify-content-center no-gutters">
          <div class="col-10 text-center mt-2">
            <img
              src="/images/homepage/healthfarm_hp_restaurant_title.png"
              class="feature-title mt-md-3"
              alt=""
            >
          </div>
          <p class="col-10 homepage-restaurant-p">
            "田園餐廰"以健康飲食為訴求，嚴選安全食材，優先使用農莊自產之有機蔬菜，並提供安靜舒適的用餐環境，並曾獲"食品衛生優良商店"。
          </p>
          <div class="row no-gutters justify-content-center">
            <div class="col-5 mr-3">
              <img
                src="/images/homepage/healthfarm_hp_restaurant_meals_p1.png"
                class="img-fluid"
                alt=""
              >
            </div>
            <div class="col-5">
              <img
                src="/images/homepage/healthfarm_hp_restaurant_meals_p2.png"
                class="img-fluid"
                alt=""
              >
            </div>
          </div>
          <div class="col-12 text-center pt-4 mb-5">
            <div class="btn col-12 cus-button">
              <NuxtLink to="/front/restaurant">更多田園餐廳</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <img
        src="/images/homepage/healthfarm_restaurant_bg_wave.png"
        class="img-fluid nopadding hp-restaurant-bg d-lg-none"
        alt=""
      >
    </div>

    <!-- Restaurant - Desktop -->
    <div class="d-none d-lg-inline-block">
      <div
        class="bg-restaurant por p-5"
        style="background-color:#b6e0d1"
      >
        <div class="container">
          <div class="row justify-content-center por py-5 mt-2">
            <div class="col-sm-6 align-self-center">
              <img
                src="/images/homepage/healthfarm_hp_restaurant_photo.png"
                class="img-fluid px-3"
                alt=""
              >
            </div>
            <div class="col-12 col-sm-6">
              <img
                src="/images/homepage/healthfarm_hp_restaurant_title.png"
                class="ml-2 mt-4"
                alt=""
              >
              <div class="col-sm-12">
                <p class="homepage-restaurant-p mt-3">
                  "田園餐廰"以健康飲食為訴求，嚴選安全食材，優先使用農莊自產之有機蔬菜，並提供安靜舒適的用餐環境，並曾獲"食品衛生優良商店"。
                </p>
              </div>
              <div class="row">
                <div class="col-sm-6">
                  <img
                    src="/images/homepage/healthfarm_hp_restaurant_meals_p1.png"
                    class="img-fluid por"
                    alt=""
                  >
                  <img
                    src="/images/homepage/healthfarm_hp_restaurant_meals_talkline.png"
                    class="d-none d-lg-inline-block meal-line"
                    style="position: absolute;bottom:0;left:0;transform: translate(200%, 40%) scale(0.8);"
                    data-aos="fade-up"
                    data-aos-delay="1000"
                    data-aos-once="true"
                    alt=""
                  >
                  <img
                    src="/images/homepage/healthfarm_hp_restaurant_meals_talk.png"
                    class="d-none d-lg-inline-block meal-talk"
                    style="position: absolute;left:0;bottom:0;transform: translate(-10%, 150%);"
                    data-aos="zoom-in"
                    data-aos-delay="1500"
                    data-aos-once="true"
                    alt=""
                  >
                </div>
                <div class="col-sm-6">
                  <img
                    src="/images/homepage/healthfarm_hp_restaurant_meals_p2.png"
                    class="img-fluid"
                    alt=""
                  >
                </div>
                <div class="col-sm-12 text-center pt-4">
                  <div class="btn col-12 cus-button">
                    <NuxtLink to="/front/restaurant">更多田園餐廳</NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <img
        src="/images/homepage/healthfarm_restaurant_bg_wave.png"
        class="img-fluid nopadding hp-restaurant-bg"
        alt=""
      >
    </div>

    <!-- Event -->
    <div class="por">
      <img
        src="/images/homepage/healthfarm_hp_event_ill_balloon.png"
        class="ball"
        alt=""
      >
      <img
        src="/images/homepage/healthfarm_hp_event_ill_hotairballoon.png"
        class="hotball"
        alt=""
      >
      <!-- Event - Mobile (Swiper) -->
      <div class="text-center pt-2">
        <img
          src="/images/homepage/healthfarm_hp_event_title.png"
          class="feature-title d-xl-none mt-md-5"
          alt=""
        >
      </div>
      <div
        class="swiper-container d-xl-none"
        style="transform: translateY(-30px);"
      >
        <div class="swiper-wrapper">
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo1.png"
              alt=""
              class="img-fluid"
            >
          </div>
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo2.png"
              alt=""
              class="img-fluid"
            >
          </div>
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo3.png"
              alt=""
              class="img-fluid"
            >
          </div>
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo4.png"
              alt=""
              class="img-fluid"
            >
          </div>
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo5.png"
              alt=""
              class="img-fluid"
            >
          </div>
          <div class="swiper-slide">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo6.png"
              alt=""
              class="img-fluid"
            >
          </div>
        </div>
        <div class="swiper-pagination" />
      </div>
      <div class="col-12 text-center pt-4 pb-5 d-lg-none bg-greenweb">
        <div class="btn cus-button por">
          <NuxtLink to="/front/event">我要報名</NuxtLink>
          <div
            data-aos="zoom-in"
            data-aos-once="true"
          >
            <img
              src="/images/homepage/healthfarm_hp_event_ill_bee.png"
              class="bee"
              alt=""
            >
          </div>
        </div>
      </div>
      <!-- Event - Desktop -->
      <div class="d-none col-lg-12 d-xl-inline-block pt-5">
        <div class="container">
          <div class="row mt-2 justify-content-center mb-3">
            <img
              src="/images/homepage/healthfarm_hp_event_title.png"
              alt=""
            >
          </div>
        </div>
        <div class="mt-md-5 pt-md-5" />
        <div class="mt-md-5" />
        <div
          id="carousel"
          class="d-none d-md-block"
        >
          <div class="hideLeft">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo1.png"
              alt=""
            >
          </div>
          <div class="prevLeftSecond">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo2.png"
              alt=""
            >
          </div>
          <div class="prev">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo3.png"
              alt=""
            >
          </div>
          <div class="selected">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo4.png"
              alt=""
            >
          </div>
          <div class="next">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo5.png"
              alt=""
            >
          </div>
          <div class="nextRightSecond">
            <img
              src="/images/homepage/event/healthfarm_hp_event_photo6.png"
              alt=""
            >
          </div>
        </div>
        <div class="row bg-greenweb pb-5">
          <div class="col-12 text-center pt-4 pb-5">
            <div class="btn cus-button por">
              <NuxtLink to="/front/event">我要報名</NuxtLink>
              <div
                data-aos="zoom-in"
                data-aos-once="true"
              >
                <img
                  src="/images/homepage/healthfarm_hp_event_ill_bee.png"
                  class="bee"
                  alt=""
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Links -->
    <div class="hp-links-bg py-lg-5">
      <div class="container">
        <div class="pt-5">
          <div class="pt-3 mx-4 mx-lg-5">
            <div class="row justify-content-around hp-note-bg px-2 py-4 py-md-2 por">
              <img
                src="/images/homepage/healthfarm_hp_link_flower.png"
                class="links-cover"
                alt=""
              >
              <div class="col-12">
                <div class="text-center py-2 py-lg-2 mt-md-4 mt-lg-5 mb-md-2">
                  <img
                    src="/images/homepage/healthfarm_hp_link_title.png"
                    class="feature-title d-none d-lg-inline-block"
                    alt=""
                  >
                </div>
              </div>
              <div class="col-5 col-md-3 text-center">
                <a
                  href="https://act.st-mary.org.tw"
                  target="_blank"
                >
                  <img
                    src="/images/homepage/healthfarm_hp_link_photo1.png"
                    class="px-md-3 px-lg-4 img-fluid"
                    alt=""
                  >
                  <p
                    class="text-center links-text"
                    style="transform: translateX(-10px);"
                  >台東聖母醫院高齡服務</p>
                </a>
              </div>
              <div class="col-5 col-md-3 text-center">
                <a
                  href="https://www.st-mary.org.tw/"
                  target="_blank"
                >
                  <img
                    src="/images/homepage/healthfarm_hp_link_photo2.png"
                    class="px-md-3 px-lg-4 img-fluid"
                    alt=""
                  >
                  <p class="text-center links-text">台東聖母醫院</p>
                </a>
              </div>
              <div class="col-5 col-md-3 text-center">
                <a
                  href="http://www.healthclub.org.tw/3_Meal_3.htm"
                  target="_blank"
                >
                  <img
                    src="/images/homepage/healthfarm_hp_link_photo3.png"
                    class="px-md-3 px-lg-4 img-fluid"
                    alt=""
                  >
                  <p class="text-center links-text">聖母健康會館</p>
                </a>
              </div>
              <div class="col-5 col-md-3 text-center">
                <a
                  href="http://www.healthclub.org.tw/fshm/"
                  target="_blank"
                >
                  <img
                    src="/images/homepage/healthfarm_hp_link_photo4.png"
                    class="px-md-3 px-lg-4 img-fluid"
                    alt=""
                  >
                  <p class="text-center links-text">芳心好美館</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5" />
    </div>
  </div>
</template>
