/**
 * ==============================================================================
 * TypeSafe AI (JEV) - Primitives, Questions & Composite Scoring Types
 * ==============================================================================
 * Basado en la especificación oficial de TypeSafe AI y su modelo System One (JEV):
 * - Primitivas: Score (rubric ordinal), Choice (selección categórica) y Noul (probabilidad sí/no)
 * - Patrón: Composite Scoring (Resume Screening) con normalización y pesos en código
 * ==============================================================================
 */

import { choice, noul, score } from '@typesafe-ai/sdk';

/**
 * Preguntas formales enviadas a JEV en una única llamada paralela de System One.
 * Sigue el patrón oficial de Composite Scoring para evaluación de currículums.
 */
export const CV_EVALUATION_QUESTIONS = {
  frontend_depth: score(
    'How much depth of Front-End experience (React, Next.js, TypeScript, modern CSS, Web Vitals, state management) does this candidate have based on the supplied resume?',
    [
      'No front-end or modern JavaScript experience mentioned',
      'Basic HTML/CSS or legacy scripts; little to no React/TypeScript depth',
      'Solid working knowledge of React/TypeScript with some production projects',
      'Strong expertise: Next.js, advanced React, state architectures, performance tuning',
      'Staff/Principal mastery: Web Vitals, micro-frontends, high scale, deep ecosystem leadership',
    ] as const
  ),
  backend_depth: score(
    'How much experience does this candidate have designing and building scalable back-end services, APIs, and business logic (Node.js, Go, Python, REST, GraphQL)?',
    [
      'No back-end development experience mentioned',
      'Basic scripting or simple CRUD routes; minimal API design depth',
      'Competent with Node.js/Go/Python, building standard REST/GraphQL endpoints',
      'Strong architecture: authentication, concurrency, resilience, clean modular design',
      'Mastery of distributed systems, high throughput, event-driven architectures',
    ] as const
  ),
  database_depth: score(
    'How much depth does this candidate have in relational and NoSQL databases, data modeling, query optimization, and ORMs (PostgreSQL, Redis, Prisma, Drizzle)?',
    [
      'No database experience mentioned',
      'Basic query use or simple NoSQL collections without schema design',
      'Solid understanding of relational schemas, CRUD, and standard ORMs',
      'Advanced indexing, transaction management, caching strategies with Redis',
      'Expert database architecture: partitioning/sharding, query tuning, high availability',
    ] as const
  ),
  devops_cloud: score(
    'How much experience does this candidate have with containerization, cloud infrastructure, and CI/CD pipelines (Docker, Kubernetes, AWS, GCP, GitHub Actions)?',
    [
      'No DevOps, cloud, or containerization experience mentioned',
      'Basic Git and manual deployments; minimal infrastructure awareness',
      'Practical usage of Docker and basic automated CI/CD pipelines',
      'Proficient cloud deployments (AWS/GCP), container orchestration, and IaC',
      'Deep DevOps/SRE expertise: Kubernetes clusters, multi-region scalability, observability',
    ] as const
  ),
  business_impact: score(
    'How much evidence is there of measurable business impact, engineering leadership, and product delivery in the candidate resume?',
    [
      'No business impact or team collaboration mentioned; purely task-oriented',
      'Delivered standard features as an individual contributor',
      'Demonstrated ownership of features, meeting deadlines, and cross-team collaboration',
      'Quantified business results: revenue growth, cost reduction, or team mentoring',
      'Strategic engineering leadership: defined roadmaps, scaled teams, enterprise impact',
    ] as const
  ),
  seniority_level: choice(
    'What is the candidate seniority level inferred from their years of experience, scope of ownership, and technical leadership?',
    {
      'Junior': '0 to 2 years, early career, guided execution',
      'Semi-Senior': '2 to 4 years, autonomous feature development',
      'Senior': '5 to 7 years, end-to-end architectural ownership',
      'Lead / Staff': '8+ years, organizational influence, team mentoring, strategic impact',
      'Architect': '10+ years, enterprise systems design, technical direction',
    }
  ),
  has_containerization: noul(
    'Does the candidate have verified experience with Docker, Kubernetes, or containerization?'
  ),
  has_modern_stack: noul(
    'Does the candidate have verified hands-on experience with modern TypeScript and Next.js/React?'
  ),
};

export type CVEvaluationQuestionsType = typeof CV_EVALUATION_QUESTIONS;

/**
 * Ponderaciones canónicas para el perfil Full-Stack Developer
 */
export const WEIGHTS = {
  frontend: 0.25,      // 25%
  backend: 0.25,       // 25%
  database: 0.15,      // 15%
  devops: 0.15,        // 15%
  businessImpact: 0.20 // 20%
} as const;

export const PASSING_SCORE_THRESHOLD = 70;

export type SeniorityLevel = 'Junior' | 'Semi-Senior' | 'Senior' | 'Lead / Staff' | 'Architect';

/**
 * Detalle computado para una categoría individual
 */
export interface CategoryDetail {
  id: 'frontend' | 'backend' | 'database' | 'devops' | 'businessImpact';
  name: string;
  weight: number; // Porcentaje entero (ej. 25)
  score: number;  // 0 - 100 normalizado (score / 4 * 100)
  rawScore: number; // 0 - 4 (puntuación ordinal del Score primitive de JEV)
  confidence: number; // Nivel de certidumbre reportado por JEV (0.0 - 1.0)
  feedback: string;
}

/**
 * Métricas de uso y costo financiero de la llamada a JEV
 */
export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  apiCost: string; // '$0.0034'
  executionTimeMs: number;
}

/**
 * Salida consolidada de la evaluación con TypeSafe AI (JEV)
 */
export interface EvaluationResult {
  candidateName: string;
  yearsOfExperience: number;
  seniorityLevel: SeniorityLevel;
  seniorityConfidence: number;
  summary: string;
  frontendScore: number;
  backendScore: number;
  databaseScore: number;
  devopsScore: number;
  businessImpactScore: number;
  overallScore: number; // Ponderado 0 - 100
  passed: boolean;
  decision: 'Pasa a Entrevista' | 'No Pasa';
  hasContainerizationProb: number;
  hasModernStackProb: number;
  categories: CategoryDetail[];
  detectedSkills: string[];
  missingKeywords: string[];
  highlights: string[];
  metrics: UsageMetrics;
  evaluatedAt: string;
}

/**
 * Entidad de Candidato Mock para procesamiento por lote
 */
export interface Candidate {
  id: string;
  name: string;
  targetRole: string;
  avatarUrl?: string;
  cvText: string;
}

/**
 * Estado reactivo del candidato en la tabla clasificatoria (Leaderboard)
 */
export interface CandidateRowState {
  id: string;
  name: string;
  targetRole: string;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  evaluation?: EvaluationResult;
  error?: string;
}

/**
 * Respuesta genérica de Server Action
 */
export type EvaluationActionResponse =
  | { success: true; data: EvaluationResult }
  | { success: false; error: string };
