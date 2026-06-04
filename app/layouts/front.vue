<template>
  <FrontNavbar />
  <div class="overflow">
    <slot />
    <<FrontFooter />
    <button @click="topFunction" id="myBtn" title="Go to top" class="d-lg-none">
      <i class="fas fa-chevron-up"></i>
    </button>
  </div>
</template>

<script setup>
const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const permissionStore = usePermissionStore()

onMounted(async () => {
  const customerId = customerStore.isLoggedIn ? customerStore.customer.id : null
  if (!permissionStore.loaded) {
    await permissionStore.load(customerId, commonStore.data.main_url)
  } else {
    permissionStore.load(customerId, commonStore.data.main_url, true)
  }
})

function topFunction() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

if (import.meta.client) {
  window.onscroll = () => {
    const btn = document.getElementById('myBtn')
    if (btn) btn.style.display =
      document.body.scrollTop > 20 || document.documentElement.scrollTop > 20 ? 'block' : 'none'
  }
}
</script>

<style lang="scss">
@use '~/assets/scss/all' as *;
</style>
