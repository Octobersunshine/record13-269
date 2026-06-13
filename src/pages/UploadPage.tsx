import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Download, Info } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import type { UploadResponse } from '../../shared/types';

const UploadPage = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setCurrentDataset = useAppStore((state) => state.setCurrentDataset);
  const setDatasetPreview = useAppStore((state) => state.setDatasetPreview);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('请上传 CSV 格式的文件');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await apiService.uploadFile(file);
      if (result.success) {
        setUploadResult(result);
        setCurrentDataset({
          id: result.datasetId,
          filename: result.filename,
          filePath: '',
          rowCount: result.rowCount,
          columns: result.columns,
          createdAt: Date.now(),
        });
        setDatasetPreview({
          id: result.datasetId,
          filename: result.filename,
          filePath: '',
          rowCount: result.rowCount,
          columns: result.columns,
          sample: result.sample,
          labelDistribution: {},
          createdAt: Date.now(),
        });
      } else {
        setError('上传失败，请检查文件格式');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const sampleData = `text,label
这是一部非常精彩的电影，演员演技出色，剧情紧凑,positive
这部电影太无聊了，浪费时间,negative
这家餐厅的食物美味，服务态度好,positive
产品质量很差，非常失望,negative
今天天气真好，适合出去游玩,positive
这本书内容丰富，值得一读,positive
等待时间太长，服务态度恶劣,negative
这个软件功能强大，界面美观,positive
收到的商品与描述不符，差评,negative
演唱会现场气氛热烈，非常享受,positive
手机续航能力强，拍照清晰,positive
客服回复慢，问题没有解决,negative
旅游景点风景优美，不虚此行,positive
快递速度快，包装完好,positive
衣服质量差，褪色严重,negative
这家咖啡店的咖啡香醇浓郁,positive
电影特效震撼，值得一看,positive
酒店房间脏乱，设施陈旧,negative
学习资源丰富，老师讲解清晰,positive
网购体验差，退货流程复杂,negative`;
    
    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_data.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">数据上传</h1>
          <p className="text-slate-600">
            上传带标签的文本数据，CSV 格式需包含 <code className="px-2 py-1 bg-slate-100 rounded text-indigo-600">text</code> 和 <code className="px-2 py-1 bg-slate-100 rounded text-indigo-600">label</code> 两列
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          <button
            onClick={downloadSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            下载示例数据
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
              : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
          } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-lg font-medium text-slate-700">上传中...</p>
            </div>
          ) : uploadResult ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900">上传成功！</p>
                <p className="text-slate-600 mt-1">
                  文件名: {uploadResult.filename} · {uploadResult.rowCount} 条数据
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900">
                  {isDragging ? '松开鼠标上传文件' : '拖拽文件到此处，或点击上传'}
                </p>
                <p className="text-slate-500 mt-1">支持 CSV 格式，最大 50MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">上传失败</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {uploadResult && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">数据预览</h3>
                </div>
                <span className="text-sm text-slate-500">显示前 10 条</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        text（文本）
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                        label（标签）
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadResult.sample.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-500">{index + 1}</td>
                        <td className="px-6 py-3 text-sm text-slate-700 max-w-md truncate" title={row.text}>
                          {row.text}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {row.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">数据格式说明</p>
                <p className="text-sm text-amber-700 mt-1">
                  CSV 文件必须包含 <code className="px-1.5 py-0.5 bg-amber-100 rounded">text</code> 列（文本内容）和 
                  <code className="px-1.5 py-0.5 bg-amber-100 rounded">label</code> 列（分类标签）。
                  标签数量建议至少 2 类，每类至少 10 条数据以获得较好的训练效果。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setUploadResult(null);
                  setCurrentDataset(null);
                  setDatasetPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                重新上传
              </button>
              <button
                onClick={() => navigate('/train')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                开始训练
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
