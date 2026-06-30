import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'AUTH_TOKEN'

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export async function loginWithToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } catch (e) {
    console.error('Failed to save token', e)
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch (e) {
    console.error('Failed to remove token', e)
  }
}
