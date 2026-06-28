import { getToken, removeToken } from '../auth'
import { DeviceEventEmitter } from 'react-native'
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `JWT ${token}`)
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      await removeToken()
      DeviceEventEmitter.emit('force_logout')
    }
    let message = 'An error occurred'
    try {
      const err = await response.json()
      message = err?.message || err?.error || message
    } catch (_) {}
    throw new Error(message)
  }

  return response.json()
}

export default {
  customFetch: async (endpoint: string) => {
    return fetchWithAuth(endpoint)
  },
  fetchRoutines: async (userId: string | number) => {
    const res = await fetchWithAuth(`/custom/routines?userId=${userId}`)
    return res.docs || res || []
  },
  fetchExercises: async () => {
    const res = await fetchWithAuth('/custom/exercises')
    return res.docs || res || []
  },
  fetchHistory: async (startDate?: string, endDate?: string) => {
    let url = '/custom/history'
    const query: string[] = []
    if (startDate) query.push(`startDate=${encodeURIComponent(startDate)}`)
    if (endDate) query.push(`endDate=${encodeURIComponent(endDate)}`)
    if (query.length > 0) {
      url += `?${query.join('&')}`
    }
    const res = await fetchWithAuth(url)
    return res.docs || res || []
  },
  loadWorkout: async (routineId: string | number) => {
    return fetchWithAuth(`/custom/workouts/load?routineId=${routineId}`)
  },
  saveWorkout: async (data: Record<string, unknown>) => {
    const res = await fetchWithAuth('/custom/workouts/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.doc || res
  },
  fetchWeightLogs: async () => {
    const res = await fetchWithAuth('/body-weight-logs?sort=-loggedAt&limit=50')
    return res.docs || res || []
  },
  createWeightLog: async (data: { weight: number; loggedAt?: string }) => {
    const res = await fetchWithAuth('/body-weight-logs', { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
  },
  deleteWeightLog: async (id: number | string) => {
    await fetchWithAuth(`/body-weight-logs/${id}`, { method: 'DELETE' })
  },
  updateWeightLog: async (id: number | string, data: { weight: number; loggedAt?: string }) => {
    const res = await fetchWithAuth(`/body-weight-logs/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    return res.doc || res
  },
  createExercise: async (data: { name: string; muscleGroupId: string | number; equipment?: string; isCustom?: boolean }) => {
    const res = await fetchWithAuth('/custom/exercises', { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
  },
  fetchMuscleGroups: async () => {
    const res = await fetchWithAuth('/muscle-groups?limit=100')
    return res.docs || res
  },
  deleteExercise: async (id: number | string) => {
    await fetchWithAuth(`/exercises/${id}`, { method: 'DELETE' })
  },
  createRoutine: async (data: { name: string; notes?: string }) => {
    const res = await fetchWithAuth('/routines', { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
  },
  deleteRoutine: async (id: number | string) => {
    await fetchWithAuth(`/routines/${id}`, { method: 'DELETE' })
  },
  fetchRoutine: async (id: number | string) => {
    const res = await fetchWithAuth(`/custom/routines/${id}`)
    return res.routine || res
  },
  updateRoutine: async (id: number | string, data: Record<string, unknown>) => {
    const res = await fetchWithAuth(`/custom/routines/${id}/save`, { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
  },
  deleteWorkoutDay: async (id: number | string) => {
    await fetchWithAuth(`/workout-days/${id}`, { method: 'DELETE' })
  },
  updateUser: async (id: number | string, data: Record<string, unknown>) => {
    const res = await fetchWithAuth(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    return res.doc || res
  },
}
