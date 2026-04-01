import axios from 'axios'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://repo-backend-wcq2.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export interface RegisterPayload {
  username: string
  email: string
  password: string
  displayName: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface FeedbackPayload {
  rating: number
  comment: string
}

const AUTH_TOKEN_KEY = 'token'

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const isAuthenticated = () => Boolean(getAuthToken())

// Add token to requests
api.interceptors.request.use((config) => {
  const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/register')

  if (isAuthRoute) {
    delete config.headers.Authorization
    return config
  }

  const token = getAuthToken()
  if (token) {
      config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const apiClient = {
  health: () => api.get('/health'),
  register: (payload: RegisterPayload) => api.post('/auth/register', payload),
  login: (payload: LoginPayload) => api.post('/auth/login', payload),

  getDatasets: () => api.get('/datasets'),
  getDatasetById: (datasetId: string | number) => api.get(`/datasets/${datasetId}`),
  getDatasetFeedback: (datasetId: string | number) => api.get(`/datasets/${datasetId}/feedback`),
  postDatasetFeedback: (datasetId: string | number, payload: FeedbackPayload) =>
    api.post(`/datasets/${datasetId}/feedback`, payload),

  uploadDataset: (formData: FormData) =>
    api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  downloadVersion: (versionId: string | number) =>
    api.get(`/versions/${versionId}/download`, { responseType: 'blob' }),

  suggestMetadata: (datasetId: string | number) =>
    api.post('/ai/suggest-metadata', {
      datasetId: Number(datasetId),
    }),
}

export default api
