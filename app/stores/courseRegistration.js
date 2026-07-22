// stores/courseRegistration.js
//
// 沿用台東一支會 activityRegistration.js 的 state 拆分方式，但 fetch 方式
// 改成這個專案既有的慣例：直接 fetch(`${commonStore.data.main_url}/holy/...`)
// 並帶 credentials: 'include'（cookie 登入），而不是另外包一層 apiFetch。
import { defineStore } from 'pinia'

export const useCourseRegistrationStore = defineStore('courseRegistration', {
  state: () => ({
    courses: [],        // 後台：課程列表（含完整 registrations）
    currentCourse: null, // 後台：單一課程管理頁使用
    publicCourse: null,  // 前台：公開報名頁使用
    myRegistrations: []
  }),

  getters: {
    totalRegistered: (state) => state.currentCourse?.registrations?.length ?? 0,
    pickedCount: (state) =>
        state.currentCourse?.registrations?.filter(r => r.picked).length ?? 0
  },

  actions: {
    _base() {
      const commonStore = useCommonStore()
      return `${commonStore.data.main_url}/holy/course-reg`
    },

    // ── 後台：課程 CRUD ──────────────────────────────────────
    async fetchCourses() {
      const res = await fetch(`${this._base()}/get`, { credentials: 'include' })
      this.courses = await res.json()
    },
    async fetchCourse(id) {
      const res = await fetch(`${this._base()}/get/${id}`, { credentials: 'include' })
      this.currentCourse = await res.json()
    },
    async addCourse(name, description = '') {
      const res = await fetch(`${this._base()}/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      const id = await res.text()
      await this.fetchCourses()
      return id
    },
    async updateCourse(id, name, description) {
      await fetch(`${this._base()}/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, description })
      })
      await this.fetchCourses()
    },
    async removeCourse(id) {
      await fetch(`${this._base()}/remove/${id}`, { method: 'DELETE', credentials: 'include' })
      await this.fetchCourses()
    },
    async updateDeadline(id, deadline) {
      await fetch(`${this._base()}/${id}/deadline`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline })
      })
    },
    async updateCapacity(id, maxCapacity) {
      await fetch(`${this._base()}/${id}/capacity`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCapacity })
      })
    },
    // fields: 完整陣列覆寫 [{ id, label, type, required, options, order }]
    async updateFields(id, fields) {
      await fetch(`${this._base()}/${id}/fields`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
    },
    async uploadCoverImage(id, file) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${this._base()}/${id}/cover-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const path = await res.text()
      const course = this.courses.find(c => c.id === id)
      if (course) course.coverImage = path
      return path
    },
    // 表單「圖片」類型欄位：上傳後回傳網址，前端把網址存進 answers[field.id]
    async uploadAnswerImage(id, file) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${this._base()}/${id}/answer-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      return await res.text()
    },

    // ── 後台：報名名單手動 CRUD ──────────────────────────────
    async addRegistration(id, displayName, answers) {
      await fetch(`${this._base()}/${id}/registration/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, answers })
      })
      await this.fetchCourse(id)
    },
    async updateRegistration(id, regId, displayName, answers) {
      await fetch(`${this._base()}/${id}/registration/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId, displayName, answers })
      })
      await this.fetchCourse(id)
    },
    async removeRegistration(id, regId) {
      await fetch(`${this._base()}/${id}/registration/remove/${regId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      await this.fetchCourse(id)
    },
    async toggle(id, regId) {
      await fetch(`${this._base()}/${id}/toggle/${regId}`, { method: 'PUT', credentials: 'include' })
      await this.fetchCourse(id)
    },
    async reset(id) {
      await fetch(`${this._base()}/${id}/reset`, { method: 'PUT', credentials: 'include' })
      await this.fetchCourse(id)
    },

    // ── 前台：公開報名（需先 Google 登入，任何 group 皆可）──────
    async fetchPublicCourse(id) {
      const res = await fetch(`${this._base()}/public/${id}`, { credentials: 'include' })
      this.publicCourse = await res.json()
    },
    async submitRegistration(id, answers) {
      const res = await fetch(`${this._base()}/${id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      return await res.json()
    },
    async cancelMyRegistration(id) {
      const res = await fetch(`${this._base()}/${id}/register/cancel`, {
        method: 'DELETE',
        credentials: 'include'
      })
      return await res.json()
    },
    async fetchMyRegistrations() {
      const res = await fetch(`${this._base()}/my-registrations`, { credentials: 'include' })
      const data = await res.json()
      this.myRegistrations = data.error ? [] : data
    }
  }
})
