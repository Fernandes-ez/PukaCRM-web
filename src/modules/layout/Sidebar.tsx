import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bot,
  MessageSquare,
  Contact,
  Smartphone,
  ShieldHalf,
  Building2,
  CreditCard,
  Kanban,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { LogoMark } from '@/components/brand/LogoMark'
import { useAuth } from '@/contexts/AuthContext'
import type { PermissionAction, PermissionModule } from '@/types/role'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

interface AdminNavItem extends NavItem {
  permission: { module: PermissionModule; resource: string; action: PermissionAction }
}

const generalItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/conversations', label: 'Conversas', icon: MessageSquare },
  { to: '/leads', label: 'Leads', icon: Contact },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
]

const allAdminItems: AdminNavItem[] = [
  { to: '/employees', label: 'Funcionários', icon: Users, permission: { module: 'EMPLOYEES', resource: 'employee', action: 'VIEW' } },
  { to: '/roles', label: 'Cargos', icon: ShieldCheck, permission: { module: 'ROLES', resource: 'role', action: 'VIEW' } },
  { to: '/assistant', label: 'Assistente IA', icon: Bot, permission: { module: 'ASSISTANT', resource: 'assistant', action: 'VIEW' } },
  { to: '/whatsapp', label: 'WhatsApp', icon: Smartphone, permission: { module: 'WHATSAPP', resource: 'whatsapp_instance', action: 'VIEW' } },
  { to: '/whatsapp/templates', label: 'Templates', icon: FileText, permission: { module: 'WHATSAPP', resource: 'message_template', action: 'VIEW' } },
  { to: '/empresa', label: 'Minha empresa', icon: Building2, permission: { module: 'COMPANY', resource: 'company', action: 'VIEW' } },
  { to: '/assinatura', label: 'Assinatura', icon: CreditCard, permission: { module: 'SUBSCRIPTION', resource: 'subscription', action: 'VIEW' } },
]

type SidebarTab = 'general' | 'admin'

function isAdminPath(pathname: string) {
  return allAdminItems.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const { hasPermission } = useAuth()

  const adminItems = useMemo(
    () => allAdminItems.filter((item) => hasPermission(item.permission.module, item.permission.resource, item.permission.action)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission],
  )
  const hasAdminAccess = adminItems.length > 0

  const [tab, setTab] = useState<SidebarTab>(isAdminPath(location.pathname) ? 'admin' : 'general')

  useEffect(() => {
    setTab(isAdminPath(location.pathname) ? 'admin' : 'general')
  }, [location.pathname])

  const items = tab === 'admin' && hasAdminAccess ? adminItems : generalItems

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
          'shadow-[inset_-1px_0_0_var(--sidebar-border)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="text-[15px] font-semibold tracking-tight">Puka CRM</span>
          </div>
          <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground lg:hidden" onClick={onCloseMobile} aria-label="Fechar menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="divider-stripes opacity-60" />

        {hasAdminAccess && (
          <div className="grid grid-cols-2 gap-1 p-3 pb-0">
            <button
              type="button"
              onClick={() => setTab('general')}
              className={cn(
                'btn-cut-sm px-3 py-1.5 text-xs font-medium transition-colors',
                tab === 'general'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/55 hover:bg-white/5 hover:text-sidebar-foreground',
              )}
            >
              Geral
            </button>
            <button
              type="button"
              onClick={() => setTab('admin')}
              className={cn(
                'btn-cut-sm flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                tab === 'admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/55 hover:bg-white/5 hover:text-sidebar-foreground',
              )}
            >
              <ShieldHalf className="h-3.5 w-3.5" />
              Administrativo
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-md py-2 pl-4 pr-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_0_1px_var(--sidebar-border)]'
                    : 'text-sidebar-foreground/65 hover:bg-white/5 hover:text-sidebar-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 transition-opacity',
                      isActive ? 'bg-sidebar-primary opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-sidebar-primary')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <div className="btn-cut-sm bg-white/5 px-3 py-2.5 text-xs text-sidebar-foreground/60">
            Atendimento com IA para pequenas e médias empresas
          </div>
        </div>
      </aside>
    </>
  )
}
