import OpenAI from 'openai'
import { z } from 'zod'

// Schema for AI response
const IssueAnalysisSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'critical']),
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
  title: string,
  description?: string
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
          content: `You are a software issue triaging assistant. Analyze the issue and provide a classification.`
        },
        {
          role: 'user',
          content: `Issue Title: ${title}\n${description ? `Description: ${description}` : ''}`
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
