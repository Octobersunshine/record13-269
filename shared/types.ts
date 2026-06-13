export interface Dataset {
  id: string;
  filename: string;
  filePath: string;
  rowCount: number;
  columns: string[];
  createdAt: number;
}

export interface DatasetPreview extends Dataset {
  sample: Array<{ text: string; label: string }>;
  labelDistribution: Record<string, number>;
}

export interface UploadResponse {
  success: boolean;
  datasetId: string;
  filename: string;
  rowCount: number;
  columns: string[];
  sample: Array<{ text: string; label: string }>;
}

export interface TrainConfig {
  datasetId: string;
  featureType: 'tfidf' | 'bow';
  classifierType: 'multinomial' | 'bernoulli';
  testSize: number;
  randomState: number;
  useStopwords: boolean;
  useChineseTokenization: boolean;
  ngramRange: [number, number];
  maxFeatures: number;
}

export interface TrainResponse {
  success: boolean;
  modelId: string;
  status: 'training' | 'completed' | 'failed';
}

export interface TrainingConfig {
  useStopwords: boolean;
  useChineseTokenization: boolean;
  ngramRange: [number, number];
  maxFeatures: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: number[][];
  labels: string[];
  vocabularySize: number;
  topFeatures: string[];
}

export interface TrainStatus {
  modelId: string;
  status: 'training' | 'completed' | 'failed';
  progress: number;
  message?: string;
  metrics?: ModelMetrics;
  config?: TrainingConfig;
}

export interface ModelInfo {
  id: string;
  datasetId: string;
  status: 'training' | 'completed' | 'failed';
  accuracy?: number;
  createdAt: number;
}

export interface PredictRequest {
  modelId: string;
  text: string;
}

export interface TopKPrediction {
  label: string;
  probability: number;
}

export interface PredictResponse {
  success: boolean;
  predictedLabel: string;
  confidence: number;
  topK: TopKPrediction[];
}

export interface BatchPredictRequest {
  modelId: string;
  texts: string[];
}

export interface BatchPredictResult {
  text: string;
  predictedLabel: string;
  confidence: number;
  topK: TopKPrediction[];
}

export interface BatchPredictResponse {
  success: boolean;
  predictions: BatchPredictResult[];
}

export interface IncrementalTrainRequest {
  datasetId?: string;
  texts?: string[];
  labels?: string[];
}

export interface IncrementalTrainResponse {
  success: boolean;
  modelId: string;
  samplesAdded: number;
  totalSamples: number;
  incrementalCount: number;
  classes: string[];
}

export interface EvaluateResponse {
  success: boolean;
  modelId: string;
  metrics: ModelMetrics;
  sampleCount: number;
}

export interface AppState {
  currentDataset: Dataset | null;
  datasetPreview: DatasetPreview | null;
  currentModelId: string | null;
  trainStatus: TrainStatus | null;
  selectedModelId: string | null;
  lastPrediction: PredictResponse | null;
  batchPredictions: BatchPredictResult[];
}
