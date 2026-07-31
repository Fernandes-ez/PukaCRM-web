import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { companyService } from '@/services/companyService'
import type { CompanyUpdateRequest } from '@/types/company'

export const companyKey = ['company'] as const

export function useCompany() {
  return useQuery({ queryKey: companyKey, queryFn: companyService.get })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompanyUpdateRequest) => companyService.update(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKey }),
  })
}

export function useCloseAccount() {
  return useMutation({
    mutationFn: () => companyService.closeAccount(),
  })
}
