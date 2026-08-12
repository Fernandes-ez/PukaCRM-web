import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  ShieldAlert,
  Building2,
  Users,
  ShieldCheck,
  Smartphone,
  Bot,
  Contact,
  MessageSquare,
  GitBranch,
  CheckSquare,
  BarChart3,
  Plug,
  Settings,
  CreditCard,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import { usePermissionsCatalog, useRolePermissions, useSetRolePermissions } from '@/hooks/useRoles'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { PERMISSION_MODULE_LABEL, type Permission, type PermissionModule, type Role } from '@/types/role'
import { displayRoleName } from '@/utils/roleDisplay'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface RolePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

const isOwnerRole = (role: Role) => role.is_system && role.name.toLowerCase().includes('owner')

const MODULE_ICON: Record<PermissionModule, LucideIcon> = {
  COMPANY: Building2,
  EMPLOYEES: Users,
  ROLES: ShieldCheck,
  WHATSAPP: Smartphone,
  ASSISTANT: Bot,
  LEADS: Contact,
  CONVERSATIONS: MessageSquare,
  PIPELINE: GitBranch,
  TASKS: CheckSquare,
  REPORTS: BarChart3,
  INTEGRATIONS: Plug,
  SETTINGS: Settings,
  SUBSCRIPTION: CreditCard,
  CAMPAIGNS: Megaphone,
}

interface ModuleGroup {
  module: PermissionModule
  moduleOrder: number
  permissions: Permission[]
}

export function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
  const { data: catalog, isLoading: isLoadingCatalog } = usePermissionsCatalog()
  const { data: current, isLoading: isLoadingCurrent, isError, error } = useRolePermissions(role.id)
  const setPermissions = useSetRolePermissions()
  const { toast } = useToast()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const readOnly = isOwnerRole(role)

  useEffect(() => {
    if (current) setSelected(new Set(current.permission_ids))
  }, [current])

  const groups = useMemo<ModuleGroup[]>(() => {
    const byModule = new Map<PermissionModule, ModuleGroup>()
    for (const permission of catalog ?? []) {
      const group = byModule.get(permission.module) ?? {
        module: permission.module,
        moduleOrder: permission.module_order,
        permissions: [],
      }
      group.permissions.push(permission)
      byModule.set(permission.module, group)
    }
    for (const group of byModule.values()) {
      group.permissions.sort((a, b) => a.display_order - b.display_order)
    }
    return Array.from(byModule.values()).sort((a, b) => a.moduleOrder - b.moduleOrder)
  }, [catalog])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleModule(group: ModuleGroup, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const permission of group.permissions) {
        if (checked) next.add(permission.id)
        else next.delete(permission.id)
      }
      return next
    })
  }

  async function handleSave() {
    try {
      await setPermissions.mutateAsync({ roleId: role.id, payload: { permission_ids: Array.from(selected) } })
      toast({ title: 'Permissões atualizadas', variant: 'success' })
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof ApiError ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const forbidden = isError && error instanceof ApiError && error.status === 403

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões — {displayRoleName(role.name)}</DialogTitle>
          <DialogDescription>Escolha o que este cargo pode ver e fazer em cada área da plataforma</DialogDescription>
        </DialogHeader>

        {readOnly && (
          <Alert variant="warning">
            <ShieldAlert />
            <AlertTitle>Permissões do Dono são imutáveis</AlertTitle>
            <AlertDescription>O cargo Dono sempre tem acesso total e não pode ser alterado.</AlertDescription>
          </Alert>
        )}

        {forbidden && (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>Você não tem permissão para ver isso</AlertTitle>
            <AlertDescription>
              Consultar permissões de um cargo exige a permissão de visualizar Cargos. Peça pra alguém com esse
              acesso (ex: Dono) fazer essa alteração.
            </AlertDescription>
          </Alert>
        )}

        {!forbidden && isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof ApiError ? error.message : 'Não foi possível carregar as permissões.'}
            </AlertDescription>
          </Alert>
        )}

        {(isLoadingCatalog || isLoadingCurrent) && !isError ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          !forbidden &&
          !isError && (
            <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
              {groups.map((group) => {
                const Icon = MODULE_ICON[group.module]
                const allChecked = group.permissions.every((p) => selected.has(p.id))
                const someChecked = !allChecked && group.permissions.some((p) => selected.has(p.id))
                return (
                  <div key={group.module} className="rounded-lg border">
                    <label className="flex items-center gap-2.5 border-b bg-muted/40 px-3 py-2">
                      <Checkbox
                        checked={someChecked ? 'indeterminate' : allChecked}
                        onCheckedChange={(checked) => toggleModule(group, checked === true)}
                        disabled={readOnly}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{PERMISSION_MODULE_LABEL[group.module]}</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent/50"
                        >
                          <Checkbox
                            checked={selected.has(permission.id)}
                            onCheckedChange={() => toggle(permission.id)}
                            disabled={readOnly}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block font-medium">{permission.name}</span>
                            {permission.description && (
                              <span className="text-xs text-muted-foreground">{permission.description}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!readOnly && !forbidden && !isError && (
            <Button type="button" onClick={handleSave} disabled={setPermissions.isPending}>
              {setPermissions.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar permissões
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
