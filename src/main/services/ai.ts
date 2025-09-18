import OpenAI from 'openai'
import { z } from 'zod'

// Schema for AI response
const IssueAnalysisSchema = z.object({
  title: z.string().max(100),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  effort: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).max(5),
  reasoning: z.string()
})

type IssueAnalysis = z.infer<typeof IssueAnalysisSchema>

// Initialize OpenAI client
let openai: OpenAI | null = null

export function initializeOpenAI(apiKey: string): void {
  openai = new OpenAI({
    apiKey
  })
}

export async function analyzeIssue(
  rawInput: string
): Promise<IssueAnalysis | null> {
  // Check if API key is configured
  if (!openai) {
    const apiKey =
      (import.meta.env.VITE_OPENAI_API_KEY as string) || process.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      console.log('AI: OpenAI API key not configured, skipping analysis')
      return null
    }
    initializeOpenAI(apiKey)
  }

  try {
    const completion = await openai!.chat.completions.parse({
      model: 'gpt-5-nano', // Using gpt-5-nano as requested
      messages: [
        {
          role: 'system',
          content: `You are a software issue triaging assistant. From the user's raw input, generate:
- title: concise, descriptive issue title (max 100 chars)
- description: properly formatted description with context and details
- priority: critical (system down/data loss), high (major feature broken), medium (minor feature issue), low (cosmetic/nice-to-have)
- effort: low (< 1 hour - simple fix/typo), medium (1-4 hours - standard feature/bug), high (> 4 hours - complex/architectural change)
- tags: relevant technical tags (max 5, e.g., 'bug', 'feature', 'ui', 'performance', 'api', etc.)
- reasoning: brief explanation of your assessment

Be concise but clear. Format the description with proper paragraphs if needed.`
        },
        {
          role: 'user',
          content: `User input: ${rawInput}`
        }
      ],
      response_format: {
        type: 'json_schema' as const,
        json_schema: {
          name: 'issue_analysis',
          strict: true,
          schema: z.toJSONSchema(IssueAnalysisSchema, { target: 'draft-7' })
        }
      }
    })

    // Get the parsed result directly
    const result = completion.choices[0]?.message?.parsed

    if (!result) {
      console.error('AI: No parsed response from OpenAI')
      return null
    }

    return result
  } catch (error) {
    // Don't block issue creation on AI failures
    console.error('AI: Error analyzing issue:', error)
    return null
  }
}
