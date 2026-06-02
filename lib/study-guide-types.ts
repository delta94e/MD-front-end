export interface StudyGuide {
  title: string;
  summary: string;
  concepts: string[];
  terms: { term: string; definition: string }[];
  examples: { code: string; explanation: string }[];
  questions: string[];
  relatedTopics: string[];
  sourceUrl?: string;
  cached: boolean;
}
