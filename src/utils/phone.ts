/**
 * Formata telefone pro padrão `+xxx (xx) xxxxx-xxxx`. O telefone é gravado
 * de formas diferentes dependendo da origem (webhook da Meta manda com DDI,
 * cadastro manual às vezes não) - normaliza só pelos dígitos e assume Brasil
 * (`55`) quando o DDI não vem incluído, já que é o único mercado do produto
 * hoje. Não reconhecendo um formato BR válido (DDD + 8 ou 9 dígitos), devolve
 * o telefone original sem mexer, em vez de arriscar um resultado errado.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  let ddi: string
  let rest: string
  if (digits.length === 12 || digits.length === 13) {
    ddi = digits.slice(0, 2)
    rest = digits.slice(2)
  } else if (digits.length === 10 || digits.length === 11) {
    ddi = '55'
    rest = digits
  } else {
    return phone
  }

  const ddd = rest.slice(0, 2)
  const number = rest.slice(2)

  if (number.length === 9) {
    return `+${ddi} (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
  }
  if (number.length === 8) {
    return `+${ddi} (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
  }
  return phone
}
