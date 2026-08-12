import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employeeService'
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '@/types/employee'

export const employeesKey = ['employees'] as const

export function useEmployees() {
  return useQuery({ queryKey: employeesKey, queryFn: employeeService.list })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: [...employeesKey, id],
    queryFn: () => employeeService.get(id as string),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeCreateRequest) => employeeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKey }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EmployeeUpdateRequest }) =>
      employeeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKey }),
  })
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeeService.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKey }),
  })
}

export function useResetEmployeePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeeService.resetPassword(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKey }),
  })
}
