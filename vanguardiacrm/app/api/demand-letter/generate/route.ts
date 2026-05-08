import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT =
  'You are a legal demand letter writer for The Lopez Law Group, a personal injury firm in Weslaco, TX. Output only the letter - no preamble, no commentary, no markdown formatting. Plain text only.'

export async function POST(req: NextRequest) {
  try {
    let prompt: string

    try {
      const body = await req.json()
      console.log('[demand-letter/generate] Incoming body:', {
        hasPrompt: !!body?.prompt,
        promptLength: typeof body?.prompt === 'string' ? body.prompt.length : null,
        promptPreview: typeof body?.prompt === 'string' ? body.prompt.slice(0, 200) : body?.prompt,
      })
      prompt = body?.prompt
    } catch (err) {
      console.error('[demand-letter/generate] Failed to parse request body:', {
        message: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
      })
      return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!prompt || typeof prompt !== 'string') {
      console.error('[demand-letter/generate] Missing or invalid prompt field:', { prompt })
      return new Response(JSON.stringify({ error: 'Missing required field: prompt.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[demand-letter/generate] ANTHROPIC_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sanitizedPrompt = prompt
      .replace(/—/g, '--')
      .replace(/–/g, '-')
      .replace(/‘|’/g, "'")
      .replace(/“|”/g, '"')
      .replace(/[^\x00-\xFF]/g, '')

    console.log('[demand-letter/generate] Starting stream, prompt length:', sanitizedPrompt.length)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: sanitizedPrompt }],
          })

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }

          console.log('[demand-letter/generate] Stream completed successfully')
          controller.close()
        } catch (err) {
          console.error('[demand-letter/generate] Streaming error:', {
            message: err instanceof Error ? err.message : err,
            stack: err instanceof Error ? err.stack : undefined,
            isApiError: err instanceof Anthropic.APIError,
            status: err instanceof Anthropic.APIError ? err.status : undefined,
            error: err instanceof Anthropic.APIError ? err.error : undefined,
          })
          const message =
            err instanceof Anthropic.APIError
              ? err.message
              : 'An unexpected error occurred.'
          controller.enqueue(
            encoder.encode(`\n\n__ERROR__: ${message}`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[demand-letter/generate] Unhandled handler error:', {
      message: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
