<script setup>
  import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue'
  import {useCommonStore} from '~/stores/common.js'
  import {useCustomerStore} from '~/stores/customer.js'
  import {usePermissionStore} from '~/stores/permission.js'

  const isOpen = ref(false)
  const route = useRoute()

  // 手機版「農莊體驗」子選單開合
  const mobExperienceOpen = ref(false)

  // 換頁時自動關閉所有選單
  watch(() => route.path, () => {
    isOpen.value = false
    mobAvatarOpen.value = false
    mobExperienceOpen.value = false
  })

  function toggleMenu() {
    isOpen.value = !isOpen.value
    if (isOpen.value) mobAvatarOpen.value = false
  }

  // ── 桌機頭像下拉 ──────────────────────────────────────────────────────
  const commonStore = useCommonStore()
  const customerStore = useCustomerStore()
  const BASE = computed(() => commonStore.data.main_url + '/holy/customer')
  const GOOGLE_CLIENT_ID = computed(() => commonStore.data.google_client_id)

  const avatarOpen = ref(false)
  const avatarRef = ref(null)
  const customer = computed(() => customerStore.customer)
  const permissionStore = usePermissionStore()
  const canAccessStaff = computed(() => permissionStore.can('staff.home'))

  const toggleAvatar = () => {
    avatarOpen.value = !avatarOpen.value
    if (avatarOpen.value && !customer.value) {
      nextTick(() => renderGoogleBtn('nav-google-btn'))
    }
  }
  const closeAvatar = () => { avatarOpen.value = false }

  // ── 個人 QRCode ───────────────────────────────────────────────────
  const qrModalOpen = ref(false)
  const qrCodeUrl = computed(() => {
    if (!customer.value?.email) return ''
    // 內容整體用 encodeURIComponent 轉成純 ASCII（%XX 編碼），
    // 因為部分實體條碼掃描器（如 DK-7322）是用 USB 鍵盤模擬方式輸出，
    // 只能「打字」出標準鍵盤按鍵，無法正確輸出中文姓名，
    // 純 ASCII 內容才能確保掃描器和相機掃描都能正確讀出完整資料
    const payload = encodeURIComponent(JSON.stringify({ name: customer.value.name || '', email: customer.value.email }))
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(payload)}`
  })
  const openQrModal = () => {
    qrModalOpen.value = true
    avatarOpen.value = false
    mobAvatarOpen.value = false
  }
  const closeQrModal = () => { qrModalOpen.value = false }

  // ── 手機版頭像下拉 ────────────────────────────────────────────────────
  const mobAvatarOpen = ref(false)
  const mobAvatarRef = ref(null)

  const toggleMobAvatar = () => {
    mobAvatarOpen.value = !mobAvatarOpen.value
    if (mobAvatarOpen.value) isOpen.value = false
    if (mobAvatarOpen.value && !customer.value) {
      nextTick(() => renderGoogleBtn('nav-google-btn-mobile'))
    }
  }

  const onClickOutside = (e) => {
    if (avatarRef.value && !avatarRef.value.contains(e.target)) {
      avatarOpen.value = false
    }
    if (mobAvatarRef.value && !mobAvatarRef.value.contains(e.target)) {
      mobAvatarOpen.value = false
    }
  }

  // ── Google 登入 ───────────────────────────────────────────────────
  const initGoogle = () => {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID.value,
      callback: handleCredential,
      auto_select: false,
    })
  }

  const renderGoogleBtn = (elId) => {
    if (!window.google) return
    const el = document.getElementById(elId)
    if (!el) return
    window.google.accounts.id.renderButton(el, {
      theme: 'outline', size: 'medium', text: 'signin_with', locale: 'zh-TW', width: 220,
    })
  }

  const handleCredential = async (response) => {
    try {
      const res = await fetch(`${BASE.value}/google-login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({credential: response.credential})
      })
      const data = await res.json()
      if (!data.error) {
        customerStore.setCustomer(data)
        await permissionStore.load(data.id, commonStore.data.main_url)
        avatarOpen.value = false
        mobAvatarOpen.value = false
      }
    } catch {}
  }

  const logout = async () => {
    await fetch(`${BASE.value}/logout`, {method: 'POST', credentials: 'include'})
    customerStore.clearCustomer()
    permissionStore.clear()
    avatarOpen.value = false
    mobAvatarOpen.value = false
  }

  const fetchMe = async () => {
    try {
      const data = await (await fetch(`${BASE.value}/me`, {credentials: 'include'})).json()
      if (!data.error) {
        customerStore.setCustomer(data)
        await permissionStore.load(data.id, commonStore.data.main_url)
      }
    } catch {}
  }

  onMounted(async () => {
    await fetchMe()
    document.addEventListener('click', onClickOutside)

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogle()
      document.head.appendChild(script)
    } else if (window.google) {
      initGoogle()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', onClickOutside)
  })

  // 「農莊體驗」子項目
  const experienceItems = [
    { to: '/front/event',              label: '活動報名' },
    { to: '/front/herbs', label: '香藥草圖鑑' },
    // { to: '/front/trial-courses',      label: '體驗課程' },
    // { to: '/front/group-accommodation',label: '團體住宿' },
    // { to: '/front/venue-rental',       label: '場地租借' },
    { to: '/front/park-map',            label: '園區地圖' },
  ]

  // 目前路徑是否落在「農莊體驗」任一子項
  const isExperienceActive = computed(() =>
          experienceItems.some(item => route.path.startsWith(item.to))
  )
</script>

<template>
  <!-- Mobile / Pad Navbar -->
  <nav
          class="nav d-xl-none nav-shadow"
          :class="{ open: isOpen }"
          style="background: url(/images/global/nav-bg.png);"
  >
    <div class="nav-header">
      <div class="navLogo">
        <NuxtLink class="navbar-brand mob-logo" to="/">
          <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊">
        </NuxtLink>
      </div>

      <!-- 手機版頭像 icon -->
      <div class="mob-avatar-wrapper" ref="mobAvatarRef">
        <button v-if="!customer" @click="toggleMobAvatar" class="mob-avatar-btn mob-avatar-btn--guest">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </button>
        <button v-else @click="toggleMobAvatar" class="mob-avatar-btn mob-avatar-btn--user">
          <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="mob-avatar-btn__img">
          <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
        </button>

        <Transition name="mob-avatar-drop">
          <div v-if="mobAvatarOpen" class="mob-avatar-dropdown">
            <div v-if="customer">
              <div class="mob-avatar-dropdown__info">
                <div class="mob-avatar-dropdown__circle">
                  <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="mob-avatar-btn__img">
                  <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
                </div>
                <div class="mob-avatar-dropdown__text">
                  <p class="mob-avatar-dropdown__name">{{ customer.name }}</p>
                  <p class="mob-avatar-dropdown__email">{{ customer.email }}</p>
                </div>
              </div>
              <NuxtLink to="/front/profile/log" @click="mobAvatarOpen = false" class="mob-avatar-dropdown__link">我的紀錄</NuxtLink>
              <NuxtLink to="/front/profile/body-composition" @click="mobAvatarOpen = false" class="mob-avatar-dropdown__link">身體組成分析</NuxtLink>
              <NuxtLink to="/front/profile/settings" @click="mobAvatarOpen = false" class="mob-avatar-dropdown__link">帳號設定</NuxtLink>
              <button @click="openQrModal" class="mob-avatar-dropdown__link mob-avatar-dropdown__link--btn">展示個人QRCode</button>
              <a v-if="canAccessStaff" href="https://holymotherfarm.netlify.app/staff/home" target="_blank" rel="noopener noreferrer" @click="mobAvatarOpen = false" class="mob-avatar-dropdown__link mob-avatar-dropdown__link--staff">員工專區</a>
              <button @click="logout()" class="mob-avatar-dropdown__logout">登出</button>
            </div>
            <div v-else class="mob-avatar-dropdown__login">
              <p class="mob-avatar-dropdown__hint">登入後可查看訂位與便當紀錄</p>
              <div id="nav-google-btn-mobile"></div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="navToggle" :class="{ open: isOpen }" @click="toggleMenu">
        <div class="icon"></div>
      </div>
    </div>

    <ul
            id="menu-menu-principale-1"
            class="vertical menu por"
            role="menu"
            aria-multiselectable="true"
    >
      <li>
        <NuxtLink to="/">首頁</NuxtLink>
        <span>
          <a href="https://www.facebook.com/st.maryhealthfarm/" target="_blank">
            <i class="fab fa-facebook-square" style="transform: scale(1.3) translateX(200%); color:#fff"></i>
          </a>
        </span>
        <span>
          <a href="mailto:healthfarm@st-mary.com.tw">
            <i class="fas fa-envelope" style="transform: scale(1.3) translateX(250%); color:#fff"></i>
          </a>
        </span>
      </li>
      <li id="mob-menu">
        <NuxtLink to="/front/news">最新消息</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/front/about">關於我們</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/front/production">產品訂購</NuxtLink>
      </li>

      <!-- ★ 農莊體驗 手機版 accordion -->
      <li class="mob-exp-parent" :class="{ 'mob-exp-open': mobExperienceOpen }">
        <a class="mob-exp-toggle" href="#" @click.prevent="mobExperienceOpen = !mobExperienceOpen">農莊體驗</a>
        <button class="mob-exp-arrow-btn" @click="mobExperienceOpen = !mobExperienceOpen" aria-label="展開農莊體驗">
          <svg class="mob-exp-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <Transition name="mob-exp-slide">
          <ul v-if="mobExperienceOpen" class="mob-exp-sub">
            <li v-for="item in experienceItems" :key="item.to">
              <NuxtLink :to="item.to" @click="isOpen = false; mobExperienceOpen = false">
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </Transition>
      </li>

      <li role="menuitem">
        <NuxtLink to="/front/restaurant">田園餐廳</NuxtLink>
      </li>
      <li role="menuitem">
        <NuxtLink to="/front/cafe">休憩小舖</NuxtLink>
      </li>
      <li role="menuitem">
        <NuxtLink to="/front/access">交通方式</NuxtLink>
      </li>

      <div class="por">
        <img src="/images/homepage/healthfarm_hp_ill_cloud1.png" class="nav-cloud1">
        <img src="/images/homepage/healthfarm_hp_ill_cloud2.png" class="nav-cloud2">
        <img src="/images/homepage/healthfarm_hp_ill_cloud3.png" alt="" class="nav-cloud3">
      </div>
      <div class="col-10 col-sm-8 mx-auto">
        <img src="/images/homepage/healthfarm_hp_news_people.png" class="mob-nav-people img-fluid">
      </div>
    </ul>
  </nav>

  <!-- Desktop Navbar -->
  <div class="d-none d-xl-block">
    <nav class="navbar navbar-expand-xl navbar-light bg-light nav-shadow d-nav"
         id="navbar" style="position: relative;">
      <div class="container">
        <div class="col-xl-3 align-middle pl-5">
          <NuxtLink class="navbar-brand d-logo" to="/">
            <img src="/images/global/healthfarm_logo.png" alt="聖母健康農莊">
          </NuxtLink>
        </div>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup"
                aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="d-none d-xl-inline-block col-xl-1"></div>
        <div class="collapse navbar-collapse col-xl-8" id="navbarNavAltMarkup">
          <div class="navbar-nav">
            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/news" style="color:#2a1001; font-weight: 500;">
                最新消息
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>
            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/about" style="color:#2a1001; font-weight: 500;">
                關於我們
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>
            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/production" style="color:#2a1001; font-weight: 500;">
                產品訂購
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>

            <!-- ★ 農莊體驗 桌機版 hover 下拉 -->
            <div class="nav-box nav-box--dropdown mr-lg-3" :class="{ 'is-active': isExperienceActive }">
              <button class="nav-item nav-link nav-cus nav-exp-btn" style="color:#2a1001; font-weight: 500;">
                農莊體驗
                <svg class="nav-exp-caret" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 3.5l3.5 3 3.5-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
              <!-- 下拉面板 -->
              <div class="nav-exp-dropdown">
                <NuxtLink
                        v-for="item in experienceItems"
                        :key="item.to"
                        :to="item.to"
                        class="nav-exp-item"
                >
                  {{ item.label }}
                </NuxtLink>
              </div>
            </div>

            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/restaurant" style="color:#2a1001; font-weight: 500;">
                田園餐廳
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>
            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/cafe" style="color:#2a1001; font-weight: 500;">
                休憩小舖
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>
            <div class="nav-box mr-lg-3">
              <NuxtLink class="nav-item nav-link nav-cus" to="/front/access" style="color:#2a1001; font-weight: 500;">
                交通方式
              </NuxtLink>
              <div class="nav-line-mask"><div class="nav-line-bar"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌機頭像區 -->
      <div class="avatar-wrapper" ref="avatarRef">
        <button v-if="!customer" @click="toggleAvatar" class="avatar-btn avatar-btn--guest">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </button>
        <button v-else @click="toggleAvatar" class="avatar-btn avatar-btn--user">
          <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="avatar-btn__img">
          <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() || '?' }}</span>
        </button>

        <Transition name="avatar-drop">
          <div v-if="avatarOpen" class="avatar-dropdown">
            <div v-if="customer" class="avatar-dropdown__header">
              <div class="avatar-dropdown__avatar">
                <img v-if="customer.picture" :src="customer.picture" :alt="customer.name" class="avatar-dropdown__img">
                <span v-else>{{ customer.name?.charAt(0)?.toUpperCase() }}</span>
              </div>
              <div class="avatar-dropdown__info">
                <p class="avatar-dropdown__name">{{ customer.name }}</p>
                <p class="avatar-dropdown__email">{{ customer.email }}</p>
              </div>
            </div>
            <div v-else class="avatar-dropdown__header avatar-dropdown__header--login">
              <p class="avatar-dropdown__hint">登入後可查看訂位與便當紀錄</p>
              <div id="nav-google-btn"></div>
            </div>
            <ul v-if="customer" class="avatar-dropdown__menu">
              <li>
                <NuxtLink to="/front/profile/log" @click="closeAvatar" class="avatar-dropdown__item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  我的紀錄
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/front/profile/body-composition" @click="closeAvatar" class="avatar-dropdown__item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 3v3m0 12v3m-9-9h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"/><circle cx="12" cy="12" r="4"/>
                  </svg>
                  身體組成分析
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/front/profile/settings" @click="closeAvatar" class="avatar-dropdown__item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  帳號設定
                </NuxtLink>
              </li>
              <li>
                <button @click="openQrModal" class="avatar-dropdown__item avatar-dropdown__item--btn">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4h6v6H4V4zm0 10h6v6H4v-6zm10-10h6v6h-6V4zm0 10h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
                  </svg>
                  展示個人QRCode
                </button>
              </li>
              <li v-if="canAccessStaff">
                <a href="https://holymotherfarm.netlify.app/staff/home" target="_blank" rel="noopener noreferrer" @click="closeAvatar" class="avatar-dropdown__item avatar-dropdown__item--staff">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9"/>
                  </svg>
                  員工專區
                </a>
              </li>
              <li class="avatar-dropdown__divider">
                <button @click="logout" class="avatar-dropdown__logout">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  登出
                </button>
              </li>
            </ul>
          </div>
        </Transition>
      </div>

    </nav>
  </div>

  <!-- 個人 QRCode Modal -->
  <Teleport to="body">
    <Transition name="qr-modal-fade">
      <div v-if="qrModalOpen" class="qr-modal-overlay" @click.self="closeQrModal">
        <div class="qr-modal">
          <button class="qr-modal__close" @click="closeQrModal" aria-label="關閉">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div class="qr-modal__avatar">
            <img v-if="customer?.picture" :src="customer.picture" :alt="customer.name" class="qr-modal__avatar-img">
            <span v-else>{{ customer?.name?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <p class="qr-modal__name">{{ customer?.name }}</p>
          <p class="qr-modal__email">{{ customer?.email }}</p>
          <div class="qr-modal__code">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="個人 QRCode" width="220" height="220">
          </div>
          <p class="qr-modal__hint">出示此 QRCode 供員工掃描辨識</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  /* ════════════════════════════════════════════════════
     桌機「農莊體驗」下拉
  ════════════════════════════════════════════════════ */
  .nav-box--dropdown {
    position: relative;
  }

  /* 整個 nav-box hover 時顯示下拉 */
  .nav-box--dropdown:hover .nav-exp-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }

  /* 子項目被選中時，父按鈕底線常駐 */
  .nav-box--dropdown.is-active .nav-line-bar {
    width: 100%;
  }

  .nav-exp-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    /* 完全複製全域 .nav-link 的樣式 */
    line-height: 40px;
    transform: translateY(5px);
    font-size: 19px;
    color: #2a1001;
    font-weight: 500;
    font-family: inherit;
    white-space: nowrap;
  }

  .nav-exp-caret {
    transition: transform 0.2s;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .nav-box--dropdown:hover .nav-exp-caret {
    transform: rotate(180deg);
  }

  /* 下拉面板 */
  .nav-exp-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(-6px);
    min-width: 130px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    border: 1px solid #f0f0f0;
    padding: 6px 0;
    z-index: 1050;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
  }

  /* 讓 hover 區域連接 trigger 與面板，避免滑鼠移動時閃掉 */
  .nav-exp-dropdown::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    height: 12px;
  }

  .nav-exp-item {
    display: block;
    padding: 8px 18px;
    color: #2a1001;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .nav-exp-item:hover,
  .nav-exp-item.router-link-active {
    background: #f0fdf9;
    color: #1a7a52;
    text-decoration: none;
  }
  .nav-exp-item.router-link-active {
    font-weight: 600;
  }

  /* ════════════════════════════════════════════════════
     手機版「農莊體驗」accordion
  ════════════════════════════════════════════════════ */
  .mob-exp-parent {
    list-style: none;
    position: relative;
  }

  /* <a> 不加任何 CSS，讓全域 li>a 自然套用 */

  /* 箭頭 button：overlay 在 <a> 同一行，用負 margin 貼著 <a> 的底部往上推 */
  .mob-exp-arrow-btn {
    position: absolute;
    right: 16px;
    top: 0;
    /* 與全域 li>a 的高度相同，讓箭頭垂直置中在文字行 */
    height: var(--mob-nav-item-height, 62px);
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: inherit;
  }

  .mob-exp-arrow {
    transition: transform 0.25s;
    display: block;
  }
  .mob-exp-open .mob-exp-arrow {
    transform: rotate(180deg);
  }

  /* 子項目 */
  .mob-exp-sub {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mob-exp-sub li a {
    font-size: 0.88em;
    opacity: 0.88;
  }
  .mob-exp-sub li a:hover,
  .mob-exp-sub li a.router-link-active {
    opacity: 1;
    font-weight: 600;
  }

  /* slide transition */
  .mob-exp-slide-enter-active,
  .mob-exp-slide-leave-active {
    transition: max-height 0.25s ease, opacity 0.2s ease;
    overflow: hidden;
    max-height: 300px;
  }
  .mob-exp-slide-enter-from,
  .mob-exp-slide-leave-to {
    max-height: 0;
    opacity: 0;
  }

  /* ════════════════════════════════════════════════════
     以下維持原有樣式不變
  ════════════════════════════════════════════════════ */

  /* 桌機頭像：絕對定位在 navbar 右側 */
  .avatar-wrapper {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1060;
  }

  .avatar-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 2px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    background: none;
    padding: 0;
    line-height: 1;
    overflow: hidden;
  }
  .avatar-btn--guest { background-color: #f8f9fa; color: #6c757d; }
  .avatar-btn--guest:hover { border-color: #1FC29C; color: #1FC29C; }
  .avatar-btn--user { background-color: #1FC29C; color: #fff; font-weight: 700; font-size: 14px; border-color: #1FC29C; }
  .avatar-btn--user:hover { opacity: 0.88; }
  .avatar-btn__img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }

  .avatar-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    width: 305px;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    border: 1px solid #f0f0f0;
    overflow: hidden;
    z-index: 1060;
  }
  .avatar-dropdown__header { padding: 16px; border-bottom: 1px solid #f5f5f5; display: flex; align-items: center; gap: 12px; }
  .avatar-dropdown__header--login { flex-direction: column; align-items: flex-start; }
  .avatar-dropdown__avatar { width: 38px; height: 38px; border-radius: 50%; background-color: #1FC29C; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .avatar-dropdown__img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
  .avatar-dropdown__name { font-size: 14px; font-weight: 600; color: #333; margin: 0; }
  .avatar-dropdown__email { font-size: 12px; color: #999; margin: 0; }
  .avatar-dropdown__hint { font-size: 13px; color: #666; margin: 0 0 10px; }
  .avatar-dropdown__menu { list-style: none; padding: 6px 0; margin: 0; }
  .avatar-dropdown__item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; font-size: 14px; color: #444; text-decoration: none; transition: background 0.15s, color 0.15s; }
  .avatar-dropdown__item:hover { background-color: #f0fdf9; color: #1FC29C; text-decoration: none; }
  .avatar-dropdown__divider { border-top: 1px solid #f5f5f5; margin-top: 4px; }
  .avatar-dropdown__logout { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 16px; font-size: 18px; color: #e74c3c; background: none; border: none; cursor: pointer; transition: background 0.15s; text-align: left; }
  .avatar-dropdown__logout:hover { background-color: #fff5f5; }
  .avatar-dropdown__item--btn { width: 100%; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }

  .avatar-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
  .avatar-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
  .avatar-drop-enter-from { opacity: 0; transform: scale(0.95) translateY(4px); }
  .avatar-drop-leave-to { opacity: 0; transform: scale(0.95); }

  /* 手機版頭像 */
  .mob-avatar-wrapper { position: fixed; right: 68px; top: 23px; z-index: 3000; }
  .mob-avatar-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; overflow: hidden; background: rgba(255,255,255,0.2); border: 2px solid rgba(0,0,0,0.12); color: #fff; transition: background 0.2s; }
  .mob-avatar-btn--user { background-color: #1FC29C; color: #fff; font-weight: 700; font-size: 13px; border-color: #fff; }
  .mob-avatar-btn--user:hover { opacity: 0.88; }
  .mob-avatar-btn__img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }

  .mob-avatar-dropdown { position: fixed; right: 12px; top: 68px; width: min(260px, calc(100vw - 24px)); background: #fff; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.12); border: 1px solid #f0f0f0; overflow: hidden; z-index: 3000; }
  .mob-avatar-dropdown__info { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
  .mob-avatar-dropdown__circle { width: 38px; height: 38px; border-radius: 50%; background-color: #1FC29C; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .mob-avatar-dropdown__text { min-width: 0; }
  .mob-avatar-dropdown__name { font-size: 14px; font-weight: 600; color: #333; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mob-avatar-dropdown__email { font-size: 11px; color: #999; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mob-avatar-dropdown__link { display: block; font-size: 14px; color: #444; padding: 9px 16px; text-decoration: none; transition: background 0.15s, color 0.15s; }
  .mob-avatar-dropdown__link:hover { background-color: #f0fdf9; color: #1FC29C; text-decoration: none; }
  .mob-avatar-dropdown__logout { display: block; width: 100%; text-align: left; font-size: 14px; color: #e74c3c; background: none; border: none; cursor: pointer; padding: 9px 16px; transition: background 0.15s; }
  .mob-avatar-dropdown__logout:hover { background-color: #fff5f5; }
  .mob-avatar-dropdown__login { padding: 14px 16px; }
  .mob-avatar-dropdown__hint { font-size: 13px; color: #666; margin: 0 0 10px; }
  .mob-avatar-dropdown__link--btn { width: 100%; background: none; border: none; cursor: pointer; font-family: inherit; }

  .mob-avatar-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
  .mob-avatar-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
  .mob-avatar-drop-enter-from { opacity: 0; transform: scale(0.95) translateY(4px); }
  .mob-avatar-drop-leave-to { opacity: 0; transform: scale(0.95); }

  /* ════════════════════════════════════════════════════
     個人 QRCode Modal
  ════════════════════════════════════════════════════ */
  .qr-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5000;
    padding: 16px;
  }

  .qr-modal {
    position: relative;
    background: #fff;
    border-radius: 18px;
    padding: 32px 28px 26px;
    width: min(320px, 100%);
    text-align: center;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }

  .qr-modal__close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #f5f5f5;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .qr-modal__close:hover { background: #eee; color: #333; }

  .qr-modal__avatar {
    width: 60px;
    height: 60px;
    margin: 0 auto 10px;
    border-radius: 50%;
    background-color: #1FC29C;
    color: #fff;
    font-weight: 700;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .qr-modal__avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .qr-modal__name { font-size: 16px; font-weight: 600; color: #333; margin: 0; }
  .qr-modal__email { font-size: 12px; color: #999; margin: 2px 0 18px; }

  .qr-modal__code {
    width: 240px;
    height: 240px;
    margin: 0 auto;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qr-modal__code img { width: 100%; height: 100%; object-fit: contain; }

  .qr-modal__hint { font-size: 12px; color: #999; margin: 14px 0 0; }

  .qr-modal-fade-enter-active,
  .qr-modal-fade-leave-active { transition: opacity 0.18s ease; }
  .qr-modal-fade-enter-from,
  .qr-modal-fade-leave-to { opacity: 0; }
  .qr-modal-fade-enter-active .qr-modal,
  .qr-modal-fade-leave-active .qr-modal { transition: transform 0.18s ease; }
  .qr-modal-fade-enter-from .qr-modal,
  .qr-modal-fade-leave-to .qr-modal { transform: scale(0.95) translateY(6px); }
</style>