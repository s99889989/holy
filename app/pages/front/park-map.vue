<script setup>
  definePageMeta({ layout: 'front' })

  useSiteHead()

  import { ref, computed, onUnmounted, watch } from 'vue'

  // ── 控制點（GPS ↔ 圖片比例，IDW 插值用）─────────────────────────
  const CONTROL_POINTS = [
    { imgX: 0.550, imgY: 0.810, lat: 22.76123,  lng: 121.09413 },  // 園區大門
    { imgX: 0.700, imgY: 0.520, lat: 22.76086,  lng: 121.09526 },  // 快樂運動館B1
    { imgX: 0.400, imgY: 0.680, lat: 22.76167,  lng: 121.09485 },  // 樂智幸福家園
    { imgX: 0.620, imgY: 0.711, lat: 22.76107,  lng: 121.09463 },  // 田園餐廳
    { imgX: 0.710, imgY: 0.330, lat: 22.76086,  lng: 121.09614 },  // 療癒森林
    { imgX: 0.831, imgY: 0.565, lat: 22.76052,  lng: 121.09511 },  // 聖賀德住香草園
    { imgX: 0.740, imgY: 0.670, lat: 22.76075,  lng: 121.09468 },  // 全食物烘焙坊
    { imgX: 0.440, imgY: 0.367, lat: 22.76164,  lng: 121.09595 },  // 手作教室
    { imgX: 0.710, imgY: 0.798, lat: 22.76081,  lng: 121.09416 },  // 高齡服務培訓中心
    { imgX: 0.690, imgY: 0.650, lat: 22.76089,  lng: 121.09476 },  // 休憩小舖
    { imgX: 0.800, imgY: 0.810, lat: 22.76056,  lng: 121.09411 },  // 聖堂·天使花園
    { imgX: 0.300, imgY: 0.350, lat: 22.76200,  lng: 121.09601 },  // 木工教室
    { imgX: 0.558, imgY: 0.490, lat: 22.76125,  lng: 121.09538 },  // 康樂據點
    { imgX: 0.900, imgY: 0.350, lat: 22.76041,  lng: 121.09605 },  // 森林好食光
  ]

  // IDW（加權反距離插值）：GPS → 圖片比例
  // power=3 讓近的點影響更大，遠的點影響快速衰減
  function gpsToImgFraction(lat, lng) {
    const power = 3
    let sumW = 0, sumX = 0, sumY = 0
    for (const cp of CONTROL_POINTS) {
      const dLat = (lat - cp.lat) * 111000
      const dLng = (lng - cp.lng) * 102000
      const dist2 = dLat * dLat + dLng * dLng
      if (dist2 < 0.0001) return { x: cp.imgX, y: cp.imgY } // 幾乎在控制點上
      const w = 1 / Math.pow(dist2, power / 2)
      sumW += w
      sumX += w * cp.imgX
      sumY += w * cp.imgY
    }
    return {
      x: Math.max(0, Math.min(1, sumX / sumW)),
      y: Math.max(0, Math.min(1, sumY / sumW)),
    }
  }

  // ── 設施資料（14點實測校準 2026-05-23）──────────────────────────
  const landmarks = ref([
    { id:1,  name:'園區大門',           icon:'🚪', lat:22.76123,  lng:121.09413, imgX:0.550, imgY:0.810, desc:'主要入口，遊覽車可在附近停放。博物館路側。',                  tag:'green',  tagLabel:'入口' },
    { id:2,  name:'快樂運動館B1大禮堂', icon:'🏋️', lat:22.76086,  lng:121.09526, imgX:0.700, imgY:0.520, desc:'大型室內大禮堂，適合集合說明，可容納大型團體。',              tag:'orange', tagLabel:'集合推薦' },
    { id:3,  name:'樂智幸福家園',       icon:'🏡', lat:22.76167,  lng:121.09485, imgX:0.400, imgY:0.680, desc:'核心示範區，含樂智團體家屋、廣場、農藝區、小規模多機能。',     tag:'orange', tagLabel:'重點參觀' },
    { id:4,  name:'田園餐廳',           icon:'🍽️', lat:22.76107,  lng:121.09463, imgX:0.620, imgY:0.711, desc:'1F 用餐空間，主打健康有機食材，適合安排團體午餐，需提前訂位。', tag:'gold',   tagLabel:'餐飲' },
    { id:5,  name:'療癒森林',           icon:'🌲', lat:22.76086,  lng:121.09614, imgX:0.710, imgY:0.330, desc:'東北角自然步道，感受森林療癒氛圍，適合輕度健走。',             tag:'green',  tagLabel:'戶外亮點' },
    { id:6,  name:'聖賀德住香草園',     icon:'🌿', lat:22.76052,  lng:121.09511, imgX:0.831, imgY:0.565, desc:'香草植物園，感官體驗豐富，年長者特別喜愛。',                  tag:'green',  tagLabel:'體驗亮點' },
    { id:7,  name:'全食物烘焙坊',       icon:'🍞', lat:22.76075,  lng:121.09468, imgX:0.740, imgY:0.670, desc:'1F 健康烘焙產品，可觀摩或採購伴手禮。',                       tag:'gold',   tagLabel:'伴手禮' },
    { id:8,  name:'手作教室',           icon:'🎨', lat:22.76164,  lng:121.09595, imgX:0.440, imgY:0.367, desc:'各式手作體驗課程，需提前預約確認時段。',                      tag:'orange', tagLabel:'需預約' },
    { id:9,  name:'高齡服務培訓中心',   icon:'🎓', lat:22.76081,  lng:121.09416, imgX:0.710, imgY:0.798, desc:'專業培訓空間，適合了解服務模式，教育參訪首選。',               tag:'green',  tagLabel:'教育參訪' },
    { id:10, name:'休憩小舖',           icon:'☕', lat:22.76089,  lng:121.09476, imgX:0.690, imgY:0.650, desc:'輕食飲品，參觀中場休息使用，提供茶飲與輕點心。',              tag:'gold',   tagLabel:'休息站' },
    { id:11, name:'聖堂 · 天使花園',   icon:'⛪', lat:22.76056,  lng:121.09411, imgX:0.800, imgY:0.810, desc:'靈性空間與靜謐庭園，可自由參觀，氛圍寧靜。',                  tag:'gold',   tagLabel:'靜思空間' },
    { id:12, name:'木工教室',           icon:'🪚', lat:22.76200,  lng:121.09601, imgX:0.300, imgY:0.350, desc:'木工體驗課程，提供親手製作的樂趣，需提前預約。',              tag:'orange', tagLabel:'需預約' },
    { id:13, name:'康樂據點',           icon:'🏥', lat:22.76125,  lng:121.09538, imgX:0.558, imgY:0.490, desc:'社區型健康服務空間，日常活動示範中心。',                      tag:'green',  tagLabel:'服務示範' },
    { id:14, name:'森林好食光',         icon:'🍃', lat:22.76041,  lng:121.09605, imgX:0.900, imgY:0.350, desc:'東北角森林餐飲體驗空間，享受自然中用餐的美好。',              tag:'gold',   tagLabel:'餐飲' },
  ])

  // ── GPS 狀態 ──────────────────────────────────────────────────
  const isTracking = ref(false)
  const currentGPS = ref(null)
  const errorMsg = ref('')
  const lastUpdated = ref('')
  const watchId = ref(null)

  function toggleTracking() {
    isTracking.value ? stopTracking() : startTracking()
  }
  function startTracking() {
    if (!navigator.geolocation) { showError('此裝置不支援 GPS 定位'); return }
    isTracking.value = true
    watchId.value = navigator.geolocation.watchPosition(
      (pos) => {
        currentGPS.value = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        lastUpdated.value = new Date().toLocaleTimeString('zh-TW')
      },
      (err) => {
        const msgs = { 1:'使用者拒絕定位授權', 2:'無法取得位置資訊', 3:'定位請求逾時' }
        showError(msgs[err.code] || '定位失敗')
        isTracking.value = false
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
  }
  function stopTracking() {
    if (watchId.value !== null) { navigator.geolocation.clearWatch(watchId.value); watchId.value = null }
    isTracking.value = false
    currentGPS.value = null
    googleMapsSet.value = false
    googleMapsUrl.value = ''
  }

  // ── 圖片 ref ─────────────────────────────────────────────────
  const mapImage = ref(null)

  // ── 位置轉換 ──────────────────────────────────────────────────
  const mappedPosition = computed(() => {
    if (!currentGPS.value) return null
    return gpsToImgFraction(currentGPS.value.lat, currentGPS.value.lng)
  })
  const dotStyle = computed(() => {
    if (!mappedPosition.value) return {}
    return { left: mappedPosition.value.x * 100 + '%', top: mappedPosition.value.y * 100 + '%' }
  })
  function pinStyle(lm) {
    return { left: lm.imgX * 100 + '%', top: lm.imgY * 100 + '%' }
  }

  // ── 最近設施 ──────────────────────────────────────────────────
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
  }
  const nearestLandmark = computed(() => {
    if (!currentGPS.value) return null
    let nearest = null, minDist = Infinity
    for (const lm of landmarks.value) {
      const dist = haversine(currentGPS.value.lat, currentGPS.value.lng, lm.lat, lm.lng)
      if (dist < minDist) { minDist = dist; nearest = { ...lm, dist } }
    }
    return nearest
  })
  function distToLandmark(lm) {
    if (!currentGPS.value) return '—'
    return haversine(currentGPS.value.lat, currentGPS.value.lng, lm.lat, lm.lng)
  }

  // ── 設施彈窗 ──────────────────────────────────────────────────
  const showLandmarks = ref(true)
  const selectedLandmark = ref(null)
  function selectLandmark(lm) {
    // 校準模式：點設施直接記錄 GPS
    if (calibMode.value) {
      recordCalibPoint(lm)
      return
    }
    selectedLandmark.value = selectedLandmark.value?.id === lm.id ? null : lm
  }

  // ── 校準模式 ──────────────────────────────────────────────────
  const calibMode = ref(false)
  const calibRecords = ref([])   // [{ id, name, lat, lng }]
  const showCalibOutput = ref(false)
  const copySuccess = ref(false)

  function toggleCalibMode() {
    calibMode.value = !calibMode.value
    selectedLandmark.value = null
    if (!calibMode.value) showCalibOutput.value = false
  }

  function recordCalibPoint(lm) {
    if (!currentGPS.value) {
      showError('請先開始定位')
      return
    }
    // 同一設施重複點則更新
    const existing = calibRecords.value.findIndex(r => r.id === lm.id)
    const record = {
      id: lm.id,
      name: lm.name,
      imgX: lm.imgX,
      imgY: lm.imgY,
      lat: currentGPS.value.lat,
      lng: currentGPS.value.lng,
      accuracy: currentGPS.value.accuracy,
    }
    if (existing >= 0) {
      calibRecords.value[existing] = record
    } else {
      calibRecords.value.push(record)
    }
    calibToast.value = `✅ 已記錄「${lm.name}」`
    setTimeout(() => { calibToast.value = '' }, 2000)
  }

  const calibToast = ref('')

  function clearCalibRecords() {
    if (confirm('確定清除所有校準記錄？')) calibRecords.value = []
  }

  const calibOutputText = computed(() => {
    if (!calibRecords.value.length) return ''
    return calibRecords.value
      .map(r => `${r.name} 緯度${r.lat.toFixed(5)} 經度${r.lng.toFixed(5)}`)
      .join('\n')
  })

  async function copyCalibOutput() {
    try {
      await navigator.clipboard.writeText(calibOutputText.value)
      copySuccess.value = true
      setTimeout(() => { copySuccess.value = false }, 2000)
    } catch {
      showError('複製失敗，請手動選取文字複製')
    }
  }

  // ── 全螢幕（CSS 模擬，相容 iOS）────────────────────────────────
  const mapSection = ref(null)
  const isFullscreen = ref(false)

  function toggleFullscreen() {
    // 優先嘗試原生 API（Android Chrome / 桌機）
    if (!isFullscreen.value && document.fullscreenEnabled) {
      mapSection.value?.requestFullscreen?.()
        .then(() => { isFullscreen.value = true })
        .catch(() => { isFullscreen.value = true }) // fallback to CSS
      return
    }
    if (isFullscreen.value && document.fullscreenElement) {
      document.exitFullscreen?.()
      isFullscreen.value = false
      return
    }
    // iOS fallback：純 CSS 模擬全螢幕
    isFullscreen.value = !isFullscreen.value
    if (isFullscreen.value) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  if (import.meta.client) {
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        isFullscreen.value = false
        document.body.style.overflow = ''
      }
    })
  }
  // ── 地圖模式切換 ──────────────────────────────────────────────
  const mapMode = ref('illustrated') // 'illustrated' | 'google'
  const googleMapsUrl = ref('')
  const googleMapsSet = ref(false)

  // GPS 第一次取得時固定 URL，之後不再更新避免 iframe 重載
  watch(currentGPS, (gps) => {
    if (gps && !googleMapsSet.value) {
      googleMapsUrl.value = `https://maps.google.com/maps?q=${gps.lat},${gps.lng}&z=18&output=embed`
      googleMapsSet.value = true
    }
  })


  const statusClass = computed(() => {
    if (!isTracking.value) return 'status-off'
    if (currentGPS.value) return 'status-live'
    return 'status-searching'
  })
  const statusText = computed(() => {
    if (!isTracking.value) return '尚未定位'
    if (currentGPS.value) return 'GPS 即時追蹤中'
    return '搜尋 GPS 訊號…'
  })

  function showError(msg) {
    errorMsg.value = msg
    setTimeout(() => { errorMsg.value = '' }, 4000)
  }

  onUnmounted(() => { stopTracking() })
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

    <div class="container">

      <!-- Breadcrumb -->
      <section id="breadcrumb" class="my-1 mx-3 mx-sm-5">
        <NuxtLink to="/">首頁</NuxtLink> >
        <NuxtLink to="/front/about">關於我們</NuxtLink> > 園區地圖
      </section>

      <section id="content" class="mx-3 mx-sm-5">

        <!-- Page title -->
        <div class="col-12 text-center my-3">
          <div class="sub-header">園區探索地圖</div>
          <p class="text-muted" style="font-size:14px;">開啟 GPS 定位，即時查看您在園區中的位置</p>
        </div>

        <div class="bar-green bar-green-center"></div>

        <div class="row bg-greenweb py-4 px-sm-2">
          <div class="col-12 px-sm-4">
            <div class="row justify-content-center no-gutters">
              <div class="col-12 rounded bg-lightGreen py-3">

                <!-- GPS 控制列 -->
                <div class="row justify-content-center mb-3">
                  <div class="col-10">
                    <div class="map-toolbar">

                      <!-- GPS 狀態 -->
                      <div class="gps-status-badge" :class="statusClass">
                        <span class="status-dot"></span>
                        <span>{{ statusText }}</span>
                      </div>

                      <!-- 按鈕群組 -->
                      <div class="map-btn-group">
                        <!-- 地圖切換 -->
                        <div class="map-mode-toggle">
                          <button
                            class="mode-btn"
                            :class="{ 'mode-btn--active': mapMode === 'illustrated' }"
                            @click="mapMode = 'illustrated'"
                          >🗺️ 園區導覽圖</button>
                          <button
                            class="mode-btn"
                            :class="{ 'mode-btn--active': mapMode === 'google' }"
                            @click="mapMode = 'google'"
                          >📍 精準定位</button>
                        </div>

                        <button
                          class="map-ctrl-btn"
                          :class="{ 'map-ctrl-btn--active': isTracking }"
                          @click="toggleTracking"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                            <circle cx="12" cy="12" r="8" stroke-dasharray="4 2"/>
                          </svg>
                          {{ isTracking ? '停止定位' : '開始定位' }}
                        </button>

                        <template v-if="mapMode === 'illustrated'">
                          <button
                            class="map-ctrl-btn"
                            :class="{ 'map-ctrl-btn--active': showLandmarks }"
                            @click="showLandmarks = !showLandmarks"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {{ showLandmarks ? '隱藏設施' : '顯示設施' }}
                          </button>

                          <button class="map-ctrl-btn" @click="toggleFullscreen">
                            <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>
                            </svg>
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                              <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/>
                            </svg>
                            {{ isFullscreen ? '離開全螢幕' : '全螢幕' }}
                          </button>

                          <button
                            class="map-ctrl-btn"
                            :class="{ 'map-ctrl-btn--calib': calibMode }"
                            @click="toggleCalibMode"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                              <circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
                              <circle cx="12" cy="12" r="9" stroke-dasharray="3 2"/>
                            </svg>
                            {{ calibMode ? `校準中 (${calibRecords.length})` : '校準模式' }}
                          </button>

                          <button
                            v-if="calibRecords.length"
                            class="map-ctrl-btn map-ctrl-btn--output"
                            @click="showCalibOutput = !showCalibOutput"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                            輸出 ({{ calibRecords.length }})
                          </button>
                        </template>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- 地圖 -->
                <div class="row justify-content-center">
                  <div class="col-10">

                    <!-- 手繪園區圖 -->
                    <div v-show="mapMode === 'illustrated'">
                      <div class="map-wrapper" ref="mapSection" :class="{ 'map-fullscreen': isFullscreen }">
                        <button class="fullscreen-close-btn" @click="toggleFullscreen">✕</button>
                        <div class="map-container" :class="{ 'calib-pins-visible': calibMode }">
                          <img
                            ref="mapImage"
                            src="/images/point_B.png"
                            alt="聖母健康園區探索地圖"
                            class="map-img img-fluid"
                            draggable="false"
                          />
                          <template v-if="showLandmarks">
                            <div
                              v-for="lm in landmarks"
                              :key="lm.id"
                              class="landmark-pin"
                              :style="pinStyle(lm)"
                              :class="{
                                'landmark-pin--selected': selectedLandmark?.id === lm.id,
                                'landmark-pin--nearby':   nearestLandmark?.id === lm.id && isTracking
                              }"
                              @click.stop="selectLandmark(lm)"
                            >
                              <span class="pin-icon">{{ lm.icon }}</span>
                              <span class="pin-label">{{ lm.name }}</span>
                            </div>
                          </template>
                          <transition name="pop">
                            <div v-if="mappedPosition" class="position-dot" :style="dotStyle">
                              <div class="pulse-ring"></div>
                              <div class="pulse-ring pulse-ring--delay"></div>
                              <div class="dot-core"></div>
                            </div>
                          </transition>
                        </div>
                      </div>
                      <p class="map-hint">
                        💡 粉紅虛線範圍為「樂智幸福家園」核心區域，從 <strong>園區大門</strong>（博物館路側）入場後沿中央大道前進。<br>
                        <span style="color:#e65100;">⚠️ 此圖為手繪示意圖，建築位置僅供參考，精確定位請切換「精準定位」。</span>
                      </p>
                    </div>

                    <!-- Google Maps 精準定位 -->
                    <div v-show="mapMode === 'google'">
                      <div class="google-map-wrapper">
                        <iframe
                          v-if="currentGPS"
                          :src="googleMapsUrl"
                          class="google-map-iframe"
                          allowfullscreen
                          loading="lazy"
                          referrerpolicy="no-referrer-when-downgrade"
                        ></iframe>
                        <div v-else class="google-map-placeholder">
                          <div class="placeholder-icon">📍</div>
                          <p>請先開啟 GPS 定位<br>才能顯示你的精確位置</p>
                          <button class="map-ctrl-btn map-ctrl-btn--active mt-2" @click="startTracking">
                            開始定位
                          </button>
                        </div>
                      </div>
                      <p class="map-hint">
                        📍 Google Maps 即時顯示你的精確位置，藍點為目前所在地。
                      </p>
                    </div>

                  </div>
                </div>

                <!-- GPS 資訊列 -->
                <transition name="slide-up">
                  <div v-if="currentGPS" class="row justify-content-center mt-3">
                    <div class="col-10">
                      <div class="gps-info-card">
                        <div class="gps-info-grid">
                          <div class="gps-info-item">
                            <span class="gps-info-label">緯度</span>
                            <span class="gps-info-val">{{ currentGPS.lat.toFixed(5) }}</span>
                          </div>
                          <div class="gps-info-item">
                            <span class="gps-info-label">經度</span>
                            <span class="gps-info-val">{{ currentGPS.lng.toFixed(5) }}</span>
                          </div>
                          <div class="gps-info-item">
                            <span class="gps-info-label">精確度</span>
                            <span class="gps-info-val">±{{ Math.round(currentGPS.accuracy) }}m</span>
                          </div>
                          <div class="gps-info-item">
                            <span class="gps-info-label">更新時間</span>
                            <span class="gps-info-val">{{ lastUpdated }}</span>
                          </div>
                        </div>
                        <div v-if="nearestLandmark" class="nearest-card">
                          <span class="nearest-icon">{{ nearestLandmark.icon }}</span>
                          <div>
                            <div class="nearest-name">最近設施：{{ nearestLandmark.name }}</div>
                            <div class="nearest-dist">距離約 {{ nearestLandmark.dist }} 公尺</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>

              </div>
            </div>
          </div>
          <div class="bar-green bar-green-center2"></div>
        </div>

      </section>
    </div>

    <!-- 設施說明彈窗 -->
    <transition name="sheet">
      <div v-if="selectedLandmark && !calibMode" class="landmark-sheet" @click.stop>
        <button class="sheet-close" @click="selectedLandmark = null">✕</button>
        <div class="sheet-icon">{{ selectedLandmark.icon }}</div>
        <div class="sub-header mb-2">{{ selectedLandmark.name }}</div>
        <p>{{ selectedLandmark.desc }}</p>
        <div class="d-flex align-items-center justify-content-center" style="gap:12px; margin-top:8px;">
          <span class="landmark-tag" :class="'landmark-tag--' + selectedLandmark.tag">{{ selectedLandmark.tagLabel }}</span>
          <span v-if="currentGPS" class="sheet-dist">距你約 {{ distToLandmark(selectedLandmark) }} 公尺</span>
        </div>
      </div>
    </transition>

    <!-- 校準模式提示橫幅 -->
    <transition name="sheet">
      <div v-if="calibMode" class="calib-banner" @click.stop>
        <div class="calib-banner-title">
          📍 校準模式開啟中
          <button class="calib-banner-close" @click="toggleCalibMode">完成</button>
        </div>
        <p>走到設施門口後，點地圖上對應的圖示即可記錄 GPS。</p>
        <div v-if="calibRecords.length" class="calib-recorded-list">
          <div v-for="r in calibRecords" :key="r.id" class="calib-recorded-item">
            <span>{{ r.name }}</span>
            <span class="calib-recorded-gps">{{ r.lat.toFixed(5) }}, {{ r.lng.toFixed(5) }} ±{{ Math.round(r.accuracy) }}m</span>
            <button class="calib-del-btn" @click="calibRecords.splice(calibRecords.indexOf(r), 1)">✕</button>
          </div>
        </div>
        <div v-else class="calib-empty">尚未記錄任何設施</div>
      </div>
    </transition>

    <!-- 校準輸出面板 -->
    <transition name="sheet">
      <div v-if="showCalibOutput && !calibMode" class="calib-output-panel" @click.stop>
        <button class="sheet-close" @click="showCalibOutput = false">✕</button>
        <div class="calib-output-title">📋 校準資料輸出</div>
        <p style="font-size:13px;color:#555;margin-bottom:10px;">複製下方內容貼給 Claude 進行座標校正：</p>
        <textarea class="calib-textarea" readonly :value="calibOutputText"></textarea>
        <div class="calib-output-actions">
          <button class="map-ctrl-btn map-ctrl-btn--active" @click="copyCalibOutput">
            {{ copySuccess ? '✅ 已複製！' : '複製到剪貼簿' }}
          </button>
          <button class="map-ctrl-btn" style="color:#c62828;border-color:#c62828;" @click="clearCalibRecords">清除記錄</button>
        </div>
      </div>
    </transition>

    <!-- 校準記錄 Toast -->
    <transition name="fade">
      <div v-if="calibToast" class="calib-toast">{{ calibToast }}</div>
    </transition>

    <!-- 錯誤提示 -->
    <transition name="fade">
      <div v-if="errorMsg" class="error-toast">⚠️ {{ errorMsg }}</div>
    </transition>

    <!-- 回首頁按鈕 -->
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

<style scoped>
  /* ── 地圖容器 ── */
  .map-wrapper {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #c8e6b8;
    background: #e8e4dc;
    position: relative;
    overflow: visible;
  }
  .map-container {
    display: block;
    position: relative;
    width: 100%;
  }
  .map-img {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
    pointer-events: none;
  }
  .map-hint {
    font-size: 13px;
    color: #555;
    background: #f0f7ec;
    border-left: 3px solid #7ab648;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin-top: 10px;
    margin-bottom: 0;
  }

  /* ── 控制列 ── */
  .map-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 0;
  }
  .map-btn-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }
  .map-ctrl-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 13px;
    border: 1.5px solid #8aba68;
    border-radius: 20px;
    background: white;
    font-size: 13px;
    font-family: inherit;
    color: #3d7a2d;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .map-ctrl-btn:hover { background: #edf7e8; }
  .map-ctrl-btn--active { background: #3d7a2d; color: white; border-color: #3d7a2d; }


  /* ── GPS 狀態徽章 ── */
  .gps-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 5px 12px;
    border-radius: 20px;
    background: #f0f0f0;
    color: #666;
    white-space: nowrap;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #bbb;
    flex-shrink: 0;
  }
  .status-live .status-dot {
    background: #4caf50;
    box-shadow: 0 0 6px #4caf50;
    animation: blink 1.5s infinite;
  }
  .status-live { background: #e8f5e9; color: #2e7d32; }
  .status-searching .status-dot { background: #ff9800; animation: blink 0.8s infinite; }
  .status-searching { background: #fff3e0; color: #e65100; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── 目前位置藍點 ── */
  .position-dot {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 20;
    pointer-events: none;
  }
  .dot-core {
    width: 16px;
    height: 16px;
    background: #1976d2;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(25,118,210,0.5);
    position: relative;
    z-index: 3;
  }
  .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(25,118,210,0.6);
    border-radius: 50%;
    animation: pulseRing 2s ease-out infinite;
    z-index: 1;
  }
  .pulse-ring--delay { animation-delay: 1s; }
  @keyframes pulseRing {
    0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
    100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
  }
  .position-label {
    position: absolute;
    top: -26px;
    left: 50%;
    transform: translateX(-50%);
    background: #1976d2;
    color: white;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 10px;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  /* ── 設施 Pins ── */
  .landmark-pin {
    position: absolute;
    transform: translate(-50%, -100%);
    z-index: 10;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s;
  }
  .landmark-pin:hover,
  .landmark-pin--selected,
  .landmark-pin--nearby {
    transform: translate(-50%, -100%) scale(1.25);
    z-index: 15;
  }
  .pin-icon {
    font-size: 20px;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
    line-height: 1;
  }
  .pin-label {
    background: rgba(255,255,255,0.93);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    margin-top: 2px;
    white-space: nowrap;
    color: #1a1a1a;
    font-weight: 500;
  }
  .landmark-pin--selected .pin-label { background: #3d7a2d; color: white; }
  .landmark-pin--nearby   .pin-label { background: #1565c0; color: white; }

  /* 手機版：icon 縮小，標籤預設隱藏 */
  @media (max-width: 768px) {
    .pin-icon { font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35)); }
    .pin-label { display: none; }
    .landmark-pin:hover,
    .landmark-pin--selected,
    .landmark-pin--nearby { transform: translate(-50%, -100%); }
    .landmark-pin--selected .pin-label,
    .landmark-pin--nearby   .pin-label { display: block; }
    /* 校準模式：顯示所有標籤方便辨識 */
    .calib-pins-visible .pin-label { display: block; font-size: 9px; padding: 1px 5px; }
  }

  /* ── GPS 資訊卡 ── */
  .gps-info-card {
    background: white;
    border: 1px solid #c8e6b8;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .gps-info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }
  @media (max-width: 576px) {
    .gps-info-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .gps-info-item { text-align: center; }
  .gps-info-label { display: block; font-size: 11px; color: #888; margin-bottom: 2px; }
  .gps-info-val   { font-size: 13px; font-weight: 600; color: #2d2d2d; }
  .nearest-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f0f7ec;
    border-radius: 8px;
    padding: 10px 14px;
    border: 1px solid #c8e6b8;
  }
  .nearest-icon { font-size: 24px; }
  .nearest-name { font-size: 14px; font-weight: 600; color: #3d7a2d; }
  .nearest-dist { font-size: 12px; color: #888; }

  /* ── 設施詳情底板 ── */
  .landmark-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 20px 20px 0 0;
    padding: 24px 32px 36px;
    box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
    z-index: 200;
    text-align: center;
  }
  .sheet-close {
    position: absolute;
    top: 14px;
    right: 16px;
    background: #f5f5f5;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 13px;
    cursor: pointer;
    color: #555;
  }
  .sheet-icon { font-size: 36px; margin-bottom: 8px; }
  .landmark-sheet p { font-size: 14px; color: #555; }
  .sheet-dist { font-size: 13px; color: #1565c0; font-weight: 500; }

  .landmark-tag {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }
  .landmark-tag--green  { background: #e8f5e9; color: #2e7d32; }
  .landmark-tag--orange { background: #fff3e0; color: #e65100; }
  .landmark-tag--gold   { background: #fffde7; color: #f57f17; }

  /* ── 錯誤提示 ── */
  .error-toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #c62828;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 13px;
    z-index: 300;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  /* ── Transitions ── */
  .slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
  .slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(12px); }
  .sheet-enter-active, .sheet-leave-active { transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); }
  .sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
  .pop-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  .pop-enter-from   { opacity: 0; transform: translate(-50%,-50%) scale(0); }
  .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }

  /* ── 地圖模式切換 ── */
  .map-mode-toggle {
    display: flex;
    background: #e8f0e4;
    border-radius: 20px;
    padding: 3px;
    gap: 2px;
    flex-shrink: 0;
  }
  .mode-btn {
    padding: 6px 14px;
    border: none;
    border-radius: 16px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    background: transparent;
    color: #666;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .mode-btn--active {
    background: white;
    color: #2d5a27;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  }

  /* ── Google Maps ── */
  .google-map-wrapper {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #c8e6b8;
    overflow: hidden;
    background: #f0f0f0;
  }
  .google-map-iframe {
    width: 100%;
    height: 480px;
    border: none;
    display: block;
  }
  .google-map-placeholder {
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #888;
    text-align: center;
    padding: 20px;
  }
  .placeholder-icon { font-size: 48px; margin-bottom: 12px; }
  .google-map-placeholder p { font-size: 14px; line-height: 1.6; margin-bottom: 4px; }

  @media (max-width: 768px) {
    .google-map-iframe { height: 380px; }
  }


  .map-ctrl-btn--calib  { background: #fff3e0 !important; border-color: #e65100 !important; color: #e65100 !important; }
  .map-ctrl-btn--output { background: #e8f5e9 !important; border-color: #2e7d32 !important; color: #2e7d32 !important; }

  /* ── 校準模式橫幅 ── */
  .calib-banner {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #fff8e1;
    border-top: 3px solid #ffa000;
    border-radius: 20px 20px 0 0;
    padding: 18px 20px 28px;
    z-index: 200;
    box-shadow: 0 -6px 24px rgba(0,0,0,0.12);
  }
  .calib-banner-title {
    font-size: 15px;
    font-weight: 700;
    color: #e65100;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .calib-banner-close {
    background: #e65100;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 4px 14px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
  }
  .calib-banner p { font-size: 13px; color: #666; margin-bottom: 10px; }
  .calib-recorded-list { display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; }
  .calib-recorded-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border-radius: 8px;
    padding: 7px 10px;
    border: 1px solid #ffe082;
    font-size: 13px;
  }
  .calib-recorded-gps { flex: 1; font-size: 11px; color: #888; text-align: right; }
  .calib-del-btn {
    background: none; border: none; color: #bbb;
    font-size: 13px; cursor: pointer; padding: 0 2px;
  }
  .calib-del-btn:hover { color: #c62828; }
  .calib-empty { font-size: 13px; color: #bbb; text-align: center; padding: 8px 0; }

  /* ── 校準輸出面板 ── */
  .calib-output-panel {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: white;
    border-radius: 20px 20px 0 0;
    padding: 24px 20px 36px;
    z-index: 200;
    box-shadow: 0 -6px 24px rgba(0,0,0,0.15);
  }
  .calib-output-title {
    font-size: 16px;
    font-weight: 700;
    color: #2d5a27;
    margin-bottom: 8px;
  }
  .calib-textarea {
    width: 100%;
    min-height: 120px;
    border: 1px solid #c8e6b8;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: monospace;
    font-size: 13px;
    color: #333;
    background: #f5faf3;
    resize: none;
    margin-bottom: 12px;
  }
  .calib-output-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  /* ── 校準 Toast ── */
  .calib-toast {
    position: fixed;
    top: 80px; left: 50%;
    transform: translateX(-50%);
    background: #2e7d32;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    z-index: 300;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  /* ── 全螢幕模式（CSS 模擬，相容 iOS Safari / Chrome）── */
  .map-wrapper {
    position: relative;
    transition: all 0.3s ease;
  }
  .map-wrapper.map-fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    z-index: 9999 !important;
    border-radius: 0 !important;
    border: none !important;
    background: #111 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }
  .map-wrapper.map-fullscreen .map-container {
    width: auto;
    max-width: 100vw;
  }
  .map-wrapper.map-fullscreen .map-img {
    max-height: 100dvh;
    width: auto;
    max-width: 100vw;
    object-fit: contain;
  }
  .fullscreen-close-btn { display: none; }
  .map-wrapper.map-fullscreen .fullscreen-close-btn {
    display: flex;
    position: absolute;
    top: 14px; right: 14px;
    z-index: 10000;
    width: 40px; height: 40px;
    background: rgba(0,0,0,0.55);
    border: none; border-radius: 50%;
    color: white; font-size: 18px;
    align-items: center; justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
  }
</style>
