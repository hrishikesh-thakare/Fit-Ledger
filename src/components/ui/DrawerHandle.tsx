import React from 'react'
import { Box } from '@mui/material'

const DrawerHandle = () => {
  return (
    <Box
      sx={{
        width: 40,
        height: 4,
        bgcolor: 'grey.300',
        borderRadius: 2,
        mx: 'auto',
        mt: 1.5,
        mb: 1,
      }}
    />
  )
}

export default DrawerHandle
