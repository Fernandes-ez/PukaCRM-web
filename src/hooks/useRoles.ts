import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { permissionService, roleService } from '@/services/roleService'
import type { RoleCreateRequest, RoleUpdateRequest, UpdateRolePermissionsRequest } from '@/types/role'

export const rolesKey = ['roles'] as const
export const permissionsKey = ['permissions'] as const

export function useRoles() {
  return useQuery({ queryKey: rolesKey, queryFn: roleService.list })
}

export function usePermissionsCatalog() {
  return useQuery({ queryKey: permissionsKey, queryFn: permissionService.list })
}

export function useRolePermissions(roleId: string | undefined) {
  return useQuery({
    queryKey: [...rolesKey, roleId, 'permissions'],
    queryFn: () => roleService.getPermissions(roleId as string),
    enabled: !!roleId,
    retry: false,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RoleCreateRequest) => roleService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey }),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleUpdateRequest }) => roleService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey }),
  })
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRolePermissionsRequest }) =>
      roleService.setPermissions(roleId, payload),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [...rolesKey, variables.roleId, 'permissions'] }),
  })
}
