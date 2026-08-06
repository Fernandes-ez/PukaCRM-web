import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL, getStoredToken } from '@/services/apiClient'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import type { Notification } from '@/types/notification'

export const notificationsKey = ['notifications'] as const
export const unreadCountKey = ['notifications', 'unread-count'] as const

export function useNotifications() {
  const { isAuthenticated } = useAuth()
  return useQuery({ queryKey: notificationsKey, queryFn: notificationService.list, enabled: isAuthenticated })
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: unreadCountKey,
    queryFn: notificationService.unreadCount,
    enabled: isAuthenticated,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey })
      queryClient.invalidateQueries({ queryKey: unreadCountKey })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey })
      queryClient.invalidateQueries({ queryKey: unreadCountKey })
    },
  })
}

const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 30000]

/**
 * Mantém uma conexão WebSocket com `/ws/notifications` aberta enquanto o
 * funcionário estiver logado, e injeta cada notificação recebida direto no
 * cache do react-query (mesmas chaves de `useNotifications`/`useUnreadCount`)
 * - não existe um "estado de notificações" separado, o cache é a fonte da
 * verdade. Monte uma única vez (ver `AppLayout`), nunca dentro do próprio
 * sino, senão cada abertura/fechamento do dropdown reconectaria o socket.
 */
export function useNotificationSocket() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const attemptRef = useRef(0)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    function connect() {
      const token = getStoredToken()
      if (!token || cancelled) return

      const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws/notifications?token=${encodeURIComponent(token)}`
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        attemptRef.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification
          queryClient.setQueryData<Notification[]>(notificationsKey, (prev) =>
            prev ? [notification, ...prev] : [notification],
          )
          queryClient.setQueryData<{ unread_count: number }>(unreadCountKey, (prev) => ({
            unread_count: (prev?.unread_count ?? 0) + 1,
          }))
          toast({ title: 'Nova notificação', description: notification.message })
        } catch {
          // Payload inesperado - ignora em vez de quebrar a conexão.
        }
      }

      socket.onclose = () => {
        if (cancelled) return
        const delay = RECONNECT_DELAYS_MS[Math.min(attemptRef.current, RECONNECT_DELAYS_MS.length - 1)]
        attemptRef.current += 1
        reconnectTimer = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [isAuthenticated, queryClient, toast])
}
