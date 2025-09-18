import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { issues, type Issue, type NewIssue } from './schema'
import { eq, desc, like, or } from 'drizzle-orm'

// Database path - use app data folder in production, project folder in dev
const dbPath = app.isPackaged
  ? join(app.getPath('userData'), 'issues.db')
  : join(process.cwd(), 'issues.db')

// Initialize SQLite database
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL') // Better performance

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema: { issues } })

// Initialize database schema
export function initDatabase(): void {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        effort TEXT NOT NULL DEFAULT 'medium' CHECK(effort IN ('low', 'medium', 'high')),
        tags TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)

    // Add effort column for existing databases (will fail silently if column exists)
    try {
      sqlite.exec(
        `ALTER TABLE issues ADD COLUMN effort TEXT NOT NULL DEFAULT 'medium' CHECK(effort IN ('low', 'medium', 'high'))`
      )
    } catch {
      // Column already exists, ignore
    }
  } catch (error) {
    console.error('Database: Error initializing database:', error)
    throw error
  }
}

// CRUD Operations
export const issueOperations = {
  // Get all issues
  getAll: (): Issue[] => {
    try {
      return db.select().from(issues).orderBy(desc(issues.createdAt)).all()
    } catch (error) {
      console.error('Database: Error getting all issues:', error)
      throw error
    }
  },

  // Get issue by ID
  getById: (id: number): Issue | undefined => {
    return db.select().from(issues).where(eq(issues.id, id)).get()
  },

  // Create new issue
  create: (issue: Omit<NewIssue, 'id' | 'createdAt' | 'updatedAt'>): Issue => {
    const result = db.insert(issues).values(issue).returning().get()
    return result
  },

  // Update issue
  update: (id: number, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>): Issue | undefined => {
    const result = db
      .update(issues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning()
      .get()
    return result
  },

  // Delete issue
  delete: (id: number): boolean => {
    const result = db.delete(issues).where(eq(issues.id, id)).run()
    return result.changes > 0
  },

  // Search issues
  search: (query: string): Issue[] => {
    const searchPattern = `%${query}%`
    return db
      .select()
      .from(issues)
      .where(or(like(issues.title, searchPattern), like(issues.description, searchPattern)))
      .orderBy(desc(issues.createdAt))
      .all()
  }
}
