import { z } from 'zod'

import { ZONAS_ENTREGA } from '@/lib/frete'

// Endereço paraguaio: sem CEP obrigatório (código postal quase não se usa);
// referência é o campo que os deliveries pedem.
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
    // Zona de entrega PY (define forma + preço); o valor é recalculado no servidor.
    zonaEntrega: z.enum(ZONAS_ENTREGA as [string, ...string[]]).optional(),
    endereco: EnderecoSchema.optional(),
  })
  .refine((d) => d.metodoEntrega !== 'envio' || !!d.endereco, {
    message: 'Endereço é obrigatório para envio',
    path: ['endereco'],
  })
  .refine((d) => d.metodoEntrega !== 'envio' || !!d.zonaEntrega, {
    message: 'Escolha a zona de entrega',
    path: ['zonaEntrega'],
  })

export type CheckoutInput = z.infer<typeof CheckoutSchema>
