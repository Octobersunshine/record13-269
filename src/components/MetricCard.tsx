import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'sky';
}

const colorClasses = {
  indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
  emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
  sky: 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
};

const iconBgClasses = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
};

const MetricCard = ({ title, value, icon, color }: MetricCardProps) => {
  const percentage = (value * 100).toFixed(1);
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{percentage}%</p>
        </div>
        <div className={`w-12 h-12 ${iconBgClasses[color]} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${iconBgClasses[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: percentage }}
        />
      </div>
    </div>
  );
};

export default MetricCard;
