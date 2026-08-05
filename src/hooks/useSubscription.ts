import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionService } from '@/services/subscriptionService'
import type { SubscriptionPlanChangeRequest } from '@/types/subscription'

export const subscriptionKey = ['subscription'] as const

export function useSubscription() {
  return useQuery({ queryKey: subscriptionKey, queryFn: subscriptionService.get })
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubscriptionPlanChangeRequest) => subscriptionService.changePlan(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKey }),
  })
}

export const chargesKey = ['subscription', 'charges'] as const

export function useCharges() {
  return useQuery({ queryKey: chargesKey, queryFn: subscriptionService.listCharges })
}
