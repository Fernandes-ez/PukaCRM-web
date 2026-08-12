import { Link } from 'react-router-dom'
import { ArrowLeft, Tag, FileText, ShieldAlert, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Eyebrow } from '@/components/brand/Eyebrow'
import { MetaTemplateGuidelinesLink } from '@/pages/whatsapp/metaTemplateGuidelines'

const steps = [
  {
    icon: Tag,
    title: 'Escolha a categoria certa',
    description:
      'Utilidade: mensagem transacional ligada a algo já combinado com o Lead (sem conteúdo promocional). Marketing: oferta, promoção ou recomendação - a Meta exige um texto de opt-out no corpo (ex: "Responda PARAR para não receber mais mensagens") e um botão de resposta rápida com essa mesma opção. Autenticação: só código/confirmação - o corpo é um texto fixo da própria Meta, não dá pra escrever livremente. Na dúvida pra reengajar um Lead parado, Utilidade costuma ser a categoria certa.',
  },
  {
    icon: FileText,
    title: 'Escreva um corpo direto',
    description:
      'Até 1024 caracteres, mas mensagens curtas (na faixa de 160) tendem a ser aprovadas mais rápido e performam melhor. O rodapé (opcional) tem até 60 caracteres e não aceita variável - só texto fixo, tipo assinatura.',
  },
  {
    icon: ShieldAlert,
    title: 'Evite o que a Meta rejeita',
    description:
      'Pedir dado sensível (número completo de cartão, CPF, dados bancários), preço enganoso ou promessa exagerada, produto proibido (armas, drogas, apostas conforme a região), e texto genérico demais que poderia servir pra qualquer coisa (parece spam). Dois templates com o mesmo corpo/rodapé são rejeitados automaticamente - exceto na categoria Autenticação.',
  },
  {
    icon: Clock,
    title: 'Aguarde a revisão',
    description:
      'Geralmente de alguns minutos a 48h. O status muda sozinho na nossa tela (Em análise → Aprovado ou Rejeitado, com o motivo que a Meta informou) - não precisa ficar checando no WhatsApp Manager.',
  },
]

export function TemplatesHelpPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link
        to="/whatsapp/templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pros Templates
      </Link>

      <div>
        <Eyebrow>Guia de templates</Eyebrow>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Como criar um template aprovado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regras que a Meta usa pra revisar - seguir isso reduz a chance de rejeição.
        </p>
      </div>

      <div className="divider-stripes w-24 opacity-70" />

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card notch={index % 2 === 0 ? 'tr' : 'bl'}>
              <CardContent className="flex gap-4 p-5">
                <div className="btn-cut-sm flex h-10 w-10 shrink-0 items-center justify-center bg-brand-600 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <h2 className="font-semibold">{step.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <Alert>
        <AlertTitle>Sobre a categoria Marketing</AlertTitle>
        <AlertDescription>
          Templates de Marketing precisam de um jeito de recusar receber mais mensagens - adicione um botão de
          "Resposta rápida" (ex: "Parar promoções") na seção de Botões do formulário, e inclua um texto de opt-out
          no corpo (ex: "Responda PARAR para não receber mais mensagens"). Sem os dois, a Meta rejeita o template.
          Pra reengajar um Lead parado sem oferta/promoção, Utilidade continua sendo a categoria certa e não exige
          nada disso.
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTitle>De onde vêm essas regras?</AlertTitle>
        <AlertDescription>
          Resumo direto da política oficial da Meta, sem o jargão técnico voltado a desenvolvedor. Se quiser ler a
          fonte original (em inglês):
          <MetaTemplateGuidelinesLink className="mt-2" />
        </AlertDescription>
      </Alert>

      <Button asChild variant="outline">
        <Link to="/whatsapp/templates">
          <ArrowLeft className="h-4 w-4" />
          Voltar pros Templates
        </Link>
      </Button>
    </div>
  )
}
