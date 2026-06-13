import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Layers, ArrowRight, AlertTriangle, Loader2, Copy, Check, ListTodo } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import type { PredictResponse, BatchPredictResult, ModelInfo } from '../../shared/types';

const PredictPage = () => {
  const navigate = useNavigate();
  const { currentModelId, selectedModelId, setSelectedModelId, lastPrediction, setLastPrediction, batchPredictions, setBatchPredictions } = useAppStore();
  
  const [inputText, setInputText] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [isBatchPredicting, setIsBatchPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const activeModelId = selectedModelId || currentModelId;

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const result = await apiService.getModels();
      if (result.success) {
        setModels(result.models);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };

  const predictSingle = async () => {
    if (!activeModelId) {
      setError('请先训练模型');
      return;
    }
    if (!inputText.trim()) {
      setError('请输入要预测的文本');
      return;
    }

    setIsPredicting(true);
    setError(null);
    setLastPrediction(null);

    try {
      const result = await apiService.predict(activeModelId, inputText.trim());
      setLastPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '预测失败，请重试');
    } finally {
      setIsPredicting(false);
    }
  };

  const predictBatch = async () => {
    if (!activeModelId) {
      setBatchError('请先训练模型');
      return;
    }
    if (!batchInput.trim()) {
      setBatchError('请输入要预测的文本，每行一条');
      return;
    }

    const texts = batchInput.split('\n').filter(t => t.trim());
    if (texts.length === 0) {
      setBatchError('请输入至少一条有效文本');
      return;
    }
    if (texts.length > 100) {
      setBatchError('批量预测最多支持 100 条文本');
      return;
    }

    setIsBatchPredicting(true);
    setBatchError(null);
    setBatchPredictions([]);

    try {
      const result = await apiService.predictBatch(activeModelId, texts);
      setBatchPredictions(result.predictions);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : '批量预测失败，请重试');
    } finally {
      setIsBatchPredicting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500';
    if (confidence >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getLabelColor = (label: string) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-sky-100 text-sky-700',
      'bg-purple-100 text-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!activeModelId && models.filter(m => m.status === 'completed').length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">请先训练模型</h2>
          <p className="text-slate-600 mb-6">进行文本预测前需要先训练一个分类模型</p>
          <button
            onClick={() => navigate('/train')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            前往训练
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">文本预测</h1>
          <p className="text-slate-600">
            输入文本，使用训练好的朴素贝叶斯模型进行分类预测
          </p>
        </div>

        {models.filter(m => m.status === 'completed').length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">选择模型</label>
            <select
              value={activeModelId || ''}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              {models
                .filter(m => m.status === 'completed')
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    模型 {model.id.slice(0, 8)}... 
                    {model.accuracy !== undefined && ` (准确率: ${(model.accuracy * 100).toFixed(1)}%)`}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'single'
                      ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    单文本预测
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === 'batch'
                      ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    批量预测
                  </div>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'single' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        输入要预测的文本
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="请输入要分类的文本内容..."
                        rows={5}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={predictSingle}
                      disabled={isPredicting || !inputText.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isPredicting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          预测中...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          开始预测
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        输入要预测的文本（每行一条，最多 100 条）
                      </label>
                      <textarea
                        value={batchInput}
                        onChange={(e) => setBatchInput(e.target.value)}
                        placeholder={"这是第一条要预测的文本\n这是第二条要预测的文本\n这是第三条要预测的文本"}
                        rows={8}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>
                        已输入 {batchInput.split('\n').filter(t => t.trim()).length} 条文本
                      </span>
                      <button
                        onClick={() => setBatchInput('')}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        清空
                      </button>
                    </div>

                    {batchError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{batchError}</p>
                      </div>
                    )}

                    <button
                      onClick={predictBatch}
                      disabled={isBatchPredicting || !batchInput.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isBatchPredicting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          批量预测中...
                        </>
                      ) : (
                        <>
                          <Layers className="w-5 h-5" />
                          开始批量预测
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'single' && lastPrediction && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-fade-in-up">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  预测结果
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">预测类别</p>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-4 py-2 text-lg font-bold rounded-xl ${getLabelColor(lastPrediction.predictedLabel)}`}>
                        {lastPrediction.predictedLabel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-500">置信度</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {(lastPrediction.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getConfidenceColor(lastPrediction.confidence)} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${lastPrediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {lastPrediction.topK.length > 1 && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-3">Top-K 候选</p>
                      <div className="space-y-2">
                        {lastPrediction.topK.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className={`text-sm font-medium w-6 h-6 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium ${getLabelColor(item.label)}`}>
                              {item.label}
                            </span>
                            <span className="text-sm font-medium text-slate-600 w-16 text-right">
                              {(item.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'batch' && batchPredictions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    批量预测结果
                  </h3>
                  <span className="text-sm text-slate-500">
                    共 {batchPredictions.length} 条
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          预测结果
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
                          置信度
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchPredictions.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 text-sm text-slate-500 align-top">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p className="text-sm text-slate-700 mb-2 max-w-xs truncate" title={item.text}>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${getLabelColor(item.predictedLabel)}`}>
                                {item.predictedLabel}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.predictedLabel, `batch-${index}`)}
                                className="p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="复制标签"
                              >
                                {copied === `batch-${index}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <span className={`text-sm font-semibold ${
                              item.confidence >= 0.8 ? 'text-emerald-600' :
                              item.confidence >= 0.6 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {(item.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'single' && !lastPrediction && !isPredicting && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">输入文本进行预测</h3>
                <p className="text-slate-500 text-sm">
                  在左侧输入框中输入文本，点击「开始预测」按钮获取分类结果
                </p>
              </div>
            )}

            {activeTab === 'batch' && batchPredictions.length === 0 && !isBatchPredicting && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">输入多条文本进行批量预测</h3>
                <p className="text-slate-500 text-sm">
                  在左侧输入框中每行输入一条文本，点击「开始批量预测」按钮
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictPage;
