import toast from 'react-hot-toast'

export const useToast = () => {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'bottom-right',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    })
  }

  const error = (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'bottom-right',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    })
  }

  const loading = (message: string) => {
    return toast.loading(message, {
      position: 'bottom-right',
    })
  }

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    loading,
    dismiss,
  }
}