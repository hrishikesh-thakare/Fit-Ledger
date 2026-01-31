import React from 'react'
import { ThemeProvider } from '../../theme'
import './styles.css'

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

  return (
    <html lang="en">
      <body className={`${roboto.variable} ${robotoMono.variable}`}>
        <ThemeProvider>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
