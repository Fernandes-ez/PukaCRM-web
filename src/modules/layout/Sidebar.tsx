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
  Shuffle,
  Megaphone,
  ChevronDown,
  X,
  CalendarDays,
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
  /** Item condicionado a uma feature flag além de rota/permissão (ex: Agenda só existe se a empresa ligou). */
  featureFlag?: 'scheduling'
  permission?: { module: PermissionModule; resource: string; action: PermissionAction }
}

interface AdminLeafItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  permission: { module: PermissionModule; resource: string; action: PermissionAction }
}

/** Grupo expansível — sub-páginas de uma mesma seção administrativa (ex: WhatsApp: Conexão + Templates). */
interface AdminGroupItem {
  label: string
  icon: typeof LayoutDashboard
  children: AdminLeafItem[]
}

type AdminNavEntry = AdminLeafItem | AdminGroupItem

function isGroup(entry: AdminNavEntry): entry is AdminGroupItem {
  return 'children' in entry
}

const generalItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/conversations', label: 'Conversas', icon: MessageSquare },
  { to: '/leads', label: 'Leads', icon: Contact },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    featureFlag: 'scheduling',
    permission: { module: 'SCHEDULING', resource: 'appointment', action: 'VIEW' },
  },
]

const allAdminItems: AdminNavEntry[] = [
  { to: '/employees', label: 'Funcionários', icon: Users, permission: { module: 'EMPLOYEES', resource: 'employee', action: 'VIEW' } },
  { to: '/distribuicao', label: 'Distribuição', icon: Shuffle, permission: { module: 'EMPLOYEES', resource: 'employee', action: 'VIEW' } },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone, permission: { module: 'CAMPAIGNS', resource: 'campaign', action: 'VIEW' } },
  { to: '/roles', label: 'Cargos', icon: ShieldCheck, permission: { module: 'ROLES', resource: 'role', action: 'VIEW' } },
  { to: '/assistant', label: 'Assistente IA', icon: Bot, permission: { module: 'ASSISTANT', resource: 'assistant', action: 'VIEW' } },
  {
    label: 'WhatsApp',
    icon: Smartphone,
    children: [
      { to: '/whatsapp', label: 'Conexão', icon: Smartphone, end: true, permission: { module: 'WHATSAPP', resource: 'whatsapp_instance', action: 'VIEW' } },
      { to: '/whatsapp/templates', label: 'Templates', icon: FileText, permission: { module: 'WHATSAPP', resource: 'message_template', action: 'VIEW' } },
    ],
  },
  { to: '/empresa', label: 'Minha empresa', icon: Building2, permission: { module: 'COMPANY', resource: 'company', action: 'VIEW' } },
  { to: '/assinatura', label: 'Assinatura', icon: CreditCard, permission: { module: 'SUBSCRIPTION', resource: 'subscription', action: 'VIEW' } },
]

/** Achata grupos em sub-itens — usado pra checar permissão/rota atual sem duplicar a lógica de percurso. */
function flattenAdminItems(items: AdminNavEntry[]): AdminLeafItem[] {
  return items.flatMap((item) => (isGroup(item) ? item.children : [item]))
}

type SidebarTab = 'general' | 'admin'

function matchesPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

function isAdminPath(pathname: string) {
  return flattenAdminItems(allAdminItems).some((item) => matchesPath(pathname, item.to))
}

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const { hasPermission, employee } = useAuth()

  function canSee(item: AdminLeafItem) {
    return hasPermission(item.permission.module, item.permission.resource, item.permission.action)
  }

  const visibleGeneralItems = useMemo(
    () =>
      generalItems.filter((item) => {
        if (item.featureFlag === 'scheduling' && !employee?.company_scheduling_enabled) return false
        if (item.permission && !hasPermission(item.permission.module, item.permission.resource, item.permission.action)) return false
        return true
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission, employee?.company_scheduling_enabled],
  )

  const adminItems = useMemo(
    () =>
      allAdminItems.reduce<AdminNavEntry[]>((acc, item) => {
        if (isGroup(item)) {
          const children = item.children.filter(canSee)
          if (children.length > 0) acc.push({ ...item, children })
        } else if (canSee(item)) {
          acc.push(item)
        }
        return acc
      }, []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission],
  )
  const hasAdminAccess = adminItems.length > 0

  const [tab, setTab] = useState<SidebarTab>(isAdminPath(location.pathname) ? 'admin' : 'general')

  useEffect(() => {
    setTab(isAdminPath(location.pathname) ? 'admin' : 'general')
  }, [location.pathname])

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(adminItems.filter((item) => isGroup(item) && item.children.some((c) => matchesPath(location.pathname, c.to))).map((item) => item.label)),
  )

  useEffect(() => {
    for (const item of adminItems) {
      if (isGroup(item) && item.children.some((c) => matchesPath(location.pathname, c.to))) {
        setExpandedGroups((prev) => (prev.has(item.label) ? prev : new Set(prev).add(item.label)))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const items = tab === 'admin' && hasAdminAccess ? adminItems : visibleGeneralItems

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
          {items.map((item) => {
            if ('children' in item) {
              const expanded = expandedGroups.has(item.label)
              const groupActive = item.children.some((c) => matchesPath(location.pathname, c.to))
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={expanded}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md py-2 pl-4 pr-3 text-sm font-medium transition-all',
                      groupActive
                        ? 'text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/65 hover:bg-white/5 hover:text-sidebar-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', groupActive && 'text-sidebar-primary')} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', expanded && 'rotate-180')} />
                  </button>
                  {/* Truque de grid-template-rows 0fr→1fr: anima a altura de verdade (sem chutar
                      max-height) e some suave em vez de sumir seco com o if condicional de antes. */}
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200 ease-out',
                      expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={cn(
                          'ml-4 space-y-0.5 border-l border-sidebar-border pl-3 pt-0.5 transition-opacity duration-150',
                          expanded ? 'opacity-100 delay-75' : 'opacity-0',
                        )}
                      >
                        {item.children.map(({ to, label, icon: ChildIcon, end }) => (
                          <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2.5 rounded-md py-1.5 pl-3 pr-3 text-sm font-medium transition-all',
                                isActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_0_1px_var(--sidebar-border)]'
                                  : 'text-sidebar-foreground/65 hover:bg-white/5 hover:text-sidebar-foreground',
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <ChildIcon className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-sidebar-primary')} />
                                {label}
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            const { to, label, icon: Icon, end } = item
            return (
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
            )
          })}
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
