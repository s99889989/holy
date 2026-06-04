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
        <img class="img-fluid d-md-none mob-cover" src="/images/about/mobile-about-cover.png" alt="">
        <img class="img-fluid d-none d-md-inline-block mob-cover" src="/images/about/about-cover.png" alt="">
        <img class="cover-title" src="/images/about/about-title.png" alt="">
      </div>
    </section>

    <!-- Content -->
    <div class="container">
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/">首頁</NuxtLink> > 關於我們
      </section>
      <section id="content" class="mx-3 mx-sm-5">
        <div class="col-12 text-center my-3">
          <div class="row justify-content-center no-gutters">
            <div class="sub-nav nav text-center align-items-center row justify-content-center" id="nav-tab" role="tablist">
              <a class="align-items-center nav-item nav-link tab-link active" id="nav-history-tab" data-toggle="tab"
                 href="#nav-history" role="tab" aria-controls="nav-history" aria-selected="true">農莊歷史與理念實踐</a> |
              <a class="align-items-center nav-item nav-link tab-link" id="nav-purpose-tab" data-toggle="tab"
                 href="#nav-purpose" role="tab" aria-controls="nav-purpose" aria-selected="false">服務宗旨</a> |
              <a class="align-items-center nav-item nav-link tab-link" id="nav-partner-tab" data-toggle="tab"
                 href="#nav-partner" role="tab" aria-controls="nav-partner" aria-selected="false">健康夥伴</a> |
              <a class="align-items-center nav-item nav-link tab-link" id="nav-gov-tab" data-toggle="tab"
                 href="#nav-gov" role="tab" aria-controls="nav-gov" aria-selected="false">法定公開揭露事項</a>
            </div>
          </div>
        </div>
        <div class="bar-green bar-green-center"></div>
        <div class="row bg-greenweb py-5 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">
                <div class="tab-content" id="nav-tabContent">

                  <!-- Tab: 農莊歷史與理念實踐 -->
                  <div class="tab-pane fade show active" id="nav-history" role="tabpanel" aria-labelledby="nav-history-tab">
                    <div class="row justify-content-center">
                      <div class="col-10">
                        <div class="sub-header">農莊歷史</div>
                      </div>
                      <div class="col-10">
                        <p>「2009年，八八風災重創台灣，台東災情嚴重，天主教花蓮教區黃兆明主教在第一時間緊急指示，台東各天主教團體聯合組成「天主教花蓮教區88水災救災及重建行動小組」，由台東聖母醫院陳良娟院長擔任總幹事，進行整體救災協調事宜及相關重建工作。</p>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center py-4">
                      <div class="col-10 col-sm-4 mt-2 mt-sm-0">
                        <img src="/images/about/about-history-photo1.jpg" alt="" class="img-fluid">
                      </div>
                      <div class="col-10 col-sm-4 mt-2 mt-sm-0">
                        <img src="/images/about/about-history-photo2.jpg" alt="" class="img-fluid">
                      </div>
                      <div class="col-10 col-sm-4 mt-2 mt-sm-0">
                        <img src="/images/about/about-history-photo3.jpg" alt="" class="img-fluid">
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-10">
                        <p>在台東聖母醫院健康促進團隊輔導下，聖母健康農莊完成有機認證、種植健康蔬果，營造優美景觀、打造心靈花園，邀請災區民眾及失業原住民共同開墾，創造留鄉工作機會，強調從土壤到餐桌都要健康的理念，提供一般民眾及孩子們可以從親力親為的田園活動中，找回與大自然相處的美好；開啟了聖母健康農莊在東台灣寫下從無到有的瑰麗序曲。</p>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center py-4">
                      <div class="col-12 col-sm-10">
                        <div class="row no-gutters justify-content-center">
                          <div class="col-10 col-sm-6">
                            <img src="/images/about/about-history-photo4.jpg" alt="" class="img-fluid">
                          </div>
                          <div class="col-10 col-sm-6 mt-2 mt-sm-0">
                            <img src="/images/about/about_history_photo5.jpg" alt="" class="img-fluid">
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-10">
                        <p>2018年4月聖母健康農莊喬遷至位於東區職訓中心的現址，轉型高齡友善的綠色照護園區，發揮聖母醫院長照專長，更以多年來的綠色墾殖經驗，將新家打造成台東銀髮健康新樂園。</p>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center py-4">
                      <div class="col-12 col-sm-10">
                        <div class="row no-gutters justify-content-center">
                          <div class="col-10 col-sm-6">
                            <img src="/images/about/healthfarm_about_history_photo10.jpg" alt="" class="img-fluid">
                          </div>
                          <div class="col-10 col-sm-6 mt-2 mt-sm-0">
                            <img src="/images/about/healthfarm_about_history_photo11.jpg" alt="" class="img-fluid">
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-10">
                        <p>在綠色之愛的理念下，發展樂智農藝的原力廣場、充滿愛與能量的天使花園、透過五感體驗找回內在感覺的療癒森林、充滿自然療癒力的聖賀德佳香藥草花園、以及靜觀自得的中庭花園。園區內還設有田園餐廳提供健康餐飲、休憩小舖提供咖啡茶飲及體適能促進中心強健體能預防老化。</p>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center py-4">
                      <div class="col-12 col-sm-10">
                        <div class="row no-gutters justify-content-center">
                          <div class="col-10 col-sm-6">
                            <img src="/images/about/healthfarm_about_history_photo13.jpg" alt="" class="img-fluid">
                          </div>
                          <div class="col-10 col-sm-6 mt-2 mt-sm-0">
                            <img src="/images/about/healthfarm_about_history_photo14.jpg" alt="" class="img-fluid">
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="row no-gutters justify-content-center">
                      <div class="col-12 col-lg-10 mb-5 mb-sm-0">
                        <div class="row pt-2 py-sm-4 no-gutters justify-content-center">
                          <div class="col-10 col-lg-8">
                            <div class="row no-gutters justify-content-center">
                              <div class="col-12">
                                <div class="sub-header">理念實踐</div>
                              </div>
                              <div class="col-12">
                                <p>聖母健康農莊主張尊重自然，吃出原味，體會從「土壤到餐桌的愛」，各項餐飲及產品，優先使用農莊自產有機蔬菜及在地安全食材，提供安全美味的健康飲食。</p>
                              </div>
                              <div class="col-12">
                                <p>◎我們的餐食以<span class="highlight">「多蔬少肉、多纖好油、不油炸、不使用添加品」</span>的健康飲食；運用當地、當季食材，由專業營養師設計菜色，研發味美好吃、營養健康的料理。</p>
                              </div>
                              <div class="col-12">
                                <p>◎健康由安全飲食出發，我們希望能成為民眾健康的促進者，除提供安全的飲食外，也積極與部落及有機小農合作，輔導提供安全的食材（如放山雞及自產有機蔬果等），透過共同合作，期盼能帶動部落與小農朝向安全有機發展，而帶動地方健康產業發展。</p>
                              </div>
                            </div>
                          </div>
                          <div class="col-12 col-lg-4">
                            <div class="row no-gutters justify-content-center">
                              <div class="col-10 pt-5">
                                <img src="/images/about/about_history_photo8.png" alt="" class="img-fluid">
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tab: 服務宗旨 -->
                  <div class="tab-pane fade" id="nav-purpose" role="tabpanel" aria-labelledby="nav-purpose-tab">
                    <div class="row justify-content-center no-gutters">
                      <div class="col-10">
                        <div class="row justify-content-center no-gutters">
                          <div class="col-12 col-lg-10">
                            <div class="row justify-content-center no-gutters">
                              <div class="col-12">
                                <div class="sub-header">宗旨：愛主愛人、尊重生命、為窮人服務</div>
                              </div>
                              <div class="col-12">
                                <p>「窮人」泛指身、心、靈缺乏的人！窮人沒有生病的條件，特別是在台東的窮人；幫助窮人的方式，除了給予資助外，還要協助窮人生活健康不生病。</p>
                              </div>
                              <div class="col-12">
                                <p>台東聖母醫院為邁向符合世界潮流的綠色醫院(GREEN HOSPITAL)，積極推動健康促進，並以向大自然學習的精神，強調人與自然的融合，企盼從實踐健康與愛的生活中，達到身體的覺醒(BODY AWARENESS)。</p>
                              </div>
                              <div class="col-12">
                                <p>我們努力結合各種資源，並以教會為基地、用健康去福傳，建立了天主教台東聖母健康園區。</p>
                              </div>
                            </div>
                          </div>
                          <div class="col-4 col-lg-2 mx-auto text-center mt-lg-5 pl-lg-3 pt-lg-4">
                            <img src="/images/about/about-purpose-photo.png" alt="" class="img-fluid">
                          </div>
                          <div class="row justify-content-center no-gutters mb-5">
                            <div class="col-12 sub-header text-center">《 組織圖 》</div>
                            <div class="about-button-bg">1952<br>天主教會花蓮教區</div>
                            <div class="col-12 text-center por py-4 py-lg-5">
                              委 託
                              <img src="/images/about/about-purpose-arrow.png" class="purpose-arrow">
                            </div>
                            <div class="about-button-bg">1961<br>天主教台東聖母醫院</div>
                            <div class="col-12 text-center por py-4 py-lg-5">
                              經 營 管 理
                              <img src="/images/about/about-purpose-arrow.png" class="purpose-arrow">
                            </div>
                            <div class="row no-gutters justify-content-center">
                              <div class="about-button">1955<br>聖母健康培質院</div>
                              <div class="about-button">2008<br>聖母健康會館</div>
                              <br class="d-lg-none">
                              <div class="about-button">2010<br>聖母健康農莊</div>
                              <div class="about-button">2013<br>芳心美好館</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tab: 健康夥伴 -->
                  <div class="tab-pane fade" id="nav-partner" role="tabpanel" aria-labelledby="nav-partner-tab">
                    <div class="row justify-content-center mb-5">
                      <div class="col-10">
                        <div class="row no-gutters justify-content-center">
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">天主教台東聖母醫院</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo1.png" class="img-fluid" alt="">
                            <div class="third-header my-2">建構醫療福傳網絡、落實四全醫療照護</div>
                            <div class="partner-text">我們以「人」為中心！不只看「病人」；更不是只看「病」。秉持「別人不去，我們去；別人不做，我們做」的精神。</div>
                            <div class="bar-black-dashed my-2"></div>
                            <div class="partner-info">地址：950 台東縣台東市杭州街2號</div>
                            <div class="partner-info">電話：089-322833</div>
                          </div>
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">高齡服務培訓中心</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo2.png" class="img-fluid" alt="">
                            <div class="third-header my-2">提供各項高齡服務，長照培訓與即測即評</div>
                            <div class="partner-text">秉持「老吾老、以及人之老」的初心，發揮職人精神為高齡照顧打造軟、硬體兼具的優良設施，貼心營造環境每個細節，務求達到高齡服務培訓的最高品質。</div>
                            <div class="bar-black-dashed my-2"></div>
                            <div class="partner-info">地址：950 台東縣台東市博物館路110號</div>
                            <div class="partner-info">電話：089-381581</div>
                          </div>
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">健康活力站</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo3.png" class="img-fluid" alt="">
                            <div class="third-header my-2">運用在地資源結合外地協助，2010年起陸續成立嘉蘭及泰源健康活力站</div>
                            <div class="partner-text">提供老人日托關懷、部落健康廚房、送餐服務及學童課後輔導…等服務。期待能結合教會及在地青年的力量。建立符合族群價值觀的關懷模式。</div>
                          </div>
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">部落健康廚房</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo4.png" class="img-fluid" alt="">
                            <div class="third-header my-2">送餐服務是台東聖母醫院多年來持續關懷獨居老人及身心障礙者的事工</div>
                            <div class="partner-text">台東幅員廣闊，為讓老人家吃到熱騰騰的飯菜，我們籌備了8個部落健康廚房，就近服務部落鄉親，也創造了當地就業機會。</div>
                          </div>
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">聖母健康會館</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo5.png" class="img-fluid" alt="">
                            <div class="third-header my-2">體驗健康飲食的教育基地，以全蔬食自助餐方式，提供營養均衡的美味三餐</div>
                            <div class="partner-text">幫助大家過健康好生活、體會生命美好的園地，是照顧民眾健康的好朋友！</div>
                            <div class="bar-black-dashed my-2"></div>
                            <div class="partner-info">地址：950 台東縣台東市南京路77號</div>
                            <div class="partner-info">電話：089-345719</div>
                          </div>
                          <div class="col-12 col-md-6 px-md-3">
                            <div><div class="circle"></div><div class="sub-header">芳心好美館</div></div>
                            <img src="/images/about/healthfarm_about_partner_photo6.png" class="img-fluid" alt="">
                            <div class="third-header my-2">全國首創專為老人、病人及照顧者開辦的芳療館</div>
                            <div class="partner-text">營造充滿健康、優雅、自在的療育環境，讓芳香照護陪伴著每個需要幫助的人們。</div>
                            <div class="bar-black-dashed my-2"></div>
                            <div class="partner-info">地址：950 台東縣台東市信義路106號</div>
                            <div class="partner-info">電話：089-330958</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tab: 法定公開揭露事項 -->
                  <div class="tab-pane fade" id="nav-gov" role="tabpanel" aria-labelledby="nav-gov-tab">
                    <div class="row justify-content-center no-gutters">
                      <div class="col-10">
                        <div class="row justify-content-center no-gutters">
                          <div class="col-12 col-lg-10">
                            <div class="row justify-content-center no-gutters">
                              <div class="col-12">
                                <div class="sub-header">法定公開揭露事項</div>
                              </div>
                              <div class="col-12">
                                <p>
                                  <span class="font-weight-bold">性騷擾申訴管道</span><br>
                                  性騷擾申訴專線電話：089-381382 分機 176<br>
                                  EMAIL：a00193@st-mary.com.tw
                                </p>
                                <p>
                                  <span class="font-weight-bold">性騷擾防治措施：</span><br>
                                  (一) 不得利用工作上權力、機會或方法，對員工或求職者性騷擾，亦不得縱容他人對員工或求職者性騷擾。<br><br>
                                  (二) 員工不得於工作職場對同仁性騷擾，亦不得於同仁執行職務時對其性騷擾。<br><br>
                                  (三) 工作職場有以上性騷擾之情形時，管理監督者應予勸阻或為其他適當之處置者，不可縱容。<br><br>
                                  (四) 本法人應致力防制性騷擾、改善就業場所設施以保護員工免於性騷擾，鼓勵員工參加性騷擾防制之教育講習。<br><br>
                                  (五) 申訴及調查<br>
                                  1. 為處理性騷擾申訴，成立「性騷擾申訴審議委員會」。<br><br>
                                  2. 本法人員工遭受性騷擾、性侵犯，非本法人員工、求職者或間接對本法人員工施以性騷擾、性侵犯，受害員工或單位相關人員，得向委員會提出申訴，必要時向警察機關報案處理。<br><br>
                                  3. 可洽詢人資索取「申訴書」或本網頁下載，由人資受理申訴及呈交「性騷擾申訴審議委員會」，並於申訴後七日內開始調查及審議。申訴應填具申訴書並具名為之。申訴人可以親送、書信、電子郵件等方式提出申訴。必要時，得以電話先行申訴，並於三日內以書面補正。<br><br>
                                  4. 為處理申訴案件，必要時得邀請被申訴者列席說明或陳述意見，並得依申訴者之申請，進行調查；被申訴者非有正當理由，不得拒絕；必要時，得邀請申訴者與被申訴者共同列席說明或陳述意見。<br><br>
                                  5. 受理申訴者為調查、審議性騷擾申訴，得要求相關人員或單位提供相關資料，該相關人員或單位不得規避、妨礙或拒絕。<br><br>
                                  6. 調查、審議過程中應維護申訴人權益，以保密方式處理申訴案件，不得洩漏申訴人之姓名或其他足資識別申訴人身份之相關資料。<br><br>
                                  7. 受理申訴者應於受理之日起二週內作成決定，必要時得延長七日，並以延長一次為限。申訴人及被申訴人對申訴案之決議有異議者，得以三日內提出申覆。經結案後，不得就同一事由，再提出申訴。<br><br>
                                  8. 受理申訴者應將申訴案件之處理經過作成書面記錄，並密封存檔至少三年。<br><br>
                                  9. 本法人不得因申訴人提出申訴，而予以解僱、調職或為其他不利之處置。
                                </p>
                              </div>
                            </div>
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
        </div>
      </section>
    </div>

    <div class="col-12 text-center my-5">
      <div class="btn col-md-6 cus-button">
        <NuxtLink to="/front/public">回聖母健康農莊首頁</NuxtLink>
      </div>
    </div>

    <div class="container">
      <div class="bar-waterDrop mt-5 mx-lg-5"></div>
    </div>
  </div>
</template>

