import axios from 'axios';
import type {
  UploadResponse,
  TrainConfig,
  TrainResponse,
  TrainStatus,
  PredictResponse,
  BatchPredictResponse,
  Dataset,
  DatasetPreview,
  ModelInfo,
} from '../../shared/types';

const API_BASE_URL = '/api/ml';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export const apiService = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getDatasets(): Promise<{ success: boolean; datasets: Dataset[] }> {
    const response = await apiClient.get('/datasets');
    return response.data;
  },

  async getDatasetPreview(datasetId: string): Promise<{ success: boolean } & DatasetPreview> {
    const response = await apiClient.get(`/datasets/${datasetId}/preview`);
    return response.data;
  },

  async startTraining(config: TrainConfig): Promise<TrainResponse> {
    const response = await apiClient.post('/train', config);
    return response.data;
  },

  async getTrainingStatus(modelId: string): Promise<{ success: boolean } & TrainStatus> {
    const response = await apiClient.get(`/train/${modelId}/status`);
    return response.data;
  },

  async getModels(): Promise<{ success: boolean; models: ModelInfo[] }> {
    const response = await apiClient.get('/models');
    return response.data;
  },

  async getModelMetrics(modelId: string): Promise<{ success: boolean; metrics: any }> {
    const response = await apiClient.get(`/models/${modelId}/metrics`);
    return response.data;
  },

  async predict(modelId: string, text: string): Promise<PredictResponse> {
    const response = await apiClient.post('/predict', { modelId, text });
    return response.data;
  },

  async predictBatch(modelId: string, texts: string[]): Promise<BatchPredictResponse> {
    const response = await apiClient.post('/predict/batch', { modelId, texts });
    return response.data;
  },
};

export default apiService;
