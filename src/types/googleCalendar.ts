/**
 * Conexão OAuth2 do funcionário logado com a própria conta do Google -
 * 1:1 por Employee (cada um autoriza a própria agenda pessoal, não existe
 * conta única da plataforma como no Asaas). `null` quando nunca conectou.
 */
export interface GoogleCalendarConnection {
  connected_at: string
  google_account_email: string | null
  google_calendar_id: string
}

export interface GoogleCalendarConnectUrl {
  authorize_url: string
}

/** Resultado do backfill manual (POST /google-calendar/sync-now). */
export interface GoogleCalendarSyncResult {
  synced_count: number
}
