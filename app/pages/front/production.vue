<script setup>
definePageMeta({ layout: 'front' })

useSiteHead()

const commonStore = useCommonStore()
const BASE        = computed(() => commonStore.data.main_url + '/holy/production-item')
const API_ORIGIN  = computed(() => commonStore.data.main_url)

const apiUrl = (path) => {
  if (!path || path.startsWith('http')) return path
  return API_ORIGIN.value + path
}

const itemList = ref([])
const fetchItems = async () => {
  try {
    itemList.value = await (await fetch(`${BASE.value}/list`)).json()
  } catch {
    itemList.value = []
  }
}

onMounted(() => {
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) {
      btn.style.display =
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block'
          : 'none'
    }
  }
  fetchItems()
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
        <img class="img-fluid d-md-none mob-cover" src="/images/product/mobile-product-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/product/product-cover.png" alt="">
        <img class="cover-title" src="/images/product/product-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 產品訂購
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-4 py-2 sub-nav">產品訂購</div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">

                <!-- 介紹文字 -->
                <div class="row pt-4 justify-content-center no-gutters">
                  <div class="col-10">
                    <p>
                      親愛的朋友：<br>
                      平安！很高興與您分享我們向大自然學習，從泥土、植物、和愛的生活中製作的產品。<br>
                      我們的自然農法香藥草及農產品無化肥、無農藥，從種植、採摘、烘乾包裝全程由農夫完成。<br>
                      全食物烘焙坊則使用真食材，全粒麥麵粉、在地蔬果、頂級紐西蘭奶油、不使用氫化油脂、酥油、合成香精、防腐劑及添加物。<br>
                      <br>
                      <a target="_blank" href="https://shopping.st-mary.org.tw/index.php">線上訂購</a>
                      傳真訂購：<a target="_blank" href="/file/order.pdf">商品訂購單下載</a><br>
                      <br>
                      來電訂購專線：089–381382分機888 周一至周六 上午8:00至下午5:30
                    </p>
                  </div>
                </div>

                <!-- 產品列表 -->
                <div class="row px-4 py-2">
                  <template v-if="itemList.length > 0">
                    <div v-for="item in itemList" :key="item.id" class="col-12 col-md-4 mb-4">
                      <component :is="item.link ? 'a' : 'div'"
                                 v-bind="item.link ? { href: item.link, target: '_blank' } : {}"
                                 :style="item.link ? '' : 'cursor:default'">
                        <div class="card cus-card">
                          <img v-if="item.coverUrl" :src="apiUrl(item.coverUrl)" class="img-fluid" :alt="item.name">
                          <div v-else class="img-fluid bg-light d-flex align-items-center justify-content-center"
                               style="height:200px; color:#ccc;">
                            <i class="fas fa-image fa-3x"></i>
                          </div>
                          <div class="card-body py-2">
                            <p class="card-text text-center prod-color">
                              {{ item.name }}
                              <i v-if="item.link" class="fas fa-chevron-right arrow-right"></i>
                            </p>
                          </div>
                        </div>
                      </component>
                    </div>
                  </template>

                  <!-- 尚無資料時保留原始靜態內容 -->
                  <template v-else>
                    <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=9" target="_blank">
                      <div class="col-12 col-md-4">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/1/healthfarm_product1_photo4.jpg" alt="修女祈福蛋糕">
                          <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=9" class="card-body py-2" target="_blank">
                            <p class="card-text text-center prod-color">修女祈福蛋糕<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                    <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=36" target="_blank">
                      <div class="col-12 col-md-4">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/other/healthfarm_product_photo08.jpg" alt="芳心好美系列精油">
                          <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=36" class="card-body py-2" target="_blank">
                            <p class="card-text text-center prod-color">芳心好美系列精油<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                    <a href="https://shopping.st-mary.org.tw/product_detail.php?i=203&di=34" target="_blank">
                      <div class="col-12 col-md-4 mt-4 mt-md-0">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/other/healthfarm_product_photo07.jpg" alt="草本足浴包">
                          <a href="https://shopping.st-mary.org.tw/product_detail.php?i=203&di=34" class="card-body py-2">
                            <p class="card-text text-center prod-color">草本足浴包<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                    <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=23" target="_blank">
                      <div class="col-12 col-md-4 mt-4 mt-md-0">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/4/healthfarm_product4_photo1.jpg" alt="手工麵包">
                          <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=23" class="card-body py-2" target="_blank">
                            <p class="card-text text-center prod-color">手工麵包<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                    <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=19" target="_blank">
                      <div class="col-12 col-md-4 mt-4 mt-md-0">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/5/healthfarm_product5_photo1.jpg" alt="香藥草">
                          <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=19" class="card-body py-2" target="_blank">
                            <p class="card-text text-center prod-color">香 藥 草<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                    <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=24" target="_blank">
                      <div class="col-12 col-md-4 mt-4 mt-md-0">
                        <div class="card cus-card">
                          <img class="img-fluid" src="/images/product/other/healthfarm_product_photo06.jpg" alt="禮盒">
                          <a href="https://shopping.st-mary.org.tw/index.php?dir=1&di=24" class="card-body py-2" target="_blank">
                            <p class="card-text text-center prod-color">禮 盒<i class="fas fa-chevron-right arrow-right"></i></p>
                          </a>
                        </div>
                      </div>
                    </a>
                  </template>
                </div>

              </div>
            </div>
          </div>
          <div class="bar-green bar-green-center2"></div>
        </div>
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

  </div>
</template>

