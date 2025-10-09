import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { config, endpoints, errorMessages } from './config'
import { toast } from 'react-hot-toast'

// Types
interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  timestamp?: string
}

interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
  skipErrorHandling?: boolean
  showSuccessToast?: boolean
  customErrorMessage?: string
}

// Create axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('viralsafe-auth-token')
      if (token && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Calculate request duration
      const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime()
      
      if (config.features.enableDebugMode) {
        console.log(`✅ API Request completed in ${duration}ms:`, {
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          duration: `${duration}ms`
        })
      }

      // Show success toast if requested
      if (response.config.showSuccessToast && response.data?.message) {
        toast.success(response.data.message)
      }

      return response
    },
    (error: AxiosError) => {
      const apiError = handleApiError(error)
      
      // Don't show error toast if error handling is skipped
      if (!error.config?.skipErrorHandling) {
        const message = error.config?.customErrorMessage || apiError.message
        toast.error(message)
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}

// Handle API errors
const handleApiError = (error: AxiosError): ApiError => {
  if (config.features.enableDebugMode) {
    console.error('❌ API Error:', error)
  }

  // Network error
  if (!error.response) {
    return {
      message: errorMessages.network,
      code: 'NETWORK_ERROR',
      status: 0
    }
  }

  const { status, data } = error.response
  
  // Extract error message from response
  let message = errorMessages.general
  if (typeof data === 'object' && data?.message) {
    message = data.message
  } else if (typeof data === 'string') {
    message = data
  }

  // Handle specific status codes
  switch (status) {
    case 401:
      // Clear auth token on unauthorized
      localStorage.removeItem('viralsafe-auth-token')
      localStorage.removeItem('viralsafe-user')
      message = errorMessages.unauthorized
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login'
      }
      break
    case 422:
      message = errorMessages.validation
      break
    case 500:
      message = errorMessages.server
      break
  }

  return {
    message,
    code: data?.code || `HTTP_${status}`,
    status,
    details: data?.details
  }
}

// Create API instance
export const api = createApiInstance()

// Generic API methods
export const apiClient = {
  // GET request
  get: async <T = any>(
    url: string, 
    config?: RequestConfig
  ): Promise<T> => {
    const response = await api.get<ApiResponse<T>>(url, config)
    return response.data.data || response.data
  },

  // POST request
  post: async <T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  },

  // PUT request
  put: async <T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  },

  // DELETE request
  delete: async <T = any>(
    url: string, 
    config?: RequestConfig
  ): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url, config)
    return response.data.data || response.data
  },

  // PATCH request
  patch: async <T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> => {
    const response = await api.patch<ApiResponse<T>>(url, data, config)
    return response.data.data || response.data
  },

  // Upload file
  upload: async <T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data.data || response.data
  },
}

// Specific API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post(endpoints.auth.login, credentials, { showSuccessToast: true }),

  register: (userData: { email: string; password: string; username: string }) =>
    apiClient.post(endpoints.auth.register, userData, { showSuccessToast: true }),

  logout: () =>
    apiClient.post(endpoints.auth.logout, {}, { showSuccessToast: true }),

  getProfile: () =>
    apiClient.get(endpoints.auth.profile),

  refreshToken: () =>
    apiClient.post(endpoints.auth.refresh, {}, { skipErrorHandling: true }),

  verifyEmail: (token: string) =>
    apiClient.post(endpoints.auth.verify, { token }, { showSuccessToast: true }),
}

export const postsApi = {
  create: (postData: any) =>
    apiClient.post(endpoints.posts.create, postData, { showSuccessToast: true }),

  list: (params?: any) =>
    apiClient.get(endpoints.posts.list, { params }),

  get: (id: string) =>
    apiClient.get(endpoints.posts.get(id)),

  update: (id: string, data: any) =>
    apiClient.put(endpoints.posts.update(id), data, { showSuccessToast: true }),

  delete: (id: string) =>
    apiClient.delete(endpoints.posts.delete(id), { showSuccessToast: true }),

  like: (id: string) =>
    apiClient.post(endpoints.posts.like(id), {}, { skipErrorHandling: true }),

  unlike: (id: string) =>
    apiClient.post(endpoints.posts.unlike(id), {}, { skipErrorHandling: true }),

  vote: (id: string, voteType: 'up' | 'down', amount?: number) =>
    apiClient.post(endpoints.posts.vote(id), { voteType, amount }),

  getComments: (id: string) =>
    apiClient.get(endpoints.posts.comments(id)),
}

export const usersApi = {
  getProfile: (id: string) =>
    apiClient.get(endpoints.users.profile(id)),

  updateProfile: (id: string, data: any) =>
    apiClient.put(endpoints.users.update(id), data, { showSuccessToast: true }),

  follow: (id: string) =>
    apiClient.post(endpoints.users.follow(id), {}, { showSuccessToast: true }),

  unfollow: (id: string) =>
    apiClient.post(endpoints.users.unfollow(id), {}, { showSuccessToast: true }),

  getFollowers: (id: string) =>
    apiClient.get(endpoints.users.followers(id)),

  getFollowing: (id: string) =>
    apiClient.get(endpoints.users.following(id)),
}

export const nftApi = {
  mint: (data: any) =>
    apiClient.post(endpoints.nft.mint, data, { showSuccessToast: true }),

  list: (params?: any) =>
    apiClient.get(endpoints.nft.list, { params }),

  get: (id: string) =>
    apiClient.get(endpoints.nft.get(id)),

  transfer: (id: string, to: string) =>
    apiClient.post(endpoints.nft.transfer(id), { to }, { showSuccessToast: true }),

  getMarketplace: (params?: any) =>
    apiClient.get(endpoints.nft.marketplace, { params }),

  getMetadata: (id: string) =>
    apiClient.get(endpoints.nft.metadata(id)),
}

export const stakingApi = {
  stake: (amount: string) =>
    apiClient.post(endpoints.staking.stake, { amount }, { showSuccessToast: true }),

  unstake: (amount: string) =>
    apiClient.post(endpoints.staking.unstake, { amount }, { showSuccessToast: true }),

  getRewards: () =>
    apiClient.get(endpoints.staking.rewards),

  claimRewards: () =>
    apiClient.post(endpoints.staking.claim, {}, { showSuccessToast: true }),

  getInfo: () =>
    apiClient.get(endpoints.staking.info),
}

export const analyticsApi = {
  getOverview: () =>
    apiClient.get(endpoints.analytics.overview),

  getPostsAnalytics: (params?: any) =>
    apiClient.get(endpoints.analytics.posts, { params }),

  getUsersAnalytics: (params?: any) =>
    apiClient.get(endpoints.analytics.users, { params }),

  getTokensAnalytics: (params?: any) =>
    apiClient.get(endpoints.analytics.tokens, { params }),

  getRevenueAnalytics: (params?: any) =>
    apiClient.get(endpoints.analytics.revenue, { params }),
}

// Health check
export const healthApi = {
  check: () =>
    apiClient.get(endpoints.health, { skipErrorHandling: true }),

  getStatus: () =>
    apiClient.get(endpoints.status, { skipErrorHandling: true }),
}

// Rate limiting helper
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  canMakeRequest(key: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= limit) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return true
  }

  getRemainingRequests(key: string, limit: number, windowMs: number = 60000): number {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    const validRequests = requests.filter(time => now - time < windowMs)
    
    return Math.max(0, limit - validRequests.length)
  }
}

export const rateLimiter = new RateLimiter()

// Export types
export type { ApiError, ApiResponse, RequestConfig }