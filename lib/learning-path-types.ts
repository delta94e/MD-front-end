export interface LearningPathStep {
  order: number;
  title: string;
  path: string;
  rationale: string;
  estimatedMinutes?: number;
}

export interface LearningPath {
  topic: string;
  steps: LearningPathStep[];
  totalEstimatedMinutes?: number;
}
