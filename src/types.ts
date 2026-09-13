export interface ConversionRule {
  id: string;
  category: 'server' | 'fs' | 'env' | 'storage' | 'crypto';
  denoApi: string;
  nodeReplacement: string;
  description: string;
  exampleDeno: string;
  exampleNode: string;
}

export interface CompatibilityCheck {
  id: string;
  target: string;
  status: 'migrated' | 'in-progress' | 'unsupported' | 'ready';
  detail: string;
}

export interface MigrationSummary {
  repoName: string;
  repoUrl: string;
  description: string;
  license: string;
  runtimeSource: string;
  runtimeTarget: string;
  port: number;
  host: string;
}
