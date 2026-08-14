import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequirePermission } from '@/routes/RequirePermission'
import { AppLayout } from '@/modules/layout/AppLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { WorkSchedulesPage } from '@/pages/employees/WorkSchedulesPage'
import { RolesPage } from '@/pages/roles/RolesPage'
import { AssistantPage } from '@/pages/assistant/AssistantPage'
import { WhatsappPage } from '@/pages/whatsapp/WhatsappPage'
import { WhatsappHelpPage } from '@/pages/whatsapp/WhatsappHelpPage'
import { MessageTemplatesPage } from '@/pages/whatsapp/MessageTemplatesPage'
import { TemplatesHelpPage } from '@/pages/whatsapp/TemplatesHelpPage'
import { LeadsPage } from '@/pages/leads/LeadsPage'
import { PipelinePage } from '@/pages/pipeline/PipelinePage'
import { ConversationsPage } from '@/pages/conversations/ConversationsPage'
import { CompanyPage } from '@/pages/company/CompanyPage'
import { SubscriptionPage } from '@/pages/subscription/SubscriptionPage'
import { DistributionPage } from '@/pages/distribution/DistributionPage'
import { CampaignsPage } from '@/pages/campaigns/CampaignsPage'
import { CreateCampaignPage } from '@/pages/campaigns/CreateCampaignPage'
import { CampaignDetailPage } from '@/pages/campaigns/CampaignDetailPage'
import { AgendaPage } from '@/pages/agenda/AgendaPage'

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

            <Route element={<RequirePermission module="SCHEDULING" resource="appointment" action="VIEW" />}>
              <Route path="/agenda" element={<AgendaPage />} />
            </Route>

            <Route element={<RequirePermission module="EMPLOYEES" resource="employee" action="VIEW" />}>
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/distribuicao" element={<DistributionPage />} />
            </Route>
            <Route element={<RequirePermission module="EMPLOYEES" resource="work_schedule" action="VIEW" />}>
              <Route path="/employees/work-schedules" element={<WorkSchedulesPage />} />
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
              <Route path="/whatsapp/templates/ajuda" element={<TemplatesHelpPage />} />
            </Route>
            <Route element={<RequirePermission module="CAMPAIGNS" resource="campaign" action="VIEW" />}>
              <Route path="/campanhas" element={<CampaignsPage />} />
              <Route path="/campanhas/:campaignId" element={<CampaignDetailPage />} />
            </Route>
            <Route element={<RequirePermission module="CAMPAIGNS" resource="campaign" action="CREATE" />}>
              <Route path="/campanhas/nova" element={<CreateCampaignPage />} />
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
