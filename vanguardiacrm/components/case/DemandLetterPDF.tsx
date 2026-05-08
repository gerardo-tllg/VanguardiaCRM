import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const SECTION_HEADINGS = [
  'Accident Overview',
  'Injuries Sustained',
  'Medical Diagnoses',
  'Treatment Plan',
  "Stower's Doctrine and Demand of Settlement",
  'Stowers Doctrine and Demand of Settlement',
  'Damages',
  'Liability',
  'Medical Expenses',
  'Demand for Settlement',
  'Property Damage',
  'Loss of Earnings',
  'Pain and Suffering',
  'LIABILITY',
  'INJURIES AND MEDICAL TREATMENT',
  'MEDICAL EXPENSES',
  'DAMAGES',
  'STOWERS DOCTRINE NOTICE',
  'DEMAND FOR SETTLEMENT',
]

const styles = StyleSheet.create({
  page: {
    paddingTop: 130,
    paddingBottom: 100,
    paddingHorizontal: 60,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
    lineHeight: 1.5,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  letterhead: {
    width: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerImage: {
    width: '100%',
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.6,
  },
  sectionHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginTop: 16,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  listItem: {
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 1.5,
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
  return SECTION_HEADINGS.some(
    (h) => trimmed.toLowerCase() === h.toLowerCase()
  )
}

function isListItem(line: string): boolean {
  return line.trim().startsWith('-') || line.trim().startsWith('*')
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
          {lines.map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) {
              return <Text key={i} style={{ marginBottom: 6 }}>{' '}</Text>
            }
            if (isHeading(trimmed)) {
              return (
                <Text key={i} style={styles.sectionHeading}>
                  {trimmed}
                </Text>
              )
            }
            if (isListItem(line)) {
              return (
                <Text key={i} style={styles.listItem}>
                  {trimmed}
                </Text>
              )
            }
            return (
              <Text key={i} style={styles.paragraph}>
                {trimmed}
              </Text>
            )
          })}
        </View>

        <View style={styles.footer} fixed>
          <Image src={footerUrl} style={styles.footerImage} />
        </View>
      </Page>
    </Document>
  )
}
