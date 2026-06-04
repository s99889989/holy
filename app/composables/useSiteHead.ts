interface SiteHeadOptions {
  title?: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterImage?: string
  ogUrl?: string
}

export function useSiteHead({
  title = '台東聖母健康農莊',
  description = '台東聖母健康農莊，提供田園餐廳、休憩小舖、有機農產品及活動報名等服務。',
  ogTitle,
  ogDescription = '健康由安全飲食出發，我們希望能成為民眾健康的促進者，除提供安全的飲食外， 也積極與部落及小農合作，輔導提供安全或有機的食材， 期盼能帶動部落朝向安全有機發展，進而改善促進部落與小農經濟。',
  ogImage = 'https://holymotherfarm.netlify.app/images/og_image.jpg',
  twitterImage = 'https://holymotherfarm.netlify.app/images/og_image.jpg',
  ogUrl
}: SiteHeadOptions = {}) {
  const resolvedOgTitle = ogTitle ?? title
  const resolvedOgDescription = ogDescription ?? description

  useHead({
    title,
    meta: [
      { charset: 'UTF-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { 'http-equiv': 'X-UA-Compatible', 'content': 'ie=edge' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'description', content: description },

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: '台東聖母健康農莊' },
      { property: 'og:title', content: resolvedOgTitle },
      { property: 'og:description', content: resolvedOgDescription },
      { property: 'og:image', content: ogImage },
      { property: 'twitter:image', content: twitterImage },
      ...(ogUrl ? [{ property: 'og:url', content: ogUrl }] : [])
    ],
    link: [
      {
        rel: 'stylesheet',
        href: 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css',
        integrity: 'sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh',
        crossorigin: 'anonymous'
      },
      {
        rel: 'stylesheet',
        href: 'https://unpkg.com/aos@next/dist/aos.css'
      },
      {
        rel: 'stylesheet',
        href: 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
        integrity: 'sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN',
        crossorigin: 'anonymous'
      },
      {
        rel: 'stylesheet',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css'
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css?family=Noto+Sans+TC:300,400,500,700,900|Noto+Serif+TC:300,400,500,700,900&display=swap&subset=chinese-traditional'
      },
      {
        rel: 'shortcut icon',
        type: 'image/x-icon',
        href: '/images/favicon.ico'
      }
    ],
    script: [
      {
        src: 'https://code.jquery.com/jquery-3.4.1.slim.min.js',
        integrity: 'sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n',
        crossorigin: 'anonymous'
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js',
        integrity: 'sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo',
        crossorigin: 'anonymous'
      },
      {
        src: 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js',
        integrity: 'sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6',
        crossorigin: 'anonymous'
      },
      {
        src: 'https://unpkg.com/aos@next/dist/aos.js'
      },
      {
        src: 'https://connect.facebook.net/zh_TW/sdk.js#xfbml=1&version=v3.3',
        async: true,
        defer: true,
        crossorigin: 'anonymous'
      }
    ]
  })
}
