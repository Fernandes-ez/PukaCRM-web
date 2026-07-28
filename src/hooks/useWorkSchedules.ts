import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workScheduleService } from '@/services/workScheduleService'
import type { WorkScheduleCreateRequest, WorkScheduleUpdateRequest } from '@/types/workSchedule'

function keyFor(employeeId: string) {
  return ['work-schedules', employeeId] as const
}

export function useWorkSchedules(employeeId: string | undefined) {
  return useQuery({
    queryKey: keyFor(employeeId ?? ''),
    queryFn: () => workScheduleService.list(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useCreateWorkSchedule(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkScheduleCreateRequest) => workScheduleService.create(employeeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(employeeId) }),
  })
}

export function useUpdateWorkSchedule(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WorkScheduleUpdateRequest }) =>
      workScheduleService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(employeeId) }),
  })
}

export function useDeleteWorkSchedule(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workScheduleService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(employeeId) }),
  })
}
