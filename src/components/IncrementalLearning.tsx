import { useState } from 'react';
import { Upload, Plus, CheckCircle2, AlertTriangle, Loader2, Database, FileText, Layers } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import type { Dataset } from '../../shared/types';

interface IncrementalLearningProps {
  modelId: string;
  onSuccess?: () => void;
}

const IncrementalLearning = ({ modelId, onSuccess }: IncrementalLearningProps) => {
  const { setIncrementalResult, incrementalResult } = useAppStore();
  const [mode, setMode] = useState<'upload' | 'manual' | 'dataset'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [manualTexts, setManualTexts] = useState('');
  const [manualLabels, setManualLabels] = useState('');
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  const loadDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const result = await apiService.getDatasets();
      if (result.success) {
        setDatasets(result.datasets);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const uploadResult = await apiService.uploadFile(file);
      if (uploadResult.success) {
        const result = await apiService.incrementalTrain(modelId, { datasetId: uploadResult.datasetId });
        if (result.success) {
          setIncrementalResult(result);
          onSuccess?.();
        } else {
          throw new Error('增量训练失败');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '增量训练失败');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleManualTrain = async () => {
    if (!manualTexts.trim() || !manualLabels.trim()) {
      setError('请输入文本和标签');
      return;
    }

    const texts = manualTexts.split('\n').map(t => t.trim()).filter(t => t);
    const labels = manualLabels.split('\n').map(l => l.trim()).filter(l => l);

    if (texts.length !== labels.length) {
      setError(`文本数量 (${texts.length}) 和标签数量 (${labels.length}) 不一致`);
      return;
    }

    if (texts.length === 0) {
      setError('请至少输入一条训练数据');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await apiService.incrementalTrain(modelId, { texts, labels });
      if (result.success) {
        setIncrementalResult(result);
        onSuccess?.();
        setManualTexts('');
        setManualLabels('');
      } else {
        throw new Error('增量训练失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '增量训练失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDatasetTrain = async () => {
    if (!selectedDatasetId) {
      setError('请选择一个数据集');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await apiService.incrementalTrain(modelId, { datasetId: selectedDatasetId });
      if (result.success) {
        setIncrementalResult(result);
        onSuccess?.();
      } else {
        throw new Error('增量训练失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '增量训练失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">增量学习</h3>
          <p className="text-sm text-slate-500">使用新数据更新模型，无需全量重训</p>
        </div>
      </div>

      {incrementalResult && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-800">增量训练成功</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-emerald-600">新增样本:</span>
                  <span className="ml-2 font-semibold text-emerald-800">{incrementalResult.samplesAdded}</span>
                </div>
                <div>
                  <span className="text-emerald-600">总样本数:</span>
                  <span className="ml-2 font-semibold text-emerald-800">{incrementalResult.totalSamples}</span>
                </div>
                <div>
                  <span className="text-emerald-600">增量次数:</span>
                  <span className="ml-2 font-semibold text-emerald-800">{incrementalResult.incrementalCount}</span>
                </div>
                <div>
                  <span className="text-emerald-600">支持类别:</span>
                  <span className="ml-2 font-semibold text-emerald-800">{incrementalResult.classes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { setMode('upload'); setError(null); }}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
              mode === 'upload'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-1.5" />
            上传文件
          </button>
          <button
            onClick={() => { setMode('manual'); setError(null); }}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
              mode === 'manual'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Plus className="w-4 h-4 inline-block mr-1.5" />
            手动输入
          </button>
          <button
            onClick={() => { 
              setMode('dataset'); 
              setError(null); 
              if (datasets.length === 0) loadDatasets();
            }}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
              mode === 'dataset'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Database className="w-4 h-4 inline-block mr-1.5" />
            选择数据集
          </button>
        </div>
      </div>

      {mode === 'upload' && (
        <div className="space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">点击或拖拽上传 CSV 文件</p>
              <p className="text-xs text-slate-500">格式: text, label 两列</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
                id="incremental-file-upload"
              />
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </label>
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-3 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">正在处理增量数据...</span>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline-block mr-1.5 text-slate-400" />
              文本 (每行一条)
            </label>
            <textarea
              value={manualTexts}
              onChange={(e) => setManualTexts(e.target.value)}
              disabled={isProcessing}
              placeholder="这个产品质量非常好&#10;完全不值得购买&#10;用起来很顺手"
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline-block mr-1.5 text-slate-400" />
              标签 (每行一个，与文本对应)
            </label>
            <textarea
              value={manualLabels}
              onChange={(e) => setManualLabels(e.target.value)}
              disabled={isProcessing}
              placeholder="正面&#10;负面&#10;正面"
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleManualTrain}
            disabled={isProcessing || !manualTexts.trim() || !manualLabels.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                增量训练中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                开始增量学习
              </>
            )}
          </button>
        </div>
      )}

      {mode === 'dataset' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Database className="w-4 h-4 inline-block mr-1.5 text-slate-400" />
              选择已有数据集
            </label>
            {loadingDatasets ? (
              <div className="flex items-center gap-2 py-8 justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>加载数据集中...</span>
              </div>
            ) : datasets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl">
                <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">暂无数据集</p>
                <p className="text-xs text-slate-400 mt-1">请先到上传页面上传数据</p>
              </div>
            ) : (
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 bg-white"
              >
                <option value="">请选择数据集</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.filename} ({ds.rowCount} 条)
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleDatasetTrain}
            disabled={isProcessing || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                增量训练中...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                开始增量学习
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">增量训练失败</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">增量学习说明</h4>
        <ul className="text-xs text-slate-500 space-y-1.5">
          <li>• 增量学习使用 <code className="px-1.5 py-0.5 bg-slate-200 rounded">partial_fit</code> 方法，无需全量重训</li>
          <li>• 新数据的标签必须与原模型训练时的标签一致</li>
          <li>• 如果有新标签类别，请使用全量重新训练</li>
          <li>• 建议每次增量数据量不少于 10 条以获得较好效果</li>
        </ul>
      </div>
    </div>
  );
};

export default IncrementalLearning;
