export type WhatsAppInstanceStatus = 'PENDING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

/**
 * Só META_CLOUD_API tem implementação real no backend hoje (envio + webhook).
 * Os outros existem no enum por flexibilidade futura, mas não funcionam de verdade.
 */
export type WhatsAppProvider = 'META_CLOUD_API' | 'EVOLUTION_API' | 'GUPSHUP' | 'Z_API'

export interface WhatsAppInstance {
  id: string
  company_id: string
  provider: WhatsAppProvider
  phone_number: string
  /** ID do número na Meta (value.metadata.phone_number_id dos webhooks) — necessário pro envio/recebimento funcionarem de verdade. */
  phone_number_id: string | null
  label: string | null
  status: WhatsAppInstanceStatus
  created_at: string
  updated_at: string
  // `credentials` nunca volta em nenhum GET — não incluído no tipo de leitura.
}

export interface WhatsAppInstanceCreateRequest {
  provider: WhatsAppProvider
  phone_number: string
  label?: string
  phone_number_id?: string
  /** Convenção esperada pelo backend pro provider META_CLOUD_API. */
  credentials: { access_token: string }
}

export interface WhatsAppInstanceCreateResponse {
  instance: WhatsAppInstance
  service_api_key: string
}

export interface WhatsAppInstanceUpdateRequest {
  phone_number?: string
  label?: string
  phone_number_id?: string
  /** Omitir se não for trocar o token — `credentials` nunca vem preenchido de volta pra reexibir. */
  credentials?: { access_token: string }
  status?: WhatsAppInstanceStatus
}

export interface RegenerateApiKeyResponse {
  service_api_key: string
}
