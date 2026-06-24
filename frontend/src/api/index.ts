import { getToken } from '../auth'

const API_URL = 'http://192.168.0.111:3000/api' // Host LAN IP for physical device

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
    let message = 'An error occurred'
    try {
      const err = await response.json()
      message = err?.message || message
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
  fetchHistory: async () => {
    const res = await fetchWithAuth('/workout-days')
    return res.docs || res || []
  },
  loadWorkout: async (routineId: string | number) => {
    return fetchWithAuth(`/custom/workouts/load?routineId=${routineId}`)
  },
  saveWorkout: async (data: any) => {
    return fetchWithAuth('/custom/workouts/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  startWorkout: async (data: any) => {
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
  createExercise: async (data: { name: string; muscleGroup: string; isBodyweight?: boolean }) => {
    const res = await fetchWithAuth('/exercises', { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
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
  updateRoutine: async (id: number | string, data: any) => {
    const res = await fetchWithAuth(`/custom/routines/${id}/save`, { method: 'POST', body: JSON.stringify(data) })
    return res.doc || res
  },
  deleteWorkoutDay: async (id: number | string) => {
    await fetchWithAuth(`/workout-days/${id}`, { method: 'DELETE' })
  },
  updateUser: async (id: number | string, data: any) => {
    const res = await fetchWithAuth(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    return res.doc || res
  },
}
