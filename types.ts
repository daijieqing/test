import React from 'react';

export enum IndicatorType {
  QUANTITATIVE = 'Quantitative', // 定量
  QUALITATIVE = 'Qualitative'    // 定性
}

export enum DataSource {
  AUTO = 'System Auto-Collect', // 系统自动采集
  MANUAL = 'Manual Entry',      // 人工录入
  CALCULATED = 'Calculated'     // 公式计算
}

export interface Indicator {
  id: string;
  name: string;
  description: string;
  type: IndicatorType;
  source: DataSource;
  status: boolean; // true = Enabled, false = Disabled
  category: string;
  // New fields for calculation logic
  calculationType?: 'visual' | 'code';
  calculationScript?: string;
  // New fields for display and configuration context
  unit?: string; // Unit of measurement (e.g., %, MB, times)
  sampleValue?: string | number; // Example value for preview
}

export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
  isOpen?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  hasSubmenu?: boolean;
  isNew?: boolean;
  children?: NavItem[];
}

// --- New Types for Model Management ---

export type ScoringMethod = 'WEIGHTED' | 'SUM'; // 加权求和 | 评分累加

export interface GradeLevel {
  id: string;
  name: string; // e.g., 优秀, 良好
  minScore: number;
  maxScore: number;
  color: string; // For UI display
}

// --- Detailed Scoring Rule Types ---
export type ScoringRuleType = 'THRESHOLD' | 'RATIO' | 'GRADE_MAP' | 'DEDUCTION' | 'BONUS';

export interface ThresholdItem {
  id: string;
  operator: '<' | '<=' | '>' | '>=' | 'range';
  value1: number;
  value2?: number; // Used if operator is 'range'
  score: number;
}

export interface GradeMapItem {
  id: string;
  gradeName: string; // e.g. "Excellent"
  score: number;
}

export interface RuleConfig {
  // Common
  fullScore?: number; // Reference full score for this indicator
  
  // Threshold Rule
  thresholds?: ThresholdItem[];
  
  // Ratio Rule
  // Formula: Score = (Value / Target) * FullScore * Coefficient
  ratioType?: 'PROPORTIONAL' | 'DEDUCTION'; // 正向占比 | 反向扣分
  ratioBase?: number; // Base score for deduction (e.g. 100)
  ratioCoefficient?: number; 
  ratioMin?: number; // Floor
  ratioMax?: number; // Ceiling
  
  // Grade Map Rule
  gradeMapping?: GradeMapItem[];
  
  // Deduction Rule
  // Formula: Score = BaseScore - (Count * DeductionPerUnit)
  deductionBase?: number;
  deductionPerUnit?: number;
  deductionMin?: number; // Lowest possible score
  
  // Bonus Rule
  // Formula: If Value >= Trigger, Score = Base + ((Value - Trigger)/Step * BonusPerStep)
  bonusTrigger?: number; // e.g. 110%
  bonusPerUnit?: number; // e.g. 2 points
  bonusCap?: number; // Max extra points
}

export interface ModelIndicatorConfig {
  indicatorId: string;
  weight?: number; // For Weighted method (0-100)
  maxScore?: number; // For Sum method (or as base for weighted calc)
  ruleType?: ScoringRuleType;
  ruleConfig?: RuleConfig;
  scoringRuleDesc?: string; // 评分规则说明
  enableEvidence?: boolean; // Whether to show upload button
  requireEvidence?: boolean; // Whether upload is mandatory (requires enableEvidence=true)
}

export interface EvaluationModel {
  id: string;
  name: string;
  version: string;
  tags: string[];
  description: string;
  scoringMethod: ScoringMethod;
  indicators: ModelIndicatorConfig[];
  gradeLevels: GradeLevel[];
  enableGradeLevels?: boolean; // Optional: Enable/Disable grade level evaluation
  lastUpdated: string;
  status: 'active' | 'draft' | 'archived';
}

// --- Data Channel Types ---

export type ConnectionType = 'DATABASE' | 'API' | 'FILE_SERVER';

export interface DataConnection {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  status: 'connected' | 'error' | 'disconnected';
  lastSync: string;
  description: string;
  // Extended Configuration
  syncFrequency?: 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
  config?: {
    port?: string;
    username?: string;
    password?: string;
    dbName?: string;
    apiKey?: string;
    authType?: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY';
    tableWhitelist?: string;
  };
}

export interface ArchiveVersion {
  id: string;
  version: string;
  date: string;
  description: string;
  operator: string;
  isCurrent: boolean;
}

export interface DataArchive {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  versions: ArchiveVersion[];
}

export interface DataRecord {
  id: string;
  objectName: string; // e.g. 市财政局
  indicatorName: string; // e.g. 云资源使用率
  value: string | number;
  unit: string;
  collectionTime: string;
  batchId: string; // e.g. 2024-W20
  sourceId: string; // Links to DataConnection.id
  status: 'valid' | 'invalid';
  metadata: string; // JSON string of raw data
}