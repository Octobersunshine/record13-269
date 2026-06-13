import { create } from 'zustand';
import type {
  Dataset,
  DatasetPreview,
  TrainStatus,
  PredictResponse,
  BatchPredictResult,
} from '../../shared/types';

interface AppState {
  currentDataset: Dataset | null;
  datasetPreview: DatasetPreview | null;
  currentModelId: string | null;
  trainStatus: TrainStatus | null;
  selectedModelId: string | null;
  lastPrediction: PredictResponse | null;
  batchPredictions: BatchPredictResult[];
  
  setCurrentDataset: (dataset: Dataset | null) => void;
  setDatasetPreview: (preview: DatasetPreview | null) => void;
  setCurrentModelId: (id: string | null) => void;
  setTrainStatus: (status: TrainStatus | null) => void;
  setSelectedModelId: (id: string | null) => void;
  setLastPrediction: (prediction: PredictResponse | null) => void;
  setBatchPredictions: (predictions: BatchPredictResult[]) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDataset: null,
  datasetPreview: null,
  currentModelId: null,
  trainStatus: null,
  selectedModelId: null,
  lastPrediction: null,
  batchPredictions: [],

  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),
  setDatasetPreview: (preview) => set({ datasetPreview: preview }),
  setCurrentModelId: (id) => set({ currentModelId: id }),
  setTrainStatus: (status) => set({ trainStatus: status }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  setLastPrediction: (prediction) => set({ lastPrediction: prediction }),
  setBatchPredictions: (predictions) => set({ batchPredictions: predictions }),
  clearAll: () => set({
    currentDataset: null,
    datasetPreview: null,
    currentModelId: null,
    trainStatus: null,
    selectedModelId: null,
    lastPrediction: null,
    batchPredictions: [],
  }),
}));
