import OpenAI from 'openai'
import { z } from 'zod'

// Schema for AI response
const IssueAnalysisSchema = z.object({
  title: z.string().max(100),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  effort: z.enum(['low', 'medium', 'high']),
  issueType: z.enum(['bug', 'feature', 'enhancement', 'task', 'documentation', 'chore'])
})

type IssueAnalysis = z.infer<typeof IssueAnalysisSchema>

// Initialize OpenAI client
let openai: OpenAI | null = null

export function initializeOpenAI(apiKey: string): void {
  openai = new OpenAI({
    apiKey
  })
}

export async function analyzeIssue(rawInput: string): Promise<IssueAnalysis | null> {
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
          content: `Extract and format an issue from user input. Rules:
- title: short, scannable summary from the input (max 100 chars)
- description: clean up the user's text for clarity, but ONLY use information they provided
- priority: critical/high/medium/low based on described impact
- effort: low/medium/high based on described complexity
- issueType: categorize as bug/feature/enhancement/task/documentation/chore based on the nature of the request

Be concise. Do not invent details not in the input.`
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
