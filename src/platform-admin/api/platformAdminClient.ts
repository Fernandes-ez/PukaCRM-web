import axios from 'axios'
import { API_URL } from '@/services/apiClient'

/**
 * Instância própria, NÃO a `api` de src/services/apiClient.ts - chave de
 * token separada de propósito ("crm.platform_admin_token", nunca
 * "crm.access_token" do Employee), pra que uma sessão de admin da
 * plataforma e uma sessão normal de Employee nunca se misturem, mesmo
 * abertas na mesma aba/bundle. A fronteira real de segurança é o backend
 * (secret de assinatura diferente), isso aqui é só higiene de estado no
 * cliente. `normalizeApiError` é reaproveitado normalmente (é só parsing
 * de forma de erro, não tem nada de auth nele).
 */
const PLATFORM_ADMIN_TOKEN_KEY = 'crm.platform_admin_token'

export function getPlatformAdminToken(): string | null {
  return localStorage.getItem(PLATFORM_ADMIN_TOKEN_KEY)
}

export function setPlatformAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem(PLATFORM_ADMIN_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(PLATFORM_ADMIN_TOKEN_KEY)
  }
}

export const platformAdminApi = axios.create({ baseURL: API_URL })

platformAdminApi.interceptors.request.use((config) => {
  const token = getPlatformAdminToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
