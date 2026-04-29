import { defineStore } from 'pinia'
import { ApiService } from '~/services/apiService'

const CACHE_DURATION_MS = 10 * 60 * 1000


function safeLocalStorageGet(key) {
  if (!process.client) return null
  return localStorage.getItem(key)
}

function safeLocalStorageSet(key, value) {
  if (!process.client) return
  localStorage.setItem(key, value)
}

const models = [
  'users',
  'users_data',
  'admins_data',
  'analytics_summary',
  'track',
  'mentors',
  'mentors_review',
  'mentors_session',
  'partners_data',
  'events',
  'contacts',
  'opportunities',
  'applications',
  'applications_adm',
  'saved_opportunities',
  'notifications',
  'resources',
  'recommendations',
  'feedbacks',
  'analytics',
  'admin_users',
  'testimonials',
  'partners',
  'team_members',
  'news_articles',
  'stats_counters',
  'hero_banners',
  'register',
  'login',
  'messages',
  'attendance',
  'services',
  'csv_import',
  'csv_download',
  'opp_category',
  'opp_type',
  'subscribe',
  'mail_newsletter',
  'mail_events',
  'mail_opportunity',
  'reply_messages',
  'page_titles',
  'organizations',
  'youth_volunteers',
  'nyc',
  'jobseekers',
  'jobs',
  'job_applications',
  'ai',
  'serp',
  'communities',
  'communities_membership',
  'admin_communities',
  'admin_organizations',
  'admin_opportunities',
  'communities_join',
  'article_comments',
  'comments_replies',
  'articles_likes',
  'users_fcm_token',
]

export const useDataStore = defineStore('dataStore', {

  state: () => ({
    items: {},
    loading: {},
    message: {},
    error: {},
  }),

  actions: {

    getService(model) {
      const { $api } = useNuxtApp()
      return new ApiService(model, $api)
    },

    ensureModelState(model) {
      if (!this.items[model]) this.items[model] = []
      if (!this.loading[model]) this.loading[model] = false
      if (!this.message[model]) this.message[model] = null
      if (!this.error[model]) this.error[model] = null
    },

    async fetchData(model, forceReload = false, id = null) {

      if (!models.includes(model)) {
        throw new Error(`Model ${model} not registered`)
      }

      this.ensureModelState(model)

      // ✅ SAFE CACHE READ
      if (!forceReload) {
        const cached = safeLocalStorageGet(model)

        if (cached) {
          this.items[model] = JSON.parse(cached)
          return this.items[model]
        }
      }

      const service = this.getService(model)

      try {
        this.loading[model] = true
        this.error[model] = null

        let data = id
          ? await service.getOne(id)
          : await service.getAll()

        this.items[model] = data?.items || data || []

        // ✅ SAFE CACHE WRITE
        safeLocalStorageSet(model, JSON.stringify(this.items[model]))

        return this.items[model]

      } catch (err) {
        this.error[model] =
          err.response?.data?.message || err.message || 'Fetch failed'
        return null
      } finally {
        this.loading[model] = false
      }
    },

    async createItem(model, payload) {
      this.ensureModelState(model)
      const service = this.getService(model)

      try {
        const res = await service.create(payload)

        this.message[model] = res?.message || 'Created successfully'
        this.error[model] = null

        if (res?.item) {
          this.items[model].push(res.item)
        }

        return res

      } catch (err) {
        this.error[model] =
          err.response?.data?.message || 'Error creating item'
        throw err
      }
    },

    async updateItem(model, id, payload) {
      this.ensureModelState(model)
      const service = this.getService(model)

      try {
        const res = await service.update(id, payload)

        this.message[model] = res?.message || 'Updated successfully'

        const index = this.items[model].findIndex(i => i.id === id)
        if (index !== -1) {
          this.items[model][index] = res?.item || res
        }

        return res

      } catch (err) {
        this.error[model] =
          err.response?.data?.message || 'Error updating item'
        throw err
      }
    },

    async deleteItem(model, id) {
      this.ensureModelState(model)
      const service = this.getService(model)

      try {
        const res = await service.delete(id)

        this.items[model] =
          this.items[model].filter(i => i.id !== id)

        this.message[model] = res?.message || 'Deleted successfully'

        return res

      } catch (err) {
        this.error[model] =
          err.response?.data?.message || 'Error deleting item'
        throw err
      }
    }

  }
})