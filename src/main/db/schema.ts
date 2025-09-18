import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  color: text('color').notNull().default('#0077ff'),
  icon: text('icon'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

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
  effort: text('effort', { enum: ['low', 'medium', 'high'] })
    .notNull()
    .default('medium'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
