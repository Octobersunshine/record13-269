import { Link } from 'react-router-dom';
import { Upload, BarChart3, Sparkles, ArrowRight, Zap, Shield, Layers } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Upload,
      title: '数据上传',
      description: '轻松上传带标签的 CSV 文本数据，支持格式校验和数据预览，让您快速开始训练。',
      path: '/upload',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
    },
    {
      icon: BarChart3,
      title: '模型训练',
      description: '使用朴素贝叶斯算法训练分类器，支持 TF-IDF 和词袋特征，实时查看训练进度和评估指标。',
      path: '/train',
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-200',
    },
    {
      icon: Sparkles,
      title: '文本预测',
      description: '输入任意文本进行分类预测，查看预测类别和置信度，支持批量文本预测。',
      path: '/predict',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
    },
  ];

  const highlights = [
    { icon: Zap, title: '快速高效', desc: '基于 Scikit-learn 优化实现，训练速度快，预测即时响应' },
    { icon: Shield, title: '数据安全', desc: '所有数据本地存储，不上传云端，保护您的数据隐私' },
    { icon: Layers, title: '多维度评估', desc: '提供准确率、精确率、召回率、F1 分数和混淆矩阵' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            基于 Python + Scikit-learn
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            智能文本分类
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              无需代码，一键实现
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            上传带标签的文本数据，训练朴素贝叶斯分类器，对新文本进行智能分类预测。
            为数据分析和机器学习初学者提供简单易用的文本分类解决方案。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/upload"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              开始使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/train"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-300"
            >
              了解更多
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.path}
                className={`group bg-gradient-to-br ${feature.bgColor} rounded-2xl p-8 border ${feature.borderColor} hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center gap-2 text-indigo-600 font-medium">
                  立即体验
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 lg:p-12 text-white mb-20">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10">核心优势</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-indigo-100">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">使用流程</h2>
          <p className="text-slate-600 mb-8">三步完成文本分类模型的训练和应用</p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {['上传数据', '训练模型', '预测文本'].map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-700">{step}</span>
                </div>
                {index < 2 && <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
