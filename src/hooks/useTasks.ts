import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taskService } from '@/services/taskService'
import type { TaskCreateRequest, TaskUpdateRequest } from '@/types/task'

export const tasksKey = ['tasks'] as const

export function useTasks(params?: { leadId?: string; assignedToMe?: boolean }) {
  return useQuery({
    queryKey: [...tasksKey, params?.leadId, params?.assignedToMe],
    queryFn: () => taskService.list(params),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TaskCreateRequest) => taskService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskUpdateRequest }) => taskService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}
