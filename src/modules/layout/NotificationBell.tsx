import {
  Bell,
  CheckCheck,
  UserPlus,
  MessageCircleWarning,
  MessageSquareText,
  ClipboardList,
  ClipboardX,
  BadgeCheck,
  BadgeX,
  Megaphone,
  MegaphoneOff,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/date'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '@/hooks/useNotifications'
import type { Notification } from '@/types/notification'

const NOTIFICATION_ICON: Record<Notification['type'], typeof UserPlus> = {
  LEAD_ASSIGNED: UserPlus,
  CONVERSATION_NEEDS_ATTENTION: MessageCircleWarning,
  TASK_ASSIGNED: ClipboardList,
  TASK_DUE: ClipboardX,
  NEW_MESSAGE: MessageSquareText,
  TEMPLATE_APPROVED: BadgeCheck,
  TEMPLATE_REJECTED: BadgeX,
  CAMPAIGN_COMPLETED: Megaphone,
  CAMPAIGN_CANCELED: MegaphoneOff,
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const count = unreadCount?.unread_count ?? 0

  function handleSelect(notification: Notification) {
    if (!notification.read_at) markRead.mutate(notification.id)
    if (notification.related_conversation_id) {
      navigate(`/conversations/${notification.related_conversation_id}`)
    } else if (notification.related_task_id) {
      navigate('/pipeline')
    } else if (notification.related_campaign_id) {
      navigate(`/campanhas/${notification.related_campaign_id}`)
    } else if (notification.related_lead_id) {
      navigate('/leads')
    } else if (notification.type === 'TEMPLATE_APPROVED' || notification.type === 'TEMPLATE_REJECTED') {
      navigate('/whatsapp/templates')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notificações</DropdownMenuLabel>
          {count > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}

          {!isLoading && (!notifications || notifications.length === 0) && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          )}

          {notifications?.map((notification) => {
            const Icon = NOTIFICATION_ICON[notification.type]
            const unread = !notification.read_at
            return (
              <button
                key={notification.id}
                onClick={() => handleSelect(notification)}
                className={cn(
                  'flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-accent',
                  unread && 'bg-brand-50 dark:bg-brand-950/30',
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', unread ? 'text-brand-600' : 'text-muted-foreground')} />
                <span className="flex-1">
                  <span className={cn('block', unread && 'font-medium')}>{notification.message}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
                {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
