import type { TopicFile } from "@/lib/topic-index";

export interface SkillConfig {
  name: string;
  description: string;
  topicCategory: string;
  topicCategoryId: string;
  files: TopicFile[];
}

export interface TopicSummary {
  filePath: string;
  title: string;
  headers: string[];
  keyTerms: string[];
  codeBlocks: string[];
}

export interface SkillContent {
  config: SkillConfig;
  skillMd: string;
  references?: string;
}
