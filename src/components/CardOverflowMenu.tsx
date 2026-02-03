'use client'

import React, { useState } from 'react'
import {
  IconButton,
  SwipeableDrawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material'
import { MoreVert, Edit, ContentCopy, Share, Delete } from '@mui/icons-material'
import DrawerHandle from '@/components/ui/DrawerHandle'

export interface MenuAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: 'inherit' | 'error'
  dividerAfter?: boolean
}

interface CardOverflowMenuProps {
  actions: MenuAction[]
  iconSize?: 'small' | 'medium'
  title?: string // Added title prop
}

/**
 * Material Design overflow menu (three-dot menu) for cards
 * Uses a Swipeable Bottom Drawer for better mobile UX
 */
export default function CardOverflowMenu({
  actions,
  iconSize = 'small',
  title,
}: CardOverflowMenuProps) {
  const [open, setOpen] = useState(false)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setOpen(true)
  }

  const handleAction = (action: MenuAction, event: React.MouseEvent) => {
    event.stopPropagation()
    action.onClick()
    setOpen(false)
  }

  return (
    <>
      <IconButton
        size={iconSize}
        onClick={handleClick}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <MoreVert fontSize={iconSize} />
      </IconButton>

      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableSwipeToOpen={true}
        allowSwipeInChildren={true}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            bgcolor: 'surfaceContainer', // Drawer bg
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            width: '100%',
            color: 'text.primary',
            pb: 4, // More padding at bottom
          }}
          role="presentation"
        >
          {/* Drag Handle */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              pt: 2,
              pb: 1,
            }}
          >
            <DrawerHandle />
          </Box>

          {/* Title */}
          {title && (
            <Typography
              variant="subtitle1"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                mb: 2,
                px: 2,
              }}
            >
              {title}
            </Typography>
          )}

          {/* Actions List Group */}
          <Box sx={{ px: 2 }}>
            <List
              disablePadding
              sx={{
                bgcolor: 'background.paper', // Match app card background
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {actions.map((action, index) => (
                <React.Fragment key={action.label}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={(e) => handleAction(action, e)}
                      sx={{
                        py: 2,
                        px: 3,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: action.color === 'error' ? 'error.main' : 'text.secondary',
                          minWidth: 40,
                        }}
                      >
                        {action.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={action.label}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          color: action.color === 'error' ? 'error.main' : 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < actions.length - 1 && (
                    <Divider
                      component="li"
                      sx={{
                        borderColor: 'divider',
                        opacity: 0.5,
                        mx: 2, // Inset divider
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  )
}

// Pre-built common actions for convenience
export const commonActions = {
  edit: (onClick: () => void): MenuAction => ({
    label: 'Edit',
    icon: <Edit fontSize="small" />,
    onClick,
  }),
  duplicate: (onClick: () => void): MenuAction => ({
    label: 'Duplicate',
    icon: <ContentCopy fontSize="small" />,
    onClick,
  }),
  share: (onClick: () => void): MenuAction => ({
    label: 'Share',
    icon: <Share fontSize="small" />,
    onClick,
    dividerAfter: true, // Though we are handling dividers manually now
  }),
  delete: (onClick: () => void): MenuAction => ({
    label: 'Delete Routine', // More explicit label as per Hevy
    icon: <Delete fontSize="small" />,
    onClick,
    color: 'error',
  }),
}
