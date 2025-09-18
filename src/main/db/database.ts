import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import {
  issues,
  projects,
  type Issue,
  type NewIssue,
  type Project,
  type NewProject
} from './schema'
import { eq, desc, like, or, and } from 'drizzle-orm'

// Database path - use app data folder in production, project folder in dev
const dbPath = app.isPackaged
  ? join(app.getPath('userData'), 'issues.db')
  : join(process.cwd(), 'issues.db')

// Initialize SQLite database
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL') // Better performance

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema: { issues, projects } })

// Initialize database schema
export function initDatabase(): void {
  try {
    // Create projects table first
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#0077ff',
        icon TEXT,
        is_default INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)

    // Create issues table with project_id
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        effort TEXT NOT NULL DEFAULT 'medium' CHECK(effort IN ('low', 'medium', 'high')),
        issue_type TEXT NOT NULL DEFAULT 'task' CHECK(issue_type IN ('bug', 'feature', 'enhancement', 'task', 'documentation', 'chore')),
        project_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // Migration: Add issue_type column and remove tags column if they exist
    try {
      // First check if we need to migrate
      const columns = sqlite.prepare('PRAGMA table_info(issues)').all() as Array<{ name: string }>
      const hasIssueType = columns.some((col) => col.name === 'issue_type')
      const hasTags = columns.some((col) => col.name === 'tags')

      if (!hasIssueType) {
        // Add issue_type column
        sqlite.exec(
          `ALTER TABLE issues ADD COLUMN issue_type TEXT NOT NULL DEFAULT 'task' CHECK(issue_type IN ('bug', 'feature', 'enhancement', 'task', 'documentation', 'chore'))`
        )

        // Migrate data from tags if it exists
        if (hasTags) {
          // Try to infer type from tags
          sqlite.exec(`
            UPDATE issues
            SET issue_type = CASE
              WHEN tags LIKE '%bug%' THEN 'bug'
              WHEN tags LIKE '%feature%' THEN 'feature'
              WHEN tags LIKE '%enhancement%' THEN 'enhancement'
              WHEN tags LIKE '%doc%' THEN 'documentation'
              WHEN tags LIKE '%chore%' THEN 'chore'
              ELSE 'task'
            END
            WHERE tags IS NOT NULL
          `)
        }
      }
    } catch {
      // Migration already done or not needed
    }

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

  // Get issues by project
  getByProject: (projectId: number): Issue[] => {
    try {
      return db
        .select()
        .from(issues)
        .where(eq(issues.projectId, projectId))
        .orderBy(desc(issues.createdAt))
        .all()
    } catch (error) {
      console.error('Database: Error getting issues by project:', error)
      throw error
    }
  },

  // Get issue by ID
  getById: (id: number): Issue | undefined => {
    return db.select().from(issues).where(eq(issues.id, id)).get()
  },

  // Create new issue - projectId is required
  create: (issue: Omit<NewIssue, 'id' | 'createdAt' | 'updatedAt'>): Issue => {
    if (!issue.projectId) {
      throw new Error('projectId is required to create an issue')
    }
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
  },

  // Search issues within project
  searchInProject: (projectId: number, query: string): Issue[] => {
    const searchPattern = `%${query}%`
    return db
      .select()
      .from(issues)
      .where(
        and(
          eq(issues.projectId, projectId),
          or(like(issues.title, searchPattern), like(issues.description, searchPattern))
        )
      )
      .orderBy(desc(issues.createdAt))
      .all()
  }
}

// Project CRUD Operations
export const projectOperations = {
  // Get all projects
  getAll: (): Project[] => {
    try {
      return db.select().from(projects).orderBy(desc(projects.createdAt)).all()
    } catch (error) {
      console.error('Database: Error getting all projects:', error)
      throw error
    }
  },

  // Get project by ID
  getById: (id: number): Project | undefined => {
    return db.select().from(projects).where(eq(projects.id, id)).get()
  },

  // Create new project
  create: (project: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const result = db.insert(projects).values(project).returning().get()
    return result
  },

  // Update project
  update: (
    id: number,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Project | undefined => {
    const result = db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
      .get()
    return result
  },

  // Delete project
  delete: (id: number): boolean => {
    const result = db.delete(projects).where(eq(projects.id, id)).run()
    return result.changes > 0
  }
}
