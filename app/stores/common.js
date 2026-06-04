import { defineStore } from 'pinia'

export const useCommonStore = defineStore('useFamilyStore', () => {
  // https://madustrialtd.asuscomm.com:9100
  // http://localhost:9100
  // https://madustrialtd.asuscomm.com:8080
  // https://api.karltw.com:8080
  // http://localhost:8080
  const data = reactive({
    main_url: 'https://madustrialtd.asuscomm.com:8080',
    google_client_id: '441605672654-9j73r51g6j2mar17ptblhskfvard1em9.apps.googleusercontent.com'
  })
  return { data }
})
