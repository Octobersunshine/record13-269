import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000,
});

export interface UploadResult {
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
}

export interface TrainResult {
  success: boolean;
  modelId: string;
  status: 'training' | 'completed' | 'failed';
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: number[][];
  labels: string[];
}

export interface TrainStatusResult {
  success: boolean;
  modelId: string;
  status: 'training' | 'completed' | 'failed';
  progress: number;
  metrics?: ModelMetrics;
}

export interface PredictResult {
  success: boolean;
  predictedLabel: string;
  confidence: number;
  topK: Array<{ label: string; probability: number }>;
}

export interface BatchPredictResult {
  success: boolean;
  predictions: Array<{
    text: string;
    predictedLabel: string;
    confidence: number;
    topK: Array<{ label: string; probability: number }>;
  }>;
}

export const mlService = {
  async healthCheck() {
    const response = await mlClient.get('/health');
    return response.data;
  },

  async uploadFileBuffer(buffer: Buffer, filename: string, mimetype: string): Promise<UploadResult> {
    const formData = new FormData();
    const fileStream = Readable.from(buffer);
    formData.append('file', fileStream, {
      filename,
      contentType: mimetype,
    });
    
    const response = await mlClient.post('/api/upload', formData, {
      headers: formData.getHeaders(),
    });
    return response.data;
  },

  async getDatasets() {
    const response = await mlClient.get('/api/datasets');
    return response.data;
  },

  async getDatasetPreview(datasetId: string) {
    const response = await mlClient.get(`/api/datasets/${datasetId}/preview`);
    return response.data;
  },

  async startTraining(config: TrainConfig): Promise<TrainResult> {
    const response = await mlClient.post('/api/train', config);
    return response.data;
  },

  async getTrainingStatus(modelId: string): Promise<TrainStatusResult> {
    const response = await mlClient.get(`/api/train/${modelId}/status`);
    return response.data;
  },

  async getModels() {
    const response = await mlClient.get('/api/models');
    return response.data;
  },

  async getModelMetrics(modelId: string) {
    const response = await mlClient.get(`/api/models/${modelId}/metrics`);
    return response.data;
  },

  async predict(modelId: string, text: string): Promise<PredictResult> {
    const response = await mlClient.post('/api/predict', { modelId, text });
    return response.data;
  },

  async predictBatch(modelId: string, texts: string[]): Promise<BatchPredictResult> {
    const response = await mlClient.post('/api/predict/batch', { modelId, texts });
    return response.data;
  },
};

export default mlClient;
