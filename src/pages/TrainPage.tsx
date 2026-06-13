import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Target, Crosshair, Zap, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import MetricCard from '@/components/MetricCard';
import ConfusionMatrix from '@/components/ConfusionMatrix';
import type { TrainConfig, TrainStatus as TrainStatusType } from '../../shared/types';

const TrainPage = () => {
  const navigate = useNavigate();
  const { currentDataset, trainStatus, setTrainStatus, setCurrentModelId } = useAppStore();
  const [featureType, setFeatureType] = useState<'tfidf' | 'bow'>('tfidf');
  const [classifierType, setClassifierType] = useState<'multinomial' | 'bernoulli'>('multinomial');
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  const startTraining = async () => {
    if (!currentDataset) {
      setError('请先上传数据');
      return;
    }

    setIsTraining(true);
    setError(null);
    setTrainStatus(null);

    try {
      const config: TrainConfig = {
        datasetId: currentDataset.id,
        featureType,
        classifierType,
        testSize,
        randomState,
      };

      const result = await apiService.startTraining(config);
      if (result.success) {
        setCurrentModelId(result.modelId);
        startPolling(result.modelId);
      } else {
        throw new Error('训练启动失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '训练启动失败，请重试');
      setIsTraining(false);
    }
  };

  const startPolling = useCallback((modelId: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = window.setInterval(async () => {
      try {
        const status = await apiService.getTrainingStatus(modelId);
        setTrainStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollInterval(null);
          setIsTraining(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    setPollInterval(interval);
  }, [pollInterval, setTrainStatus]);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const resetTraining = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setTrainStatus(null);
    setCurrentModelId(null);
    setIsTraining(false);
    setError(null);
  };

  const trainingSteps = [
    { label: '数据加载', progress: 20 },
    { label: '数据集划分', progress: 35 },
    { label: '特征提取', progress: 55 },
    { label: '模型训练', progress: 75 },
    { label: '模型评估', progress: 90 },
    { label: '完成', progress: 100 },
  ];

  const getCurrentStep = (progress: number) => {
    for (let i = trainingSteps.length - 1; i >= 0; i--) {
      if (progress >= trainingSteps[i].progress) {
        return i;
      }
    }
    return 0;
  };

  if (!currentDataset) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">请先上传数据</h2>
          <p className="text-slate-600 mb-6">训练模型前需要先上传带标签的文本数据</p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            前往上传
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
          <h1 className="text-3xl font-bold text-slate-900 mb-3">模型训练</h1>
          <p className="text-slate-600">
            配置训练参数，使用朴素贝叶斯算法训练文本分类器
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">当前数据集</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">文件名</span>
                  <span className="font-medium text-slate-700 truncate max-w-40" title={currentDataset.filename}>
                    {currentDataset.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">数据量</span>
                  <span className="font-medium text-slate-700">{currentDataset.rowCount} 条</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">列名</span>
                  <span className="font-medium text-slate-700">{currentDataset.columns.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">训练参数</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    特征提取方式
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFeatureType('tfidf')}
                      disabled={isTraining}
                      className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        featureType === 'tfidf'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      TF-IDF
                    </button>
                    <button
                      onClick={() => setFeatureType('bow')}
                      disabled={isTraining}
                      className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        featureType === 'bow'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      词袋模型
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    朴素贝叶斯类型
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setClassifierType('multinomial')}
                      disabled={isTraining}
                      className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        classifierType === 'multinomial'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      多项式
                    </button>
                    <button
                      onClick={() => setClassifierType('bernoulli')}
                      disabled={isTraining}
                      className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                        classifierType === 'bernoulli'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      } ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      伯努利
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    测试集比例: {testSize}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    disabled={isTraining}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    随机种子
                  </label>
                  <input
                    type="number"
                    value={randomState}
                    onChange={(e) => setRandomState(parseInt(e.target.value) || 42)}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {!isTraining && !trainStatus?.metrics && (
                  <button
                    onClick={startTraining}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Play className="w-5 h-5" />
                    开始训练
                  </button>
                )}

                {isTraining && (
                  <div className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-100 text-indigo-700 font-semibold rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    训练中...
                  </div>
                )}

                {trainStatus?.metrics && (
                  <div className="flex gap-3">
                    <button
                      onClick={resetTraining}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新训练
                    </button>
                    <button
                      onClick={() => navigate('/predict')}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
                    >
                      开始预测
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isTraining && trainStatus && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">训练进度</h3>
                
                <div className="relative">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${trainStatus.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {trainingSteps.map((step, index) => {
                      const currentStep = getCurrentStep(trainStatus.progress);
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep && trainStatus.status === 'training';
                      
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                              isActive
                                ? isCurrent
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                  : 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {isActive && !isCurrent ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">训练失败</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {trainStatus?.metrics && (
              <>
                <h2 className="text-xl font-bold text-slate-900">模型评估结果</h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="准确率"
                    value={trainStatus.metrics.accuracy}
                    icon={<Target className="w-5 h-5" />}
                    color="indigo"
                  />
                  <MetricCard
                    title="精确率"
                    value={trainStatus.metrics.precision}
                    icon={<Crosshair className="w-5 h-5" />}
                    color="emerald"
                  />
                  <MetricCard
                    title="召回率"
                    value={trainStatus.metrics.recall}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="amber"
                  />
                  <MetricCard
                    title="F1 分数"
                    value={trainStatus.metrics.f1}
                    icon={<Zap className="w-5 h-5" />}
                    color="sky"
                  />
                </div>

                {trainStatus.metrics.confusionMatrix.length > 0 && (
                  <ConfusionMatrix
                    data={trainStatus.metrics.confusionMatrix}
                    labels={trainStatus.metrics.labels}
                  />
                )}
              </>
            )}

            {!isTraining && !trainStatus?.metrics && !error && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">准备开始训练</h3>
                <p className="text-slate-500">
                  调整左侧的训练参数，点击「开始训练」按钮训练模型
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainPage;
