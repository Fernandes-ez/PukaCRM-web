import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionService } from '@/services/subscriptionService'
import type { SubscriptionPlan, SubscriptionPlanChangeRequest } from '@/types/subscription'

export const subscriptionKey = ['subscription'] as const

export function useSubscription() {
  return useQuery({ queryKey: subscriptionKey, queryFn: subscriptionService.get })
}

/**
 * Versão enxuta pro banner/popup de cobrança - qualquer funcionário
 * logado pode chamar (sem exigir SUBSCRIPTION/subscription/VIEW). Busca
 * uma vez por carregamento do app, sem polling agressivo (é informação
 * que muda devagar).
 */
export const subscriptionStatusKey = ['subscription', 'status'] as const

export function useSubscriptionStatus() {
  return useQuery({ queryKey: subscriptionStatusKey, queryFn: subscriptionService.getStatus })
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubscriptionPlanChangeRequest) => subscriptionService.changePlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKey })
      queryClient.invalidateQueries({ queryKey: chargesKey })
    },
  })
}

export const chargesKey = ['subscription', 'charges'] as const

export function useCharges() {
  return useQuery({ queryKey: chargesKey, queryFn: subscriptionService.listCharges })
}

/** Preços vigentes dos 3 planos - fonte única de verdade pra tela de Assinatura, sem hardcode duplicado no frontend. */
export const subscriptionPlansKey = ['subscription', 'plans'] as const

export function useSubscriptionPlans() {
  return useQuery({ queryKey: subscriptionPlansKey, queryFn: subscriptionService.listPlans })
}

/** Prévia sem aplicar nada - busca sob demanda ao abrir o diálogo de confirmação de troca, não em background. */
export function usePreviewPlanChange() {
  return useMutation({ mutationFn: (plan: SubscriptionPlan) => subscriptionService.previewPlanChange(plan) })
}
