interface ConfusionMatrixProps {
  data: number[][];
  labels: string[];
}

const ConfusionMatrix = ({ data, labels }: ConfusionMatrixProps) => {
  const maxValue = Math.max(...data.flat());

  const getColor = (value: number) => {
    if (maxValue === 0) return 'bg-indigo-100';
    const intensity = value / maxValue;
    if (intensity >= 0.75) return 'bg-indigo-600 text-white';
    if (intensity >= 0.5) return 'bg-indigo-500 text-white';
    if (intensity >= 0.25) return 'bg-indigo-400 text-white';
    return 'bg-indigo-100 text-indigo-900';
  };

  const getCellBgOpacity = (value: number) => {
    if (maxValue === 0) return 0.1;
    return 0.15 + (value / maxValue) * 0.85;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">混淆矩阵</h3>
      
      <div className="overflow-x-auto">
        <div className="flex">
          <div className="flex flex-col">
            <div className="h-10" />
            <div className="flex items-center justify-center px-2 h-14 text-xs font-medium text-slate-500 transform -rotate-0">
              <span className="writing-vertical">真实标签 →</span>
            </div>
            {labels.map((label, i) => (
              <div
                key={i}
                className="h-14 flex items-center justify-end pr-3 text-sm font-medium text-slate-600"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex-1">
            <div className="text-center text-xs font-medium text-slate-500 mb-2">
              ↓ 预测标签
            </div>
            <div className="flex">
              {labels.map((label, j) => (
                <div
                  key={j}
                  className="flex-1 h-14 flex items-center justify-center text-sm font-medium text-slate-600 border-b-2 border-slate-200"
                >
                  {label}
                </div>
              ))}
            </div>
            
            {data.map((row, i) => (
              <div key={i} className="flex">
                {row.map((value, j) => (
                  <div
                    key={j}
                    className={`flex-1 h-14 flex items-center justify-center text-sm font-semibold border-r border-b border-slate-200 transition-all hover:scale-105 ${getColor(value)}`}
                    style={{ backgroundColor: i === j ? `rgba(16, 185, 129, ${getCellBgOpacity(value)})` : undefined }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-xs">正确预测</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200" />
          <span className="text-xs">错误预测</span>
        </div>
        <div className="w-32 h-4 rounded bg-gradient-to-r from-indigo-100 via-indigo-400 to-indigo-600" />
        <span className="text-xs">预测数量: 少 → 多</span>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
