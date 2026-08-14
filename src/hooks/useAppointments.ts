import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentService, appointmentTypeService } from '@/services/appointmentService'
import type {
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AvailabilityParams,
  ListAppointmentsParams,
  AppointmentTypeCreateRequest,
  AppointmentTypeUpdateRequest,
} from '@/types/appointment'

export const appointmentsKey = ['appointments'] as const
export const appointmentTypesKey = ['appointment-types'] as const

export function useAppointmentTypes() {
  return useQuery({ queryKey: appointmentTypesKey, queryFn: appointmentTypeService.list })
}

export function useCreateAppointmentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AppointmentTypeCreateRequest) => appointmentTypeService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentTypesKey }),
  })
}

export function useUpdateAppointmentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentTypeUpdateRequest }) =>
      appointmentTypeService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentTypesKey }),
  })
}

export function useDeleteAppointmentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentTypeService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentTypesKey }),
  })
}

export function useAppointments(params: ListAppointmentsParams | undefined) {
  return useQuery({
    queryKey: [...appointmentsKey, params],
    queryFn: () => appointmentService.list(params as ListAppointmentsParams),
    enabled: !!params,
  })
}

export function useLeadAppointments(leadId: string | undefined) {
  // Janela ampla (1 ano pra trás, 2 anos pra frente) - é o histórico do
  // Lead, não a grade operacional do dia (essa tem AvailabilityParams
  // próprio com janela curta).
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)
  const to = new Date()
  to.setFullYear(to.getFullYear() + 2)
  return useQuery({
    queryKey: [...appointmentsKey, 'lead', leadId],
    queryFn: () =>
      appointmentService.listByLead(leadId as string, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)),
    enabled: !!leadId,
  })
}

export function useAvailability(params: AvailabilityParams | undefined) {
  return useQuery({
    queryKey: [...appointmentsKey, 'availability', params],
    queryFn: () => appointmentService.availability(params as AvailabilityParams),
    enabled: !!params,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AppointmentCreateRequest) => appointmentService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentsKey }),
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentUpdateRequest }) =>
      appointmentService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentsKey }),
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason?: string }) =>
      appointmentService.cancel(id, cancelReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentsKey }),
  })
}
