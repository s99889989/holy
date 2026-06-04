<script setup>
definePageMeta({
  layout: 'front',
  scrollToTop: false
})

useSiteHead()

const route = useRoute()

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

// 當前文章
const currentIndex = computed(() => allNews.value.findIndex(n => n.id === route.params.id))
const record = computed(() => allNews.value[currentIndex.value])

// 上一則 / 下一則
const prevId = computed(() => allNews.value[currentIndex.value - 1]?.id ?? null)
const nextId = computed(() => allNews.value[currentIndex.value + 1]?.id ?? null)

// 年份（供 tab 顯示）
const articleYear = computed(() => record.value?.date?.slice(0, 4) ?? String(new Date().getFullYear()))
const lastYear = computed(() => Number(articleYear.value) - 1)

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

// 切換文章時滾到 article-anchor
function scrollToAnchor() {
  nextTick(() => {
    if (import.meta.client) {
      setTimeout(() => {
        const el = document.getElementById('article-anchor')
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
      }, 50)
    }
  })
}
const formatContent = (text) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}
watch(() => route.params.id, () => {
  scrollToAnchor()
}, { immediate: true })
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
        <NuxtLink to="/front/public">首頁</NuxtLink> >
        <NuxtLink to="/front/news">最新消息</NuxtLink>
      </section>

      <section id="content" class="mx-3 mx-sm-5">
        <!-- 年份 Tab -->
        <div class="col-12 text-center my-3 sub-nav">
          <NuxtLink :to="`/front/news?year=${articleYear}`" class="active">{{ articleYear }}</NuxtLink>
          |
          <NuxtLink :to="`/front/news?year=${lastYear}`">{{ lastYear }}</NuxtLink>
        </div>

        <div id="article-anchor" style="scroll-margin-top: 80px;"></div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3 px-sm-5">

                <template v-if="record">
                  <!-- 文章 header -->
                  <div class="row p-4 no-gutters justify-content-center">
                    <div class="col-10 news-date">{{ record.date }}</div>
                    <div class="col-10">
                      <p class="news-title">{{ record.title }}</p>
                    </div>
                    <div class="col-10 news-divider mb-4"></div>
                    <div class="col-10 col-sm-8 text-center">
                      <img :src="apiUrl(record.coverUrl)" alt="" class="img-fluid">
                    </div>
                  </div>
                  <!-- 文章內容 -->
                  <div class="row">
                    <div class="col-10 col-md-8 mx-auto artical-content" v-html="formatContent(record.content)"></div>
                  </div>
                </template>

                <div v-else class="text-center py-5 text-muted">找不到此篇消息</div>

              </div>
              <div class="col-12 bar-news my-3"></div>
            </div>
          </div>
        </div>

        <div class="bar-green bar-green-center2"></div>

        <!-- 上一則 / 下一則 -->
        <div class="col-12 text-center my-3 sub-nav">
          <NuxtLink v-if="prevId" :to="`/front/news/${prevId}`">上一則</NuxtLink>
          <span v-else class="text-muted">上一則</span>
          |
          <NuxtLink v-if="nextId" :to="`/front/news/${nextId}`">下一則</NuxtLink>
          <span v-else class="text-muted">下一則</span>
        </div>

        <!-- 回列表 -->
        <div class="col-12 col-md-12 text-center mt-5">
          <div class="btn col-md-6 cus-button">
            <NuxtLink to="/front/news">回最新消息首頁</NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>
  </div>
</template>
