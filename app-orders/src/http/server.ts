import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*'})

app.get('/health', () => {
  return 'OK'
})

app.post('/orders', {
  schema: { 
    body: z.object({
      amount: z.coerce.number()
    })
  }
}, async (request, reply) => {
  const { amount } = request.body

  console.log('Creating an order with amount', amount)
  const orderId = randomUUID()
  
  dispatchOrderCreated({
    orderId,
    amount,
    customer: {
      id: 'b6d9a196-71dc-4018-bacc-0495c14bc732'
    }
  })

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: 'b6d9a196-71dc-4018-bacc-0495c14bc732',
    amount,
  })

  return reply.status(201). send()
})

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[Orders] Http Server running')
})