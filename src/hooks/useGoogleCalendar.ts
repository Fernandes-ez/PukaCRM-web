import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { googleCalendarService } from '@/services/googleCalendarService'

export const googleCalendarStatusKey = ['google-calendar', 'status'] as const

export function useGoogleCalendarStatus() {
  return useQuery({ queryKey: googleCalendarStatusKey, queryFn: googleCalendarService.getStatus })
}

/** Não redireciona sozinho - devolve a authorize_url pra quem chamou navegar o browser (window.location.href). */
export function useConnectGoogleCalendar() {
  return useMutation({ mutationFn: googleCalendarService.getConnectUrl })
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: googleCalendarService.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: googleCalendarStatusKey }),
  })
}
