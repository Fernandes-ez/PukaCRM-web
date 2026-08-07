export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  position: number
  is_won: boolean
  is_lost: boolean
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  company_id: string
  stages: PipelineStage[]
  created_at: string
  updated_at: string
}

export interface PipelineStageCreateRequest {
  name: string
  is_won?: boolean
  is_lost?: boolean
}

export interface PipelineStageUpdateRequest {
  name?: string
  is_won?: boolean
  is_lost?: boolean
}

export interface PipelineStageReorderRequest {
  stage_ids: string[]
}
