<script setup>
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

  // 初始化 Bootstrap carousel
  nextTick(() => {
    if (typeof window !== 'undefined' && window.$) {
      window.$('#carouselExampleIndicators').carousel({ interval: 5000, ride: 'carousel' })
    }
  })
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
        <img
          class="img-fluid d-md-none mob-cover"
          src="/images/restaurant/mobile-restaurant-cover.png"
          alt=""
        >
        <img
          class="img-fluid d-none d-md-inline-block mob-cover"
          src="/images/restaurant/restaurant-cover.png"
          alt=""
        >
        <img
          class="cover-title"
          src="/images/restaurant/restaurant-title.png"
          alt=""
        >
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <div
        id="body"
        class="container"
      />
      <section
        id="breadcrumb"
        class="my-1 mx-3 mx-sm-5"
      >
        <NuxtLink to="/front/public">首頁</NuxtLink>
        > 田園餐廳
      </section>
      <section
        id="content"
        class="mx-3 mx-sm-5"
      >
        <div class="col-12 text-center my-3">
          <div class="row justify-content-center no-gutters">
            <div
              id="nav-tab"
              class="sub-nav nav text-center align-items-center row justify-content-center"
              role="tablist"
            >
              <a
                class="nav-item nav-link tab-link active"
                href="#introduce"
              >餐廳簡介</a> |
              <a
                class="nav-item nav-link tab-link"
                href="#info"
              >營業時間</a> |
              <a
                class="nav-item nav-link tab-link"
                href="#menu"
              >用餐方式</a>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center" />
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">
                <!-- 餐廳簡介 -->
                <div class="row pt-4 justify-content-center no-gutters">
                  <div class="col-10">
                    <div class="section" />
                    <div class="circle" />
                    <div
                      id="introduce"
                      class="sub-header"
                    >
                      無國界創意料理
                    </div>
                  </div>
                  <div class="col-12 col-lg-10">
                    <div class="row pb-4 justify-content-center">
                      <div class="col-10">
                        台東聖母健康農莊於2018年4月份搬遷完成並正式營運，重新打造升級成為「高齡友善綠色照護農場」，以高齡友善融合綠色療癒的環境設計，提供長者需要的支持與尊重。
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-10 col-sm-6">
                        <img
                          src="/images/restaurant/restaurant-introduce-photo1.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                      <div class="col-10 col-sm-6 pt-3 pt-md-0">
                        <img
                          src="/images/restaurant/restaurant-introduce-photo2.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                    </div>
                    <div class="row py-4 justify-content-center">
                      <div class="col-10">
                        位於高齡友善綠色照護農場中的「田園餐廳」，秉持「土壤到餐桌」的健康促進原則，堅持採用自產或當地小農，有機或安全無毒的食材，主廚創意餐點符合低油、低糖、低鹽、高纖的料理原則，並揉合來自農莊香藥草園栽種的香藥草入菜，並提供天然香藥草茶飲以及「全食物烘焙坊」每日新鮮出爐天然無化學添加的歐式麵包、手工餅乾。
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-10 col-md-6">
                        <img
                          src="/images/restaurant/restaurant-introduce-photo3.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                      <div class="col-10 col-md-6 pt-3 pt-md-0">
                        <img
                          src="/images/restaurant/restaurant-introduce-photo4.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                    </div>
                    <div class="row py-4 justify-content-center">
                      <div class="col-10">
                        希望用餐民眾除了吃得健康無負擔外，更能達到食育目的，學習健康的生活，享受美好的人生。
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 營業時間 -->
                <div class="row pt-4 justify-content-center no-gutters">
                  <div class="col-10">
                    <div class="section" />
                    <div class="circle" />
                    <div
                      id="info"
                      class="sub-header"
                    >
                      營業時間
                    </div>
                  </div>
                  <div class="col-12 col-lg-10">
                    <div class="row justify-content-center no-gutters">
                      <div class="col-10">
                        營業時間：11:30-13:30供餐 每周日公休 (團體40人以上可疑前預約安排用餐)<br>
                        訂位電話：(089)381382#889 <br>
                        詳細資訊：即時營業資訊可加入田園餐廳LINE官方社群[<a
                          href="https://line.me/ti/g2/OZ50sFtSK0aUnYsHGxX-RVjvit0PZyjVvsh-lg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                          target="_blank"
                          rel="noopener noreferrer"
                        >田園餐廳之友</a>]，也可在此傳送訊息，提供稱呼、時間、人數可以線上快速訂位。
                      </div>
                    </div>
                    <div class="row no-gutters py-sm-4 justify-content-center">
                      <div class="col-10 col-md-6">
                        <img
                          src="/images/restaurant/restaurant-info-photo1.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                      <div class="col-10 col-md-6 py-3 pt-sm-0">
                        <img
                          src="/images/restaurant/restaurant-info-photo2.jpg"
                          class="img-fluid"
                          alt=""
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 用餐方式 -->
                <div class="row pt-4 justify-content-center no-gutters">
                  <div class="col-10">
                    <div class="section" />
                    <div class="circle" />
                    <div
                      id="menu"
                      class="sub-header"
                    >
                      用餐方式
                    </div>
                  </div>
                  <div class="col-12 col-lg-10">
                    <div class="row py-4 justify-content-center">
                      <p class="col-10">
                        聖母健康農莊"田園餐廰"以健康飲食為訴求，嚴選安全食材，優先使用農莊自產之有機蔬菜，提供安靜舒適的用餐環境；並曾獲"食品衛生優良商店"。<br><br>
                        本餐廳提供每客250元的自助餐，用餐即可使用農莊自製手工麵包、天然藥草茶飲。<br>
                        滿40人以上團體，可預約不同時段及自助餐(每人300-500元)。
                      </p>
                    </div>
                    <div class="row justify-content-center">
                      <div class="col-10 col-sm-8">
                        <div
                          id="carouselExampleIndicators"
                          class="carousel slide"
                          data-ride="carousel"
                          style="box-shadow: 10px 10px 5px #888888;"
                          data-interval="3000"
                        >
                          <ol class="carousel-indicators">
                            <li
                              data-target="#carouselExampleIndicators"
                              data-slide-to="0"
                              class="active"
                            />
                            <li
                              data-target="#carouselExampleIndicators"
                              data-slide-to="1"
                            />
                            <li
                              data-target="#carouselExampleIndicators"
                              data-slide-to="2"
                            />
                            <li
                              data-target="#carouselExampleIndicators"
                              data-slide-to="3"
                            />
                          </ol>
                          <div class="carousel-inner">
                            <div class="carousel-item active">
                              <img
                                class="d-block w-100"
                                src="/images/restaurant/restaurant-menu-photo1_n.jpg"
                                alt="1 slide"
                              >
                            </div>
                            <div class="carousel-item">
                              <img
                                class="d-block w-100"
                                src="/images/restaurant/restaurant-menu-photo2_n.jpg"
                                alt="2 slide"
                              >
                            </div>
                            <div class="carousel-item">
                              <img
                                class="d-block w-100"
                                src="/images/restaurant/restaurant-menu-photo3_n.jpg"
                                alt="3 slide"
                              >
                            </div>
                            <div class="carousel-item">
                              <img
                                class="d-block w-100"
                                src="/images/restaurant/restaurant-menu-photo4_n.jpg"
                                alt="4 slide"
                              >
                            </div>
                          </div>
                          <a
                            class="carousel-control-prev"
                            href="#carouselExampleIndicators"
                            role="button"
                            data-slide="prev"
                          >
                            <span
                              class="carousel-control-prev-icon"
                              aria-hidden="true"
                            />
                            <span class="sr-only">Previous</span>
                          </a>
                          <a
                            class="carousel-control-next"
                            href="#carouselExampleIndicators"
                            role="button"
                            data-slide="next"
                          >
                            <span
                              class="carousel-control-next-icon"
                              aria-hidden="true"
                            />
                            <span class="sr-only">Next</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div class="row justify-content-center py-4">
                      <div class="col-10">
                        田園餐廳採自助式取餐，餐盤、餐具請自行取用。用完餐，煩請將您的餐具按照分類放置於回收區。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center2" />
      </section>
    </div>

    <div class="container">
      <div class="col-12 text-center my-5">
        <div class="btn col-md-6 cus-button">
          <NuxtLink to="/front/public">回聖母健康農莊首頁</NuxtLink>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5" />
    </div>
  </div>
</template>
