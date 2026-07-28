/** Erro 401/403/404/409: string simples pronta pra exibir ao usuário. */
export interface ApiSimpleError {
  detail: string
}

/** Erro 422: array de erros de validação de campo (Pydantic). */
export interface ApiValidationErrorItem {
  type: string
  loc: (string | number)[]
  msg: string
  input: unknown
  ctx?: Record<string, unknown>
}

export interface ApiValidationError {
  detail: ApiValidationErrorItem[]
}

export type ApiErrorBody = ApiSimpleError | ApiValidationError

export function isValidationError(body: unknown): body is ApiValidationError {
  return (
    !!body &&
    typeof body === 'object' &&
    Array.isArray((body as ApiValidationError).detail)
  )
}
