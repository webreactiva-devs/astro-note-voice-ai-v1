// Lazy load toast to reduce initial bundle size
const getToast = async () => {
  const { default: toast } = await import('react-hot-toast');
  return toast;
};

export const useToast = () => {
  const success = async (message: string) => {
    const toast = await getToast();
    toast.success(message, {
      duration: 4000,
      position: 'bottom-right',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    })
  }

  const error = async (message: string) => {
    const toast = await getToast();
    toast.error(message, {
      duration: 5000,
      position: 'bottom-right',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    })
  }

  const loading = async (message: string) => {
    const toast = await getToast();
    return toast.loading(message, {
      position: 'bottom-right',
    })
  }

  const dismiss = async (toastId: string) => {
    const toast = await getToast();
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    loading,
    dismiss,
  }
}