import { lazy, Suspense } from 'react'

const HotToaster = lazy(() => 
  import('react-hot-toast').then(module => ({ default: module.Toaster }))
)

export function Toaster() {
  return (
    <Suspense fallback={null}>
      <HotToaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Suspense>
  )
}