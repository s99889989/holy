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
        <img class="img-fluid d-md-none mob-cover" src="/images/cafe/mobile-cafe-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/cafe/cafe-cover.png" alt="">
        <img class="cover-title" src="/images/cafe/cafe-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/front/public">首頁</NuxtLink> > 休憩小舖
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3 sub-nav">休憩小舖</div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">

                <div class="row pt-4 justify-content-center no-gutters">
                  <div class="col-10">
                    <div class="row justify-content-center no-gutters">
                      <div class="col-12 col-lg-8">
                        <p>聖母健康農莊設立的「休憩小舖」，即是因應「中華民國家庭照顧者關懷總會」（簡稱「家總」）而產生的，未來主要是以提供給照顧者成員，一個能分享彼此生命故事以及給予情感、靈性支持與喘息場所，也就是「家庭照顧者咖啡館」。</p>
                        <div class="col-10 d-lg-none mx-auto">
                          <img src="/images/cafe/cafe-photo1.png" class="img-fluid py-4 py-lg-0" alt="">
                        </div>
                        <p>期待由一杯咖啡開始，能喚起大眾對於「家庭照顧者」這個角色的關注，協助家庭照顧者減輕照顧者身、心以及來自社會等層面的負荷，藉以得到平衡點。</p>
                      </div>
                      <div class="d-none d-lg-inline-block col-lg-4">
                        <img src="/images/cafe/cafe-photo1.png" style="transform: scale(0.7) translateY(-10%);" alt="">
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row no-gutters pb-4 justify-content-center">
                  <div class="col-10 col-sm-6">
                    <img src="/images/cafe/cafe-photo2.jpg" class="img-fluid" alt="">
                  </div>
                  <div class="col-10 col-sm-6 pt-2 pt-sm-0">
                    <img src="/images/cafe/cafe-photo3.jpg" class="img-fluid" alt="">
                  </div>
                </div>

                <div class="container">
                  <div class="row no-gutters justify-content-center">
                    <div class="col-10">
                      <p>家庭照顧者所面臨的能力及個人資源上的缺乏，不只是讓照顧者單獨面對被照顧者，往往在生活上亦是以被照顧者為生活的重心，因此其自我在長期的照顧過程中，容易被照顧者的角色所消蝕，甚至日漸步入孤立無援、封閉自我的困境中；沒有人應該因為照顧而漸趨匱乏，我們努力推動這樣的認知，幫助家庭照顧者重新看見自己。</p>
                    </div>
                  </div>
                </div>

                <div class="d-md-none">
                  <div class="row no-gutters justify-content-center py-4">
                    <div class="col-10">
                      <img src="/images/cafe/cafe-photo4.jpg" class="img-fluid" alt="">
                    </div>
                  </div>
                </div>
                <div class="d-none d-md-inline-block">
                  <div class="row no-gutters justify-content-center py-4">
                    <img src="/images/cafe/cafe-photo4.jpg" class="col-md-4 img-fluid" alt="">
                    <img src="/images/cafe/cafe-photo5.jpg" class="col-md-4 img-fluid" alt="">
                    <img src="/images/cafe/cafe-photo6.jpg" class="col-md-4 img-fluid" alt="">
                  </div>
                </div>

                <div class="container">
                  <div class="row no-gutters justify-content-center">
                    <div class="col-10">
                      <p>基於此，聖母健康農莊「休憩小舖」除了提供照顧者一個能暫時抽離照顧壓力的休憩場所，更希望打造成社區性的「長照情報站」，除了讓照顧者能到咖啡館放鬆喝杯喘息的咖啡外，家庭照顧者留下的聯絡方式，社工、醫護人員就能持續追蹤這個長照家庭的狀況，藉由彼此的資訊分享及心情交流，讓照顧者知道，在家庭照顧這條路上，你我並不孤單。</p>
                    </div>
                  </div>
                </div>

                <div class="container">
                  <div class="row mt-4 no-gutters justify-content-center">
                    <div class="col-10">
                      <div class="row no-gutters justify-content-center">
                        <div class="d-none d-lg-inline-block col-12 col-lg-4 py-4 py-lg-0">
                          <img src="/images/cafe/cafe-photo6.png" class="img-fluid" style="transform: translateY(20px);" alt="">
                        </div>
                        <div class="col-12 col-lg-8">
                          <p>
                            另外，未來我們也將提供給結束任務的家庭照顧者在「照顧者咖啡館」實習的機會，從外場的引導、點餐、客人互動到學習內場餐點、飲品製作，逐漸接觸人群，期與未來能順利接、融入社會。<br><br>
                            當你愛著自己，宇宙也深深擁抱著你，就從一杯咖啡開始，勇敢走出，就有希望，迎接更好的明天，更好的自己。
                          </p>
                        </div>
                        <div class="d-lg-none col-12 col-lg-4 py-lg-0">
                          <img src="/images/cafe/cafe-photo6.png" class="img-fluid" style="transform: translateY(18px);" alt="">
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

  </div>
</template>


