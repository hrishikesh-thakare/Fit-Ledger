'use client'

import { useEffect, useState } from 'react'
import { Chip, Snackbar, Alert } from '@mui/material'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import SyncIcon from '@mui/icons-material/Sync'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { syncManager } from '@/lib/offline/sync-manager'

export default function SyncStatusIndicator() {
  const { isOnline } = useOnlineStatus()
  const [mounted, setMounted] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showBackOnline, setShowBackOnline] = useState(false)

  // Wait for hydration before rendering anything that depends on navigator
  useEffect(() => setMounted(true), [])

  // Sync when coming back online
  useEffect(() => {
    async function handleBackOnline() {
      setShowBackOnline(true)
      setSyncing(true)
      const result = await syncManager.processQueue()
      console.log(`[Sync] Synced: ${result.synced}, Failed: ${result.failed}`)
      setSyncing(false)
      setPendingCount(await syncManager.getPendingCount())
    }

    window.addEventListener('fitledger:back-online', handleBackOnline)
    return () => window.removeEventListener('fitledger:back-online', handleBackOnline)
  }, [])

  // Also try to flush queue on mount (app reload while online)
  useEffect(() => {
    if (!isOnline) return
    let active = true

    ;(async () => {
      const count = await syncManager.getPendingCount()
      if (count > 0 && active) {
        setSyncing(true)
        await syncManager.processQueue()
        setSyncing(false)
      }
      if (active) setPendingCount(await syncManager.getPendingCount())
    })()

    return () => {
      active = false
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll pending count every 10 s
  useEffect(() => {
    const id = setInterval(async () => {
      setPendingCount(await syncManager.getPendingCount())
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  // Render nothing on the server / before hydration to avoid mismatch
  if (!mounted) return null

  return (
    <>
      {/* Offline chip */}
      {!isOnline && (
        <Chip
          icon={<CloudOffIcon />}
          label={pendingCount > 0 ? `Offline · ${pendingCount} pending` : 'Offline'}
          color="warning"
          size="small"
          variant="outlined"
        />
      )}

      {/* Online — idle */}
      {isOnline && !syncing && (
        <Chip
          icon={<CloudDoneIcon />}
          label="Online"
          color="success"
          size="small"
          variant="outlined"
        />
      )}

      {/* Syncing chip */}
      {isOnline && syncing && (
        <Chip
          icon={
            <SyncIcon
              sx={{
                '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                animation: 'spin 1s linear infinite',
              }}
            />
          }
          label="Syncing…"
          color="info"
          size="small"
          variant="outlined"
        />
      )}

      {/* Toast when coming back online */}
      <Snackbar
        open={showBackOnline}
        autoHideDuration={4000}
        onClose={() => setShowBackOnline(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Back online — syncing your changes…
        </Alert>
      </Snackbar>
    </>
  )
}
