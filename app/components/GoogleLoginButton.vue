<template>
  <div>
    <!-- 已登入：顯示帳號資訊 -->
    <div v-if="customerStore.customer" class="google-login-info">
      <div class="google-login-info__avatar">
        <img
          v-if="customerStore.customer.picture"
          :src="customerStore.customer.picture"
          :alt="customerStore.customer.name"
          class="google-login-info__avatar-img"
        >
        <span v-else>{{ customerStore.customer.name?.charAt(0)?.toUpperCase() || '?' }}</span>
      </div>
      <div class="google-login-info__text">
        <p class="google-login-info__name">{{ customerStore.customer.name }}</p>
        <p class="google-login-info__email">{{ customerStore.customer.email }}</p>
      </div>
    </div>

    <!-- 未登入：Google 按鈕（由 SDK 渲染） -->
    <div v-else class="google-login-guest">
      <p class="google-login-guest__hint">登入 Google 帳號可自動填入資料並查詢歷史紀錄</p>
      <div :id="btnId"></div>
    </div>
  </div>
</template>

<script setup>
import {onMounted} from 'vue'
import {useCustomerStore} from '~/stores/customer.js'

const props = defineProps({
  btnId: {type: String, default: 'google-login-btn'}
})

const customerStore = useCustomerStore()

onMounted(() => {
  if (!customerStore.customer && window.google) {
    window.google.accounts.id.renderButton(
      document.getElementById(props.btnId),
      {theme: 'outline', size: 'large', text: 'signin_with', locale: 'zh-TW', width: 280}
    )
  }
})
</script>

<style scoped>
/* ── 已登入狀態 ── */
.google-login-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #eef7f5;
  border-radius: 12px;
  padding: 12px 16px;
}

.google-login-info__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: #1FC29C;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.google-login-info__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.google-login-info__text {
  min-width: 0;
}

.google-login-info__name {
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.google-login-info__email {
  font-size: 12px;
  color: #aaa;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 未登入狀態 ── */
.google-login-guest {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.google-login-guest__hint {
  font-size: 13px;
  color: #888;
  margin: 0;
  text-align: center;
}
</style>
