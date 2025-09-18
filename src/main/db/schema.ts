import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['open', 'in_progress', 'completed', 'closed'] })
    .notNull()
    .default('open'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] })
    .notNull()
    .default('medium'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
