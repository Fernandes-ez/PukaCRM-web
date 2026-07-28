import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, KeyRound, Send, UserCog } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Eyebrow } from '@/components/brand/Eyebrow'
import { MetaTutorialLink } from '@/pages/whatsapp/metaTutorial'

const steps = [
  {
    icon: UserCog,
    title: 'Nossa equipe cadastra seu número na Meta',
    description:
      'Nessa fase inicial, o cadastro é feito com acompanhamento próximo: o time Puka registra o número da sua empresa diretamente no Business Portfolio da Meta.',
  },
  {
    icon: KeyRound,
    title: 'Você recebe o Phone Number ID e o token de acesso',
    description:
      'Depois do cadastro, a equipe te envia os dois valores por um canal seguro combinado com você. Guarde-os — o token não pode ser recuperado depois, só gerado de novo.',
  },
  {
    icon: Send,
    title: 'Cole os valores na tela de WhatsApp',
    description:
      'Volte pra Configurações → WhatsApp e preencha o número de telefone, o Phone Number ID e o token de acesso exatamente como foram enviados.',
  },
  {
    icon: Bot,
    title: 'Pronto — mensagens reais passam a funcionar',
    description:
      'A partir daí o número envia e recebe mensagens de verdade: a IA responde automaticamente até um humano da sua equipe assumir a conversa.',
  },
]

export function WhatsappHelpPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link
        to="/whatsapp"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar pro WhatsApp
      </Link>

      <div>
        <Eyebrow>Guia de conexão</Eyebrow>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Como conectar seu WhatsApp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passo a passo da conexão manual — a fase em que estamos hoje.
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
        <AlertTitle>De onde vêm esses valores?</AlertTitle>
        <AlertDescription>
          Phone Number ID e token de acesso são gerados no painel de desenvolvedores da própria Meta, na
          configuração do WhatsApp Cloud API. Se quiser entender o processo por trás (não é necessário pra colar os
          valores aqui), a Meta documenta cada etapa.
          <MetaTutorialLink className="mt-2" />
        </AlertDescription>
      </Alert>

      <Card className="border-dashed">
        <CardContent className="p-5">
          <h2 className="font-semibold">Isso é temporário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esse cadastro manual é uma etapa inicial, não o formato definitivo. Assim que a integração automática da
            Meta estiver disponível, essa tela vira um botão único de "Conectar WhatsApp" — sem precisar copiar
            Phone Number ID nem token de ninguém.
          </p>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/whatsapp">
          <ArrowLeft className="h-4 w-4" />
          Voltar pro WhatsApp
        </Link>
      </Button>
    </div>
  )
}
