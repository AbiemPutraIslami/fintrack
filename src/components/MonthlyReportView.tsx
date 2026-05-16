import React, { useMemo } from 'react';
import { Transaction } from '../types/finance';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import * as LucideIcons from 'lucide-react';

interface MonthlyReportViewProps {
  transactions: Transaction[];
}

export function MonthlyReportView({ transactions }: MonthlyReportViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthlyData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Get past 12 months
    for (let i = 0; i < 12; i++) {
        const targetMonth = subMonths(now, i);
        
        let income = 0;
        let expense = 0;
        
        transactions.forEach(tx => {
            const txDate = parseISO(tx.date);
            if (isSameMonth(txDate, targetMonth)) {
                if (tx.type === 'income') {
                    income += tx.amount;
                } else if (tx.type === 'expense') {
                    expense += tx.amount;
                } else if (tx.type === 'transfer' && tx.transferCharge) {
                    expense += tx.transferCharge;
                }
            }
        });
        
        data.push({
            month: targetMonth,
            monthName: format(targetMonth, 'MMMM yyyy', { locale: id }),
            income,
            expense,
            balance: income - expense
        });
    }
    
    return data;
  }, [transactions]);

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col mb-6 gap-2">
        <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          Laporan Bulanan
        </h2>
        <p className="text-slate-400">Ringkasan keuangan untuk 12 bulan terakhir</p>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#0f172a]/50 text-slate-400 text-sm font-medium uppercase tracking-wider">
                        <th className="px-6 py-4 border-b border-slate-700/50">Bulan</th>
                        <th className="px-6 py-4 border-b border-slate-700/50 text-right">Pemasukan</th>
                        <th className="px-6 py-4 border-b border-slate-700/50 text-right">Pengeluaran</th>
                        <th className="px-6 py-4 border-b border-slate-700/50 text-right">Saldo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-200">
                    {monthlyData.map((data, index) => (
                        <tr 
                            key={index} 
                            className="hover:bg-slate-800/50 transition-colors"
                        >
                            <td className="px-6 py-4 font-medium whitespace-nowrap">
                                {data.monthName}
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                                {formatCurrency(data.income)}
                            </td>
                            <td className="px-6 py-4 text-right text-rose-400 font-medium">
                                {formatCurrency(data.expense)}
                            </td>
                            <td className={cn(
                                "px-6 py-4 text-right font-bold",
                                data.balance > 0 ? "text-emerald-400" : data.balance < 0 ? "text-rose-400" : "text-slate-200"
                            )}>
                                {data.balance > 0 ? '+' : ''}{formatCurrency(data.balance)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-[#0f172a]/80 font-bold border-t border-slate-700">
                    <tr>
                        <td className="px-6 py-4 text-slate-200">Total Keseluruhan</td>
                        <td className="px-6 py-4 text-emerald-400 text-right">
                            {formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.income, 0))}
                        </td>
                        <td className="px-6 py-4 text-rose-400 text-right">
                            {formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.expense, 0))}
                        </td>
                        <td className={cn(
                            "px-6 py-4 text-right",
                            monthlyData.reduce((acc, curr) => acc + curr.balance, 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.balance, 0))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
}
