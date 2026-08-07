import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noteService } from '@/services/noteService'
import type { NoteCreateRequest } from '@/types/note'

export const notesKey = ['notes'] as const

export function useNotes(leadId: string | undefined) {
  return useQuery({
    queryKey: [...notesKey, leadId],
    queryFn: () => noteService.listByLead(leadId as string),
    enabled: !!leadId,
  })
}

export function useCreateNote(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NoteCreateRequest) => noteService.create(leadId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...notesKey, leadId] }),
  })
}

export function useDeleteNote(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => noteService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...notesKey, leadId] }),
  })
}
