import { api, normalizeApiError } from '@/services/apiClient'
import type {
  Permission,
  Role,
  RoleCreateRequest,
  RolePermissionsResponse,
  RoleUpdateRequest,
  UpdateRolePermissionsRequest,
} from '@/types/role'

export const roleService = {
  async list(): Promise<Role[]> {
    try {
      const { data } = await api.get<Role[]>('/roles')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async get(id: string): Promise<Role> {
    try {
      const { data } = await api.get<Role>(`/roles/${id}`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async create(payload: RoleCreateRequest): Promise<Role> {
    try {
      const { data } = await api.post<Role>('/roles', payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Cargo de sistema (is_system) não pode ser renomeado — o backend rejeita. */
  async update(id: string, payload: RoleUpdateRequest): Promise<Role> {
    try {
      const { data } = await api.patch<Role>(`/roles/${id}`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Cargo de sistema (is_system) não pode ser excluído — o backend rejeita. */
  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/roles/${id}`)
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Exige a permissão ROLES/role/VIEW — ver bloqueio conhecido no CLAUDE.md. */
  async getPermissions(roleId: string): Promise<RolePermissionsResponse> {
    try {
      const { data } = await api.get<RolePermissionsResponse>(`/roles/${roleId}/permissions`)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  /** Substitui o conjunto inteiro de permissões do cargo. Permissões do Owner são imutáveis. */
  async setPermissions(roleId: string, payload: UpdateRolePermissionsRequest): Promise<RolePermissionsResponse> {
    try {
      const { data } = await api.put<RolePermissionsResponse>(`/roles/${roleId}/permissions`, payload)
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}

export const permissionService = {
  /** Catálogo completo (47 permissões) — não é "minhas permissões". */
  async list(): Promise<Permission[]> {
    try {
      const { data } = await api.get<Permission[]>('/permissions')
      return data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },
}
