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
        <img class="img-fluid d-md-none mob-cover" src="/images/access/mob-access-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/access/access-cover.png" alt="">
        <img class="cover-title" src="/images/access/access-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 交通方式
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3">
          <div class="row justify-content-center no-gutters">
            <div class="sub-nav nav text-center align-items-center row justify-content-center" id="nav-tab" role="tablist">
              <a class="nav-item nav-link tab-link" href="#car">開車</a> |
              <a class="nav-item nav-link tab-link" href="#train" role="tab">火車</a> |
              <a class="nav-item nav-link tab-link" href="#plane" role="tab">飛機</a> |
              <a class="nav-item nav-link tab-link" href="#google" role="tab">Google</a>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">
                <div class="row pt-4 justify-content-center no-gutters">

                  <!-- 地點資訊卡 -->
                  <div class="col-12 col-lg-10">
                    <div class="row justify-content-center no-gutters" style="background-color: #fffcdb">
                      <div class="col-12 col-lg-6">
                        <img src="/images/access/photo.jpg" class="img-fluid" alt="">
                      </div>
                      <div class="col-12 col-lg-6 align-self-center">
                        <div class="row justify-content-center no-gutters">
                          <a href="https://maps.app.goo.gl/Tb1hrApgLq3s2GGM7" target="_blank">
                            <img class="align-self-center target" src="/images/access/target.gif" alt="">
                            <div class="align-self-center header">聖母健康農莊</div>
                          </a>
                          <p class="access-info-text">
                            950 台東縣台東市博物館路110號<br />
                            營業時間：<br class="d-inline-block d-lg-none" />08:00~17:30 (週一~週六)<br />
                            服務電話：089-381382
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 開車 -->
                  <div class="col-10">
                    <div class="section"></div>
                    <div class="circle"></div>
                    <div class="sub-header" id="car">開 車</div>
                  </div>
                  <div class="col-10 bar-black-dashed mb-4"></div>
                  <div class="col-10 mt-2">
                    <div class="px-2 py-1 text-white" style="display: inline-block; background-color: #57d2b5">山 線</div>
                    <div class="px-2 py-1" style="display: inline-block; background-color: #fffcdb">台9線 - 自花蓮南下</div>
                  </div>
                  <div class="col-10 mt-2 mb-3">
                    <p>沿花東縱谷台9線 ⇒ 經過阿美釋迦後，右轉進入和平路 ⇒ 朝太平前進，左轉進入太平路 ⇒ 遇中興路四段後左轉 ⇒ 遇博物館路後右轉 ⇒ 朝史前博物館前進，靠左行駛即抵達位於左邊的目的地。</p>
                  </div>
                  <div class="col-10">
                    <div class="px-2 py-1 text-white" style="display: inline-block; background-color: #57d2b5">海 線</div>
                    <div class="px-2 py-1" style="display: inline-block; background-color: #fffcdb">台11線 - 自花蓮南下</div>
                  </div>
                  <div class="col-10 mt-2">
                    <p>沿台11線(花東海岸公路) ⇒ 往台東市區方向前進 ⇒ 過富岡，進入台東大橋後 ⇒ 繼續沿著連航路前進 ⇒ 朝台東火車站前進，右轉中興路二段 ⇒ 朝史前博物館前進，靠左行駛 ⇒ 左轉進入博物館路，目的地即在左邊。</p>
                  </div>
                  <div class="col-10">
                    <div class="px-2 py-1 text-white" style="display: inline-block; background-color: #57d2b5">海 線</div>
                    <div class="px-2 py-1" style="display: inline-block; background-color: #fffcdb">台9線 - 自屏東北上</div>
                  </div>
                  <div class="col-10 mt-2">
                    <p>沿台9線南迴公路 ⇒ 行經太麻里鄉後，沿著外環道朝台東前進，左轉進入花東縱谷公路台9線 ⇒ 朝卑南前進，右轉進入中興路五段269巷，左轉進入博物館路 ⇒ 目的地即將抵達於右邊。</p>
                  </div>

                  <!-- 火車 -->
                  <div class="col-10">
                    <div class="section"></div>
                    <div class="circle"></div>
                    <div class="sub-header" id="train">火 車</div>
                  </div>
                  <div class="col-10 bar-black-dashed mb-4"></div>
                  <div class="col-10">
                    <div class="px-2 py-1 text-white mt-2" style="display: inline-block; background-color: #57d2b5">台 東 火 車 站</div>
                  </div>
                  <div class="col-10 mt-2">
                    <p><span style="color: #87dfc7">■</span><span style="color: #6fba44"> 搭計程車：</span>車程約20分鐘，車資約250元。</p>
                  </div>
                  <div class="col-10">
                    <div class="px-2 py-1 text-white mt-2" style="display: inline-block; background-color: #57d2b5">康 樂 火 車 站</div>
                  </div>
                  <div class="col-10 mt-2">
                    <p><span style="color: #87dfc7">■</span><span style="color: #6fba44"> 步行：</span>10分鐘內可抵達。</p>
                  </div>

                  <!-- 飛機 -->
                  <div class="col-10">
                    <div class="section"></div>
                    <div class="circle"></div>
                    <div class="sub-header" id="plane">飛 機</div>
                  </div>
                  <div class="col-10 bar-black-dashed mb-4"></div>
                  <div class="col-10">
                    <div class="px-2 py-1 text-white mt-2" style="display: inline-block; background-color: #57d2b5">台 東 機 場</div>
                  </div>
                  <div class="col-10 mt-2">
                    <p><span style="color: #87dfc7">■</span><span style="color: #6fba44"> 搭計程車：</span>車程約20分鐘，車資約250元。</p>
                  </div>

                  <!-- Google Map -->
                  <div class="col-10">
                    <div class="section"></div>
                    <div class="circle"></div>
                    <div class="sub-header" id="google">GOOGLE MAP</div>
                  </div>
                  <div class="col-10 bar-black-dashed mb-4"></div>
                  <div class="col-10 text-center mb-3">
                    <iframe class="d-md-none"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1839.5552207661244!2d121.09322972595572!3d22.76128230613919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346fb9c5ac5cc761%3A0x4aabd197844033e5!2zOTUw5Y-w5p2x57ij5Y-w5p2x5biC5Y2a54mp6aSo6LevMTEw6Jmf!5e0!3m2!1szh-TW!2stw!4v1562927001856!5m2!1szh-TW!2stw"
                      width="320" height="240" frameborder="0" style="border: 0" allowfullscreen></iframe>
                    <iframe class="d-none d-md-inline-block d-lg-none"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1839.5552207661244!2d121.09322972595572!3d22.76128230613919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346fb9c5ac5cc761%3A0x4aabd197844033e5!2zOTUw5Y-w5p2x57ij5Y-w5p2x5biC5Y2a54mp6aSo6LevMTEw6Jmf!5e0!3m2!1szh-TW!2stw!4v1562927001856!5m2!1szh-TW!2stw"
                      width="480" height="360" frameborder="0" style="border: 0" allowfullscreen></iframe>
                    <iframe class="d-none d-lg-inline-block"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1839.5552207661244!2d121.09322972595572!3d22.76128230613919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346fb9c5ac5cc761%3A0x4aabd197844033e5!2zOTUw5Y-w5p2x57ij5Y-w5p2x5biC5Y2a54mp6aSo6LevMTEw6Jmf!5e0!3m2!1szh-TW!2stw!4v1562927001856!5m2!1szh-TW!2stw"
                      width="800" height="600" frameborder="0" style="border: 0" allowfullscreen></iframe>
                  </div>

                </div>
              </div>
            </div>
          </div>
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

<style lang="scss">
@use '~/assets/scss/all' as *;
</style>
