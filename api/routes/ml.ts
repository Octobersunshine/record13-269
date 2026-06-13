import { Router, Request, Response } from 'express';
import { mlService } from '../services/mlClient.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await mlService.healthCheck();
    res.json(result);
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'ML service unavailable',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/datasets', async (req: Request, res: Response) => {
  try {
    const result = await mlService.getDatasets();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch datasets'
    });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    
    const result = await mlService.uploadFileBuffer(fileBuffer, fileName, mimeType);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

router.get('/datasets/:id/preview', async (req: Request, res: Response) => {
  try {
    const result = await mlService.getDatasetPreview(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Dataset not found'
    });
  }
});

router.post('/train', async (req: Request, res: Response) => {
  try {
    const result = await mlService.startTraining(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Training failed to start'
    });
  }
});

router.get('/train/:id/status', async (req: Request, res: Response) => {
  try {
    const result = await mlService.getTrainingStatus(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Model not found'
    });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const result = await mlService.getModels();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch models'
    });
  }
});

router.get('/models/:id/metrics', async (req: Request, res: Response) => {
  try {
    const result = await mlService.getModelMetrics(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Model not found'
    });
  }
});

router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { modelId, text } = req.body;
    const result = await mlService.predict(modelId, text);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Prediction failed'
    });
  }
});

router.post('/predict/batch', async (req: Request, res: Response) => {
  try {
    const { modelId, texts } = req.body;
    const result = await mlService.predictBatch(modelId, texts);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch prediction failed'
    });
  }
});

router.post('/models/:id/incremental', async (req: Request, res: Response) => {
  try {
    const result = await mlService.incrementalTrain(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Incremental training failed'
    });
  }
});

router.post('/models/:id/evaluate', async (req: Request, res: Response) => {
  try {
    const { texts, labels } = req.body;
    const result = await mlService.evaluateModel(req.params.id, texts, labels);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Model evaluation failed'
    });
  }
});

export default router;
