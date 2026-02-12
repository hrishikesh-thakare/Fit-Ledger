import { headers } from 'next/headers'

export async function ServerPageLogger({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || 'unknown'

  const id = Math.random().toString(36).slice(2, 9)
  const label = `[Server Page] ${pathname} (${id})`

  if (process.env.NODE_ENV === 'development') {
    console.time(label)
  }

  return (
    <>
      {children}
      <LogEnd label={label} />
    </>
  )
}

async function LogEnd({ label }: { label: string }) {
  if (process.env.NODE_ENV === 'development') {
    console.timeEnd(label)
  }
  return null
}
