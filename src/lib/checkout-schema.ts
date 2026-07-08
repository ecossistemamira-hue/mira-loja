import { z } from 'zod'

export const EnderecoSchema = z.object({
  cep: z.string().min(1).max(20),
  logradouro: z.string().min(1).max(200),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(120).optional().or(z.literal('')),
  bairro: z.string().max(120).optional().or(z.literal('')),
  cidade: z.string().min(1).max(120),
  estado: z.string().max(120).optional().or(z.literal('')),
  pais: z.string().min(2).max(60),
})
export type EnderecoInput = z.infer<typeof EnderecoSchema>

export const CheckoutSchema = z
  .object({
    nome: z.string().min(2).max(120),
    email: z.string().email(),
    telefone: z.string().max(30).optional().or(z.literal('')),
    documento: z.string().max(30).optional().or(z.literal('')),
    metodoEntrega: z.enum(['envio', 'retirada']),
    // Serviço escolhido na cotação; o valor em si é recalculado no servidor.
    servicoFrete: z.enum(['economico', 'expresso']).default('economico'),
    endereco: EnderecoSchema.optional(),
  })
  .refine((d) => d.metodoEntrega !== 'envio' || !!d.endereco, {
    message: 'Endereço é obrigatório para envio',
    path: ['endereco'],
  })

export type CheckoutInput = z.infer<typeof CheckoutSchema>
