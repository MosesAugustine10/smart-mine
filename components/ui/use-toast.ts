// Minimal hook to satisfy imports without complex context
export function useToast() {
  return {
    toast: (props: any) => {
      console.log("Toast:", props)
    }
  }
}
