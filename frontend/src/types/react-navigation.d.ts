declare module '@react-navigation/native' {
  import { ComponentType } from 'react'
  export const NavigationContainer: ComponentType<any>
  export function useNavigation<T = any>(): T
  export default any
}

declare module '@react-navigation/bottom-tabs' {
  import { ComponentType } from 'react'
  export function createBottomTabNavigator(): any
  export default any
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator(): any
  export default any
}
