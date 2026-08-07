import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequirePermission } from '@/routes/RequirePermission'
import { AppLayout } from '@/modules/layout/AppLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { RolesPage } from '@/pages/roles/RolesPage'
import { AssistantPage } from '@/pages/assistant/AssistantPage'
import { WhatsappPage } from '@/pages/whatsapp/WhatsappPage'
import { WhatsappHelpPage } from '@/pages/whatsapp/WhatsappHelpPage'
import { MessageTemplatesPage } from '@/pages/whatsapp/MessageTemplatesPage'
import { LeadsPage } from '@/pages/leads/LeadsPage'
import { PipelinePage } from '@/pages/pipeline/PipelinePage'
import { ConversationsPage } from '@/pages/conversations/ConversationsPage'
import { CompanyPage } from '@/pages/company/CompanyPage'
import { SubscriptionPage } from '@/pages/subscription/SubscriptionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/conversations/:id" element={<ConversationsPage />} />
            <Route path="/leads" element={<LeadsPage />} />

            <Route element={<RequirePermission module="PIPELINE" resource="pipeline" action="VIEW" />}>
              <Route path="/pipeline" element={<PipelinePage />} />
            </Route>

            <Route element={<RequirePermission module="EMPLOYEES" resource="employee" action="VIEW" />}>
              <Route path="/employees" element={<EmployeesPage />} />
            </Route>
            <Route element={<RequirePermission module="ROLES" resource="role" action="VIEW" />}>
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            <Route element={<RequirePermission module="ASSISTANT" resource="assistant" action="VIEW" />}>
              <Route path="/assistant" element={<AssistantPage />} />
            </Route>
            <Route element={<RequirePermission module="WHATSAPP" resource="whatsapp_instance" action="VIEW" />}>
              <Route path="/whatsapp" element={<WhatsappPage />} />
              <Route path="/whatsapp/ajuda" element={<WhatsappHelpPage />} />
            </Route>
            <Route element={<RequirePermission module="WHATSAPP" resource="message_template" action="VIEW" />}>
              <Route path="/whatsapp/templates" element={<MessageTemplatesPage />} />
            </Route>
            <Route element={<RequirePermission module="COMPANY" resource="company" action="VIEW" />}>
              <Route path="/empresa" element={<CompanyPage />} />
            </Route>
            <Route element={<RequirePermission module="SUBSCRIPTION" resource="subscription" action="VIEW" />}>
              <Route path="/assinatura" element={<SubscriptionPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
