import { defineStore } from 'pinia'

export const useCommonStore = defineStore('useFamilyStore', () => {
  // https://madustrialtd.asuscomm.com:9100
  // http://localhost:9100
  // https://madustrialtd.asuscomm.com:8080
  // https://api.karltw.com:8080
  // http://localhost:8080
  const data = reactive({
    // 改成空字串：站內所有 fetch（FrontNavbar、booking、lunch、soybeans、
    // production、profile 等等）都是用 main_url + '/holy/xxx' 組網址，
    // 改成相對路徑後，瀏覽器看到的請求一律是「自己網域」，
    // cookie 因此變成第一方 cookie，不會再被 iOS Safari 的 ITP
    // （跨站第三方 cookie 限制）擋掉。真正要打哪個後端主機，
    // 改在 nuxt.config.ts 的 routeRules proxy 那邊設定。
    main_url: '',
    google_client_id: '441605672654-9j73r51g6j2mar17ptblhskfvard1em9.apps.googleusercontent.com'
  })
  return { data }
})