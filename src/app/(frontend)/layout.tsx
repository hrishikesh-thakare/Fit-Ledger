import React from 'react'
import { ThemeProvider } from '../../theme'
import { AuthProvider } from '../../contexts/AuthContext'
import { SnackbarProvider } from '../../contexts/SnackbarContext'
import { BackgroundSyncProvider } from '../../contexts/BackgroundSyncContext'
import { WorkoutSessionProvider } from '../../contexts/WorkoutSessionContext'
import FloatingWorkoutBar from '../../components/FloatingWorkoutBar'
import './styles.css'
import { getCurrentUser } from '@/lib/getCurrentUser'

export const metadata = {
  description: 'Track your fitness journey with FitLedger',
  title: 'FitLedger - Workout Tracker',
}

import { Roboto, Roboto_Mono } from 'next/font/google'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const user = await getCurrentUser()

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${roboto.variable} ${robotoMono.variable}`}>
        <ThemeProvider>
          <AuthProvider initialUser={user}>
            <SnackbarProvider>
              <BackgroundSyncProvider>
                <WorkoutSessionProvider>
                  <main>{children}</main>
                  <FloatingWorkoutBar />
                </WorkoutSessionProvider>
              </BackgroundSyncProvider>
            </SnackbarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
