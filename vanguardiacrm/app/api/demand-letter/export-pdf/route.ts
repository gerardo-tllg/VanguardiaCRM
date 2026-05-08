import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DemandLetterPDF } from '@/components/case/DemandLetterPDF'
import React from 'react'

export async function POST(req: NextRequest) {
  try {
    const { content, letterheadUrl, footerUrl } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Missing content.' }, { status: 400 })
    }

    const element = React.createElement(DemandLetterPDF, { content, letterheadUrl, footerUrl })
    const buffer = await renderToBuffer(element as React.ReactElement<any>)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="demand-letter.pdf"',
      },
    })
  } catch (err) {
    console.error('[export-pdf] Error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF.' }, { status: 500 })
  }
}
