import { pgTable, text, integer, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum('orders_status', [
  'pending',
  'paid',
  'canceled'
])

export const orders = pgTable('orders', {
  id: text ().primaryKey(),
  customerId: text().notNull(),
  amount: integer().notNull(),
  status: orderStatusEnum().notNull().default('pending'),
  createdAt: timestamp().defaultNow().notNull()
})