import { ReportSection } from '../types/report'

export interface ReportSectionConfig {
  key: ReportSection
  title: string
  subtitle: string
}

export const REPORT_SECTIONS: ReportSectionConfig[] = [
  {
    key: 'personalized',
    title: 'Personalized Fortune Report',
    subtitle: 'Comprehensive personalised guidance prepared for you.',
  },
  {
    key: 'additional',
    title: 'Additional Astrology Reports',
    subtitle: 'More reports for specific areas of life.',
  },
]
