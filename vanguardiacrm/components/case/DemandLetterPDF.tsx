import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 100,
    paddingHorizontal: 60,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
  },
  letterhead: {
    width: '100%',
    marginBottom: 24,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#c8922a',
    marginBottom: 20,
  },
  body: {
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
  },
  footerImage: {
    width: '100%',
  },
})

interface DemandLetterPDFProps {
  content: string
  letterheadUrl: string
  footerUrl: string
}

export function DemandLetterPDF({ content, letterheadUrl, footerUrl }: DemandLetterPDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Image src={letterheadUrl} style={styles.letterhead} />
        <View style={styles.divider} />
        <Text style={styles.body}>{content}</Text>
        <View style={styles.footer}>
          <Image src={footerUrl} style={styles.footerImage} />
        </View>
      </Page>
    </Document>
  )
}
