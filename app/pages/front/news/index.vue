<script setup>
definePageMeta({ layout: 'front' })

useSiteHead()

// HTML 標籤轉純文字
function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
const route = useRoute()
const latestYear = new Date().getFullYear()   // 今年，上限
const selectedYear = computed(() => Number(route.query.year) || latestYear)
const prevYear = computed(() => selectedYear.value - 1)

const commonStore = useCommonStore()
const BASE = computed(() => commonStore.data.main_url + '/holy/news')
const API_ORIGIN = computed(() => commonStore.data.main_url)

const apiUrl = (path) => {
  if (!path || path.startsWith('http')) return path
  return API_ORIGIN.value + path
}

const allNews = ref([])

const fetchNews = async () => {
  try {
    allNews.value = await (await fetch(`${BASE.value}/list`)).json()
  } catch {
    allNews.value = []
  }
}

// 依年份篩選
const newsList = computed(() =>
  allNews.value.filter(n => n.date?.startsWith(String(selectedYear.value)))
)

// ---- scroll-to-top ----
onMounted(async () => {
  await fetchNews()
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display =
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block'
          : 'none'
    }
  }
})

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}
</script>

<template>
  <div class="overflow">
    <!-- Cover -->
    <section>
      <div class="cover-box">
        <img class="img-fluid d-md-none mob-cover" src="/images/news/mb-news-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/news/news-cover.png" alt="">
        <img class="cover-title" src="/images/news/news-title.png" alt="">
      </div>
    </section>

    <div class="container">
      <!-- Breadcrumb -->
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 最新消息
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <!-- 年份 Tab -->
        <div class="col-12 text-center my-3">
          <div class="row justify-content-center no-gutters">
            <div class="sub-nav nav text-center align-items-center row justify-content-center" id="nav-tab" role="tablist">
              <!-- 往後一年（未到今年才顯示） -->
              <template v-if="selectedYear < latestYear">
                <NuxtLink
                  class="nav-item nav-link tab-link"
                  :to="`/front/news?year=${selectedYear + 1}`"
                >{{ selectedYear + 1 }}</NuxtLink>
                |
              </template>
              <!-- 當前選中年份 -->
              <span class="nav-item nav-link tab-link active">{{ selectedYear }}</span>
              |
              <!-- 往前一年（永遠顯示） -->
              <NuxtLink
                class="nav-item nav-link tab-link"
                :to="`/front/news?year=${prevYear}`"
              >{{ prevYear }}</NuxtLink>
            </div>
          </div>
        </div>

        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3 px-sm-5">

                <!-- 無資料提示 -->
                <div v-if="newsList.length === 0" class="text-center py-5 text-muted">
                  本年度尚無消息
                </div>

                <!-- 消息卡片 -->
                <template v-else>
                  <div v-for="record in newsList" :key="record.id" class="row px-2 py-4 p-lg-4 no-gutters">
                    <!-- 圖片 -->
                    <div class="col-5 col-lg-4 text-center mt-2 mt-sm-0">
                      <div class="img-frame mr-3">
                        <img :src="apiUrl(record.coverUrl)" alt="" class="img-fluid">
                      </div>
                    </div>
                    <!-- 文字 -->
                    <div class="col-7 col-lg-8 pl-sm-3">
                      <div class="row">
                        <div class="col-12 news-date">{{ record.date }}</div>
                        <div class="col-12 news-title">
                          <div class="news-title-ellipsis">{{ record.title }}</div>
                        </div>
                        <div class="col-12 text-center">
                          <div class="col-12 news-divider my-2"></div>
                        </div>
                        <div class="col-12 news-summary-ellipsis">
                          <p style="margin-bottom: 0;">{{ stripHtml(record.content) }}</p>
                        </div>
                        <div class="col-12">
                          <div class="more-button text-right">
                            <NuxtLink :to="`/front/news/${record.id}`">更 多</NuxtLink>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 bar-black-dashed my-3"></div>
                  </div>
                </template>

              </div>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center2"></div>
      </section>
    </div>

    <div class="container">
      <div class="col-12 col-md-12 text-center my-5">
        <div class="btn col-md-6 cus-button">
          <NuxtLink to="/front/public">回聖母健康農莊首頁</NuxtLink>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>
  </div>
</template>
