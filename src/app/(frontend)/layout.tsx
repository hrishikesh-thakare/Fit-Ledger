import React from 'react'
import { ThemeProvider } from '../../theme'
import './styles.css'

export const metadata = {
  description: 'Track your fitness journey with FitLedger',
  title: 'FitLedger - Workout Tracker',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
