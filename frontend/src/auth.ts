import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'AUTH_TOKEN'

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export async function loginWithToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } catch (e) {
    console.error('Failed to save token', e)
  }
}

export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY)
  } catch (e) {
    console.error('Failed to remove token', e)
  }
}
