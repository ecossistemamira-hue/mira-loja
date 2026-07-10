import { z } from 'zod'

// Endereço paraguaio: sem CEP (não se usa por lá); referência é o campo que
// as entregas pedem. Cidade/departamento vêm do seletor de cidades da AEX.
export const EnderecoSchema = z.object({
  logradouro: z.string().min(1).max(200), // dirección
  numero: z.string().max(20).optional().or(z.literal('')),
  complemento: z.string().max(200).optional().or(z.literal('')), // referencia
  bairro: z.string().max(120).optional().or(z.literal('')),
  cidade: z.string().min(1).max(120),
  estado: z.string().max(120).optional().or(z.literal('')), // departamento
  pais: z.string().min(2).max(60).default('PY'),
})
export type EnderecoInput = z.infer<typeof EnderecoSchema>

export const CheckoutSchema = z
  .object({
    nome: z.string().min(2).max(120),
    email: z.string().email(),
    telefone: z.string().max(30).optional().or(z.literal('')),
    documento: z.string().max(30).optional().or(z.literal('')),
    metodoEntrega: z.enum(['envio', 'retirada']),
    // Código de cupom aplicado (revalidado + consumido no servidor).
    cupom: z.string().max(40).optional().or(z.literal('')),
    // Cidade da tabela AEX (id); o frete é recalculado no servidor por ela.
    cidadeEntregaId: z.number().int().positive().optional(),
    endereco: EnderecoSchema.optional(),
  })
  .refine((d) => d.metodoEntrega !== 'envio' || !!d.endereco, {
    message: 'Endereço é obrigatório para envio',
    path: ['endereco'],
  })
  .refine((d) => d.metodoEntrega !== 'envio' || d.cidadeEntregaId != null, {
    message: 'Escolha a cidade de entrega',
    path: ['cidadeEntregaId'],
  })

export type CheckoutInput = z.infer<typeof CheckoutSchema>
