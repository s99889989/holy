<script setup>
onMounted(() => {
  // 路由切換後重新觸發 Facebook SDK 渲染 fb-page widget
  if (typeof window !== 'undefined' && window.FB) {
    window.FB.XFBML.parse()
  }
})
</script>

<template>
  <!-- Footer - Desktop -->
  <div class="container">
    <div class="mx-5 d-none d-xl-block">
      <div class="my-lg-5 px-5 mx-3">
        <div class="row p-4 p-lg-0 align-itmes-center">
          <div class="col-sm-3 mr-4 mb-2 pt-3 mr-5">
            <img src="/images/global/healthfarm_logo.png" alt="">
          </div>
          <div class="ml-3 col-8 bar-straight-dotted pt-lg-3">
            <p class="pl-lg-2">
              財團法人天主教會花蓮教區附設聖母健康農莊<br />
              統編:36726891<br />
              台東巿博物館路110號<span class="pl-lg-5">089-381382</span><br />營業時間：08:00~17:30(週一~週六)
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="py-3 px-5 d-none d-xl-block" style="background: url(/images/global/bg-footer.jpg) repeat;">
    <div class="container">
      <div class="por p-5">
        <img src="/images/global/grass.png" class="footer-grass" alt="">
        <div class="row">
          <div class="col-12 d-md-block col-md-6">
            <p class="text-white footer-fontSize text-center text-md-left">
              Copyright © 2019 台東聖母健康農莊 All Rights Reserved<br />
              版權所有，非經授權，不得轉載本網站內容 .
            </p>
          </div>
          <div class="d-none d-md-inline-block col-md-6 pl-md-5">
            <div class="fb-page" data-href="https://www.facebook.com/st.maryhealthfarm/" data-tabs="timeline"
                 data-width="" data-height="130" data-small-header="false" data-adapt-container-width="true"
                 data-hide-cover="false" data-show-facepile="true">
              <blockquote cite="https://www.facebook.com/st.maryhealthfarm/" class="fb-xfbml-parse-ignore">
                <a href="https://www.facebook.com/st.maryhealthfarm/">台東聖母健康農莊</a>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer - Mobile -->
  <div class="container">
    <div class="d-xl-none">
      <div class="row no-gurtters justify-content-center my-3">
        <div class="col-10">
          <img src="/images/global/healthfarm_logo.png" class="mob-logo" alt="">
          <p class="footer-address">
            財團法人天主教會花蓮教區附設聖母健康農莊<br />
            統編:36726891<br />
            台東巿博物館路110號<span style="padding-left: 20px"></span>089-381382<br>
            8:00~17:30(週一~週六)
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="pt-5 py-3 d-xl-none" style="background: url(/images/global/bg-footer.jpg) repeat;">
    <div class="container">
      <div class="por">
        <img src="/images/global/grass.png" class="footer-grass" alt="">
        <div class="row">
          <div class="col-12">
            <p class="text-white footer-fontSize text-center">
              Copyright © 2019 台東聖母健康農莊 All Rights Reserved<br />
              版權所有，非經授權，不得轉載本網站內容 .
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>