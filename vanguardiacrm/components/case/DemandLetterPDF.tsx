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
]

const HEADER_LINES = [
  /^Via Fax:/i,
  /^Via fax:/i,
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Image src={letterheadUrl} style={styles.letterhead} />
        </View>

        <View>
          {(() => {
            const elements: React.ReactNode[] = []
            let i = 0

            while (i < lines.length) {
              const line = lines[i]
              const trimmed = line.trim()

              if (!trimmed) {
                elements.push(<Text key={i} style={styles.spacer}>{' '}</Text>)
                i++
                continue
              }

              if (isHeading(trimmed)) {
                elements.push(<Text key={i} style={styles.sectionHeading}>{trimmed}</Text>)
                i++
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

              if (isSignatureBlock(line)) {
                elements.push(<Text key={i} style={styles.boldLine}>{trimmed}</Text>)
                i++
                continue
              }

              const paragraphLines: string[] = []
              while (
                i < lines.length &&
                lines[i].trim() &&
                !isHeading(lines[i].trim()) &&
                !isHeaderLine(lines[i]) &&
                !isListItem(lines[i]) &&
                !isSalutation(lines[i]) &&
                !isSignatureBlock(lines[i])
              ) {
                paragraphLines.push(lines[i].trim())
                i++
              }
              elements.push(
                <Text key={i + '-p'} style={styles.paragraph}>
                  {paragraphLines.join(' ')}
                </Text>
              )
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
