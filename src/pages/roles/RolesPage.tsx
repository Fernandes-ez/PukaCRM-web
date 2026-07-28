import { useState } from 'react'
import { MoreHorizontal, Plus, Pencil, Trash2, KeyRound, Lock } from 'lucide-react'
import { useRoles, useDeleteRole } from '@/hooks/useRoles'
import { ApiError } from '@/services/apiClient'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Role } from '@/types/role'
import { displayRoleName } from '@/utils/roleDisplay'
import { CreateRoleDialog } from '@/pages/roles/CreateRoleDialog'
import { EditRoleDialog } from '@/pages/roles/EditRoleDialog'
import { RolePermissionsDialog } from '@/pages/roles/RolePermissionsDialog'

export function RolesPage() {
  const { data: roles, isLoading } = useRoles()
  const deleteRole = useDeleteRole()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null)

  async function handleDelete(role: Role) {
    if (!window.confirm(`Excluir o cargo "${role.name}"? Essa ação não pode ser desfeita.`)) return
    try {
      await deleteRole.mutateAsync(role.id)
      toast({ title: 'Cargo excluído', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Não foi possível excluir',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cargos</h1>
          <p className="text-sm text-muted-foreground">Defina cargos e as permissões de cada um</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo cargo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os cargos</CardTitle>
          <CardDescription>{roles?.length ?? 0} no total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{displayRoleName(role.name)}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description || '—'}</TableCell>
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="secondary">
                          <Lock className="mr-1 h-3 w-3" />
                          Sistema
                        </Badge>
                      ) : (
                        <Badge variant="outline">Personalizado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPermissionsRole(role)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Permissões
                          </DropdownMenuItem>
                          {!role.is_system && (
                            <>
                              <DropdownMenuItem onClick={() => setEditRole(role)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(role)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {roles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum cargo cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editRole && (
        <EditRoleDialog role={editRole} open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)} />
      )}
      {permissionsRole && (
        <RolePermissionsDialog
          role={permissionsRole}
          open={!!permissionsRole}
          onOpenChange={(open) => !open && setPermissionsRole(null)}
        />
      )}
    </div>
  )
}
