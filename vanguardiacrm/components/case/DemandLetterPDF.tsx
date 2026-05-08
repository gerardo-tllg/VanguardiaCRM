import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const SECTION_HEADINGS = [
  'Accident Overview',
  'Injuries Sustained',
  'Medical Diagnoses',
  'Treatment Plan',
  "Stower's Doctrine and Demand of Settlement",
  "Stowers Doctrine and Demand of Settlement",
  'Damages',
  'Liability',
  'Injuries and Medical Treatment',
  'Medical Expenses',
  'Demand for Settlement',
  'Property Damage',
  'Settlement Demand',
  'Loss of Earnings',
  'Pain and Suffering',
  'LIABILITY',
  'INJURIES AND MEDICAL TREATMENT',
  'MEDICAL EXPENSES',
  'DAMAGES',
  'STOWERS DOCTRINE NOTICE',
  'DEMAND FOR SETTLEMENT',
  'Stowers Demand',
  'STOWERS DEMAND',
  'Demand for Settlement',
  'DEMAND FOR SETTLEMENT',
]

const HEADER_LINES = [
  /^Claim Number:/i,
  /^Date of Incident:/i,
  /^Client:/i,
  /^Insured:/i,
  /^Policy Number:/i,
  /^Re:/i,
  /^Attn:/i,
  /^Our Client:/i,
  /^Your Insured:/i,
  /^Claim No/i,
  /^Policy No/i,
]

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 80,
    paddingHorizontal: 65,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  letterhead: {
    width: '100%',
    height: 100,
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  footerImage: {
    width: '100%',
    height: 70,
    objectFit: 'contain',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.4,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  boldLine: {
    marginBottom: 3,
    lineHeight: 1.3,
    fontFamily: 'Times-Bold',
    fontSize: 11,
  },
  sectionHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  listItem: {
    marginBottom: 3,
    paddingLeft: 16,
    lineHeight: 1.4,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  salutation: {
    marginBottom: 10,
    marginTop: 8,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  spacer: {
    marginBottom: 2,
  },
  signatureRespectfully: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    marginTop: 16,
    marginBottom: 8,
  },
  signatureFirm: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: '#c8922a',
    marginBottom: 2,
  },
  signatureName: {
    fontFamily: 'Times-BoldItalic',
    fontSize: 12,
    marginBottom: 2,
  },
  signatureTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    textDecoration: 'underline',
  },
})

interface DemandLetterPDFProps {
  content: string
  letterheadUrl: string
  footerUrl: string
}

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  return SECTION_HEADINGS.some(h => trimmed.toLowerCase() === h.toLowerCase())
}

function isHeaderLine(line: string): boolean {
  return HEADER_LINES.some(r => r.test(line.trim()))
}

function isViaFax(line: string): boolean {
  return /^Via Fax:/i.test(line.trim())
}

function isListItem(line: string): boolean {
  const t = line.trim()
  return t.startsWith('-') || t.startsWith('*')
}

function isSalutation(line: string): boolean {
  return line.trim().startsWith('Dear ')
}

function isSignatureBlock(line: string): boolean {
  const t = line.trim()
  return (
    t === 'Respectfully,' ||
    t === 'The Lopez Law Group' ||
    t === 'Fernando J. Lopez' ||
    t === 'Attorney at Law'
  )
}

export function DemandLetterPDF({ content, letterheadUrl, footerUrl }: DemandLetterPDFProps) {
  const lines = content.split('\n')

  // Pre-scan: date line (first non-empty) and Via Fax line
  let dateIdx = -1
  let viaFaxIdx = -1
  for (let j = 0; j < lines.length; j++) {
    if (lines[j].trim() && dateIdx === -1) { dateIdx = j; continue }
    if (isViaFax(lines[j]) && viaFaxIdx === -1) { viaFaxIdx = j; break }
  }
  const dateLine = dateIdx >= 0 ? lines[dateIdx].trim() : ''
  const viaFaxLine = viaFaxIdx >= 0 ? lines[viaFaxIdx].trim() : ''
  const skipIndices = new Set([dateIdx, viaFaxIdx].filter(n => n >= 0))

  // Pre-scan: find "Respectfully," to know where signature block starts
  let sigStartIdx = -1
  for (let j = 0; j < lines.length; j++) {
    if (lines[j].trim() === 'Respectfully,') { sigStartIdx = j; break }
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Image src={letterheadUrl} style={styles.letterhead} />
        </View>

        <View>
          {/* Date / Via Fax row */}
          {(dateLine || viaFaxLine) && (
            <View style={styles.dateRow}>
              <Text style={styles.paragraph}>{dateLine}</Text>
              {viaFaxLine ? <Text style={styles.paragraph}>{viaFaxLine}</Text> : null}
            </View>
          )}

          {(() => {
            const elements: React.ReactNode[] = []
            let i = 0

            while (i < lines.length) {
              // Skip lines already rendered in the date row
              if (skipIndices.has(i)) { i++; continue }

              const line = lines[i]
              const trimmed = line.trim()

              // Empty line spacer
              if (!trimmed) {
                elements.push(<Text key={i} style={styles.spacer}>{' '}</Text>)
                i++
                continue
              }

              // Signature block — render all four lines as one unbreakable unit
              if (i === sigStartIdx) {
                elements.push(
                  <View key={`sig-${i}`} wrap={false} minPresenceAhead={100}>
                    <Text style={styles.signatureRespectfully}>Respectfully,</Text>
                    <Text style={styles.signatureFirm}>The Lopez Law Group</Text>
                    <Text style={styles.signatureName}>Fernando J. Lopez</Text>
                    <Text style={styles.signatureTitle}>Attorney at Law</Text>
                  </View>
                )
                i += 4
                continue
              }

              // Skip any remaining individual signature lines (in case i landed mid-block)
              if (isSignatureBlock(line)) { i++; continue }

              // Section heading — wrap with next paragraph to prevent orphans
              if (isHeading(trimmed)) {
                const headingText = trimmed
                i++
                while (i < lines.length && !lines[i].trim()) i++
                const nextParaLines: string[] = []
                while (
                  i < lines.length &&
                  lines[i].trim() &&
                  !isHeading(lines[i].trim()) &&
                  !isHeaderLine(lines[i]) &&
                  !isListItem(lines[i]) &&
                  !isSalutation(lines[i]) &&
                  !isSignatureBlock(lines[i])
                ) {
                  nextParaLines.push(lines[i].trim())
                  i++
                }
                elements.push(
                  <View key={`heading-${i}`} wrap={false}>
                    <Text style={styles.sectionHeading}>{headingText}</Text>
                    {nextParaLines.length > 0 && (
                      <Text style={styles.paragraph}>{nextParaLines.join(' ')}</Text>
                    )}
                  </View>
                )
                continue
              }

              if (isHeaderLine(line)) {
                elements.push(<Text key={i} style={styles.boldLine}>{trimmed}</Text>)
                i++
                continue
              }

              if (isListItem(line)) {
                elements.push(<Text key={i} style={styles.listItem}>{trimmed}</Text>)
                i++
                continue
              }

              if (isSalutation(line)) {
                elements.push(<Text key={i} style={styles.salutation}>{trimmed}</Text>)
                i++
                continue
              }

              // Regular paragraph — collect consecutive non-special lines
              const paragraphLines: string[] = []
              while (
                i < lines.length &&
                lines[i].trim() &&
                !skipIndices.has(i) &&
                i !== sigStartIdx &&
                !isHeading(lines[i].trim()) &&
                !isHeaderLine(lines[i]) &&
                !isListItem(lines[i]) &&
                !isSalutation(lines[i]) &&
                !isSignatureBlock(lines[i])
              ) {
                paragraphLines.push(lines[i].trim())
                i++
              }
              if (paragraphLines.length > 0) {
                elements.push(
                  <Text key={i + '-p'} style={styles.paragraph}>
                    {paragraphLines.join(' ')}
                  </Text>
                )
              }
            }

            return elements
          })()}
        </View>

        <View style={styles.footer} fixed>
          <Image src={footerUrl} style={styles.footerImage} />
        </View>
      </Page>
    </Document>
  )
}
