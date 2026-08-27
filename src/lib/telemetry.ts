import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import type { EmployeeMe } from '@/types/auth'

const sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN
const posthogEnabled = !!import.meta.env.VITE_POSTHOG_KEY

/** Chama uma vez, no bootstrap (src/main.tsx). Sem as env vars, é no-op. */
export function initTelemetry() {
  if (sentryEnabled) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
    })
  }

  if (posthogEnabled) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      autocapture: true,
    })
  }
}

/** Chamado de dentro de ErrorBoundary e do capture de erro de API em apiClient. */
export function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (sentryEnabled) {
    Sentry.captureException(error, extra ? { extra } : undefined)
  }
}

/** Chamado de AuthContext assim que o funcionário logado resolve (GET /employees/me). */
export function identifyUser(employee: EmployeeMe) {
  if (sentryEnabled) {
    Sentry.setUser({ id: employee.id, email: employee.email })
  }
  if (posthogEnabled) {
    posthog.identify(employee.id, {
      email: employee.email,
      company_id: employee.company_id,
      role_id: employee.role_id,
      is_owner: employee.is_owner,
    })
  }
}

/** Chamado no logout - higiene de PII ao trocar de conta numa máquina compartilhada. */
export function resetUser() {
  if (sentryEnabled) {
    Sentry.setUser(null)
  }
  if (posthogEnabled) {
    posthog.reset()
  }
}
