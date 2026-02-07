'use client'

import React, { ReactNode } from 'react'
import { Container } from '@mui/material'

interface PageContainerProps {
  children: ReactNode
  pt?: number
  px?: number
}

export default function PageContainer({ children, pt = 3, px = 2 }: PageContainerProps) {
  return (
    <Container maxWidth="sm" disableGutters sx={{ px, pt }}>
      {children}
    </Container>
  )
}
