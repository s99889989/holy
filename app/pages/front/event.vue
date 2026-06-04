<script setup>
definePageMeta({ layout: 'front' })

useSiteHead()

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
        <img class="img-fluid d-md-none mob-cover" src="/images/event/mobile-event-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/event/event-cover.png" alt="">
        <img class="cover-title" src="/images/event/event-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 活動報名
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-4 py-2 sub-nav">聖母農莊樂遊趣</div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">
                <div class="row pt-4 justify-content-center">
                  <div class="col-10">
                    <p>
                      標榜以向大自然學習的聖母健康農莊，提供遊園並充滿學習趣味的體驗活動，滿足大家對土地神奇力量的憧憬，同時以新鮮農作探索、手作麵包DIY、香草與生活等多元企劃，與您一同踏查「從土壤到餐桌」的奇妙，並透過田園餐廳提供美味的健康餐，讓大家在即席賞味時，學會真健康、真飲食的觀念。
                    </p>
                  </div>
                </div>
                <div class="row justify-content-center">
                  <div class="d-none d-lg-inline-block col-12 col-md-8">
                    <img src="/images/event/event.png" alt="" class="img-fluid">
                  </div>
                </div>
                <div class="row justify-content-center">
                  <div class="d-lg-none col-12 col-md-8">
                    <img src="/images/event/healthfarm_mobile_news_event.png" alt="" class="img-fluid">
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

  </div>
</template>


