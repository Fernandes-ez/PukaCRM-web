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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey })
      // scheduling_enabled é espelhado em EmployeeMe.company_scheduling_enabled
      // (['auth','me'], AuthContext) pra a Sidebar decidir se mostra "Agenda"
      // sem precisar de GET /company - sem invalidar aqui também, o toggle só
      // refletia depois de um refresh manual da página.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useCloseAccount() {
  return useMutation({
    mutationFn: () => companyService.closeAccount(),
  })
}
