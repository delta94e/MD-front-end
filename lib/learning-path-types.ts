export interface LearningPathStep {
  order: number;
  title: string;
  path: string;
  rationale: string;
  estimatedMinutes?: number;
  difficulty?: number; // 1-5
  prerequisites?: string;
  outcome?: string;
}

export interface LearningPath {
  topic: string;
  steps: LearningPathStep[];
  totalEstimatedMinutes?: number;
  tip?: string;
}
