import axios, { AxiosError } from 'axios'
import { isValidationError, type ApiErrorBody, type ApiValidationErrorItem } from '@/types/common'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const TOKEN_STORAGE_KEY = 'crm.access_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Erro normalizado que a camada de services/telas pode consumir de forma uniforme. */
export class ApiError extends Error {
  status: number
  /** Erros por campo, no formato {loc[último item]: msg}, prontos pro setError do RHF. */
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function fieldErrorsFromValidation(items: ApiValidationErrorItem[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const item of items) {
    const field = item.loc[item.loc.length - 1]
    if (typeof field === 'string') {
      result[field] = item.msg
    }
  }
  return result
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>
    const status = axiosError.response?.status ?? 0
    const body = axiosError.response?.data

    if (body && isValidationError(body)) {
      const fieldErrors = fieldErrorsFromValidation(body.detail)
      const message = body.detail[0]?.msg ?? 'Dados inválidos.'
      return new ApiError(status, message, fieldErrors)
    }

    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      return new ApiError(status, body.detail)
    }

    if (status === 0) {
      return new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
    }

    return new ApiError(status, 'Ocorreu um erro inesperado. Tente novamente.')
  }

  return new ApiError(0, 'Ocorreu um erro inesperado. Tente novamente.')
}
