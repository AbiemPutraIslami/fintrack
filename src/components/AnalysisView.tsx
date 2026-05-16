import React, { useState, useMemo } from 'react';
import { Transaction, Account } from '../types/finance';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, eachMonthOfInterval, startOfYear, endOfYear, getMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

interface AnalysisViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categoryIcons: Record<string, string>;
}

export function AnalysisView({ transactions, accounts, categoryIcons }: AnalysisViewProps) {
  const [timeRange, setTimeRange] = useState<'6m' | '1y' | 'all'>('6m');

  const {
    monthlyTrends,
    categoryBreakdown,
    netWorthTrend
  } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (timeRange === '6m') {
      startDate = startOfMonth(subMonths(now, 5));
    } else if (timeRange === '1y') {
      startDate = startOfMonth(subMonths(now, 11));
    } else {
      // Find the earliest transaction date
      if (transactions.length > 0) {
        const earliest = transactions.reduce((min, tx) => {
          const txDate = parseISO(tx.date);
          return txDate < min ? txDate : min;
        }, new Date());
        startDate = startOfMonth(earliest);
      } else {
        startDate = startOfMonth(now);
      }
    }

    const endDate = endOfMonth(now);
    
    const relevantTransactions = transactions.filter(tx => {
      const d = parseISO(tx.date);
      return isWithinInterval(d, { start: startDate, end: endDate });
    });

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // 1. Monthly Trends (Income vs Expense)
    const monthlyTrends = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      let income = 0;
      let expense = 0;
      
      relevantTransactions.forEach(tx => {
        const txDate = parseISO(tx.date);
        if (isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
          if (tx.type === 'income') income += tx.amount;
          if (tx.type === 'expense') expense += tx.amount;
          if (tx.type === 'transfer' && tx.transferCharge) expense += tx.transferCharge;
        }
      });
      
      return {
        month: format(month, 'MMM yy', { locale: id }),
        Pemasukan: income,
        Pengeluaran: expense,
      };
    });

    // 2. Category Breakdown (Expenses only for the selected period)
    const expenseByCategory: Record<string, number> = {};
    relevantTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      }
    });

    const categoryBreakdown = Object.keys(expenseByCategory)
      .map(category => ({
        name: category,
        value: expenseByCategory[category]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // top 8 categories

    // 3. Net Worth Trend
    // We need to calculate running balance.
    // Initial balance sum:
    const initialTotal = accounts.reduce((sum, acc) => sum + (acc.initialBalance || 0), 0);
    
    // We need all transactions from the beginning of time until the end of each month
    let runningBalance = initialTotal;
    
    // Calculate running balance until just before startDate
    const prePeriodTransactions = transactions.filter(tx => parseISO(tx.date) < startDate);
    prePeriodTransactions.forEach(tx => {
      if (tx.type === 'income') runningBalance += tx.amount;
      if (tx.type === 'expense') runningBalance -= tx.amount;
      if (tx.type === 'transfer' && tx.transferCharge) runningBalance -= tx.transferCharge;
    });

    const netWorthTrend = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      relevantTransactions.forEach(tx => {
        const txDate = parseISO(tx.date);
        if (isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
          if (tx.type === 'income') runningBalance += tx.amount;
          if (tx.type === 'expense') runningBalance -= tx.amount;
          if (tx.type === 'transfer' && tx.transferCharge) runningBalance -= tx.transferCharge;
        }
      });
      
      return {
        month: format(month, 'MMM yy', { locale: id }),
        'Kekayaan Bersih': runningBalance,
      };
    });

    return { monthlyTrends, categoryBreakdown, netWorthTrend };
  }, [transactions, accounts, timeRange]);

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 tracking-tight">Analisis Keuangan</h2>
          <p className="text-slate-400 text-sm mt-1">Wawasan dan pola keuangan Anda dari waktu ke waktu</p>
        </div>
        
        <div className="flex bg-slate-700/50 p-1 rounded-xl">
          <button 
            onClick={() => setTimeRange('6m')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeRange === '6m' ? 'bg-[#1e293b] text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-50'}`}
          >
            6 Bulan
          </button>
          <button 
            onClick={() => setTimeRange('1y')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeRange === '1y' ? 'bg-[#1e293b] text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-50'}`}
          >
            1 Tahun
          </button>
          <button 
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeRange === 'all' ? 'bg-[#1e293b] text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-50'}`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
            <LucideIcons.LineChart className="w-5 h-5 text-indigo-500" />
            Tren Kekayaan Bersih
          </h3>
          <div className="h-72">
            <ResponsiveContainer width={100} height={100}>
              <LineChart data={netWorthTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis 
                  tickFormatter={(val) => `Rp ${val / 1000000}M`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  width={60} 
                />
                <Tooltip 
                  formatter={(value: number) => formatter.format(value)}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Kekayaan Bersih" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Income vs Expense */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
            <LucideIcons.BarChart2 className="w-5 h-5 text-emerald-500" />
            Pemasukan vs Pengeluaran
          </h3>
          <div className="h-72">
            <ResponsiveContainer width={100} height={100}>
              <BarChart data={monthlyTrends} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis 
                  tickFormatter={(val) => `Rp ${val / 1000000}M`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => formatter.format(value)}
                  cursor={{fill: '#334155'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
            <LucideIcons.PieChart className="w-5 h-5 text-rose-400" />
            Pola Pengeluaran Top 8
          </h3>
          
          {categoryBreakdown.length > 0 ? (
            <div className="flex flex-col h-72">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatter.format(value)}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4 max-h-24 overflow-y-auto">
                {categoryBreakdown.map((entry, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-slate-400 truncate flex-1 mr-1">{entry.name}</span>
                    <span className="font-medium text-slate-50 shrink-0">
                      {Math.round((entry.value / categoryBreakdown.reduce((a,b)=>a+b.value, 0)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-500">
              <LucideIcons.PieChart className="w-12 h-12 mb-3 opacity-20" />
              <p>Belum ada data pengeluaran</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
