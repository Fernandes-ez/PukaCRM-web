import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/authService'
import type { ChangePasswordRequest, EmployeeMeUpdateRequest } from '@/types/auth'

/** Mesma chave usada pelo AuthContext pra `GET /employees/me` - atualizar aqui reflete em todo o app na hora. */
const meKey = ['auth', 'me'] as const

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeMeUpdateRequest) => authService.updateMe(payload),
    onSuccess: (employee) => queryClient.setQueryData(meKey, employee),
  })
}

export function useChangeMyPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authService.changePassword(payload),
    onSuccess: (employee) => queryClient.setQueryData(meKey, employee),
  })
}
