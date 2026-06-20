// https://nuxt.com/docs/api/configuration/nuxt-config

// 後端主機網址：可用環境變數覆寫（例如本機開發時切到 localhost），
// 沒有設定時預設打正式後端
const apiBaseUrl = (process.env.API_BASE_URL || 'https://madustrialtd.asuscomm.com:8080').replace(/\/$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/scss/all.scss'],
  routeRules: {
    // ── API 反向代理 ─────────────────────────────────────────────
    // 把 /holy/** 在伺服器端（Nitro）轉發到真正的後端主機，瀏覽器端
    // 只看到自己網域的請求。這是為了解決 iOS Safari（WebKit 引擎）
    // ITP 機制會限制或擋掉跨站第三方 cookie，導致開新分頁/分享連結
    // 後 /holy/customer/me 讀不到登入 cookie 的問題。
    '/holy/**': {
      proxy: `${apiBaseUrl}/holy/**`
    }
  },
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
          integrity: 'sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN',
          crossorigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css',
        },
      ],
    },
  },
})