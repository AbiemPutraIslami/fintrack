import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MonthlyReportView } from './MonthlyReportView';
import { useFinance } from '../hooks/useFinance';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Home, 
  List, 
  Settings,
  Trash2,
  X,
  Filter,
  CreditCard,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Bell
} from 'lucide-react';
import { AnalysisView } from './AnalysisView';
import { Transaction, Account, Reminder, Budget } from '../types/finance';

const COLORS = ['#22c55e', '#ef4444'];
const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <LucideIcons.Circle className={className} />;
  return <IconComponent className={className} />;
};

export function FinTrackApp() {
  const { transactions, accounts, summary, categories, categoryIcons, updateCategoryIcon, addTransaction, importTransactions, updateTransaction, deleteTransaction, addCategory, editCategory, deleteCategory, reorderCategory, addAccount, updateAccount, deleteAccount, reminders, addReminder, updateReminder, deleteReminder, budgets, updateBudget, deleteBudget } = useFinance();
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'accounts' | 'budgets' | 'analysis' | 'report' | 'settings'>('home');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenTransactionModal = (tx?: Transaction) => {
    setEditingTransaction(tx || null);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-50 font-sans overflow-hidden selection:bg-indigo-500/20">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1e293b] border-r border-slate-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-400" />
            FinTrack
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <DesktopNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Dasbor" />
          <DesktopNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List />} label="Transaksi" />
          <DesktopNavItem active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} icon={<LucideIcons.Target />} label="Anggaran" />
          <DesktopNavItem active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<LucideIcons.BarChart2 />} label="Analisis" />
          <DesktopNavItem active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<LucideIcons.FileText />} label="Laporan" />
          <DesktopNavItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<CreditCard />} label="Daftar Akun" />
          <DesktopNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Pengaturan" />
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => handleOpenTransactionModal()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Tambah Transaksi
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#1e293b] border-b border-slate-700 shrink-0">
          <h1 className="text-xl font-bold text-slate-50 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-400" />
            FinTrack
          </h1>
          <button
            onClick={() => handleOpenTransactionModal()}
            className="p-2 bg-indigo-500/10 text-indigo-400 rounded-full hover:bg-indigo-500/200/20 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 sm:pb-24 pb-24 md:pb-8 space-y-6">
           {activeTab === 'home' && <DashboardView summary={summary} transactions={transactions} accounts={accounts} categoryIcons={categoryIcons} onEditTransaction={handleOpenTransactionModal} />}
          {activeTab === 'transactions' && <TransactionListView transactions={transactions} accounts={accounts} categories={categories} categoryIcons={categoryIcons} onDelete={deleteTransaction} onEdit={handleOpenTransactionModal} onUpdate={updateTransaction} onImport={importTransactions} />}
          {activeTab === 'budgets' && <BudgetsView transactions={transactions} budgets={budgets} updateBudget={updateBudget} deleteBudget={deleteBudget} categories={categories} categoryIcons={categoryIcons} />}
          {activeTab === 'analysis' && <AnalysisView transactions={transactions} accounts={accounts} categoryIcons={categoryIcons} />}
          {activeTab === 'report' && <MonthlyReportView transactions={transactions} />}
          {activeTab === 'accounts' && <AccountsView accounts={accounts} transactions={transactions} onAddAccount={addAccount} onEditAccount={updateAccount} onDeleteAccount={deleteAccount} />}
          {activeTab === 'settings' && <SettingsView categories={categories} categoryIcons={categoryIcons} updateCategoryIcon={updateCategoryIcon} onAddCategory={addCategory} onEditCategory={editCategory} onDeleteCategory={deleteCategory} onReorderCategory={reorderCategory} reminders={reminders} onAddReminder={addReminder} onUpdateReminder={updateReminder} onDeleteReminder={deleteReminder} />}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1e293b] border-t border-slate-700 flex justify-around items-center px-1 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Beranda" />
          <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List />} label="Transaksi" />
          <MobileNavItem active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<LucideIcons.BarChart2 />} label="Analisis" />
          <MobileNavItem active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<LucideIcons.FileText />} label="Laporan" />
          <MobileNavItem active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} icon={<LucideIcons.Target />} label="Anggaran" />
          <MobileNavItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<CreditCard />} label="Akun" />
          <MobileNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Pengaturan" />
        </nav>
      </main>

      {/* Transaction Modal / Drawer */}
      {isTransactionModalOpen && (
        <TransactionModal 
          onClose={handleCloseTransactionModal} 
          onSave={(tx) => {
            if (editingTransaction) {
              updateTransaction(editingTransaction.id, tx);
            } else {
              addTransaction(tx);
            }
          }} 
          categories={categories}
          categoryIcons={categoryIcons}
          onAddCategory={addCategory}
          initialData={editingTransaction}
          accounts={accounts}
        />
      )}
    </div>
  );
}

// --- Subviews ---

function DashboardView({ summary, transactions, accounts, categoryIcons, onEditTransaction }: { summary: any, transactions: Transaction[], accounts: Account[], categoryIcons: Record<string, string>, onEditTransaction: (tx: Transaction) => void }) {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const chartData = [
    { name: 'Pemasukan', value: summary.totalIncome },
    { name: 'Pengeluaran', value: summary.totalExpense },
  ];

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const flowChartData = useMemo(() => {
    const now = new Date();
    
    if (chartPeriod === 'week' || chartPeriod === 'month') {
      let start: Date;
      let end: Date;
      if (chartPeriod === 'week') {
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
      }
      
      const filtered = transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
      
      const dataMap: Record<string, { name: string, income: number, expense: number }> = {};
      
      // Initialize days to show continuous trend
      const current = new Date(start);
      while (current <= end) {
        const dateStr = format(current, 'yyyy-MM-dd');
        dataMap[dateStr] = { 
          name: format(current, chartPeriod === 'week' ? 'dd MMM' : 'dd'), 
          income: 0, 
          expense: 0 
        };
        current.setDate(current.getDate() + 1);
      }

      filtered.forEach(t => {
        const dateStr = t.date.split('T')[0];
        if (dataMap[dateStr]) {
          if (t.type === 'income') dataMap[dateStr].income += t.amount;
          else if (t.type === 'expense') dataMap[dateStr].expense += t.amount;
        }
      });
      return { data: Object.values(dataMap), type: 'trend' };
    } 

    // For Year or All, keep group by account as before
    let filteredTransactions = transactions;
    if (chartPeriod === 'year') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      filteredTransactions = transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
    }

    const dataMap: Record<string, { name: string, income: number, expense: number }> = {};
    accounts.forEach(a => {
      dataMap[a.id] = { name: a.name, income: 0, expense: 0 };
    });

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        if (dataMap[t.accountId]) dataMap[t.accountId].income += t.amount;
      } else if (t.type === 'expense') {
        if (dataMap[t.accountId]) dataMap[t.accountId].expense += t.amount;
      }
    });

    return { data: Object.values(dataMap), type: 'account' };
  }, [transactions, accounts, chartPeriod]);

  const recent = transactions.slice(0, 4);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Saldo" amount={summary.balance} type="balance" />
        <SummaryCard title="Pemasukan Bulan Ini" amount={summary.totalIncome} type="income" />
        <SummaryCard title="Pengeluaran Bulan Ini" amount={summary.totalExpense} type="expense" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Arus Kas</h3>
          {summary.totalIncome === 0 && summary.totalExpense === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Belum ada data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={COLORS[0]} />
                    <Cell fill={COLORS[1]} />
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-xs h-full flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Pengeluaran berdasarkan Kategori</h3>
          {expensesByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Belum ada pengeluaran</div>
          ) : (
            <div className="flex-1 min-h-[16rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByCategory} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickFormatter={(val: string) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: '#334155' }}
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-xs flex flex-col mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-slate-200">
            {flowChartData.type === 'trend' ? 'Tren Arus Kas Harian' : 'Arus Kas per Akun'}
          </h3>
          <div className="flex bg-[#0f172a] p-1 rounded-xl">
            <button onClick={() => setChartPeriod('week')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'week' ? "bg-[#1e293b] text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-50")}>Minggu</button>
            <button onClick={() => setChartPeriod('month')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'month' ? "bg-[#1e293b] text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-50")}>Bulan</button>
            <button onClick={() => setChartPeriod('year')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'year' ? "bg-[#1e293b] text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-50")}>Tahun</button>
            <button onClick={() => setChartPeriod('all')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'all' ? "bg-[#1e293b] text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-50")}>Semua</button>
          </div>
        </div>
        {flowChartData.data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">Belum ada data</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowChartData.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: '#334155' }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-xs flex flex-col mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Transaksi Terakhir</h3>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {recent.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-6">
              <List className="h-10 w-10 mb-2 opacity-20" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            recent.map(tx => {
              const srcAccount = accounts.find(a => a.id === tx.accountId)?.name;
              const dstAccount = accounts.find(a => a.id === tx.toAccountId)?.name;
              const formattedName = tx.type === 'transfer' ? `${srcAccount} → ${dstAccount}` : srcAccount;
              return (
                <TransactionRow key={tx.id} transaction={tx} accountName={formattedName} onEdit={() => onEditTransaction(tx)} categoryIcons={categoryIcons} />
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionListView({ transactions, accounts, categories, categoryIcons, onDelete, onEdit, onUpdate, onImport }: { transactions: Transaction[], accounts: Account[], categories: { income: string[], expense: string[] }, categoryIcons: Record<string, string>, onDelete: (id: string) => void, onEdit: (tx: Transaction) => void, onUpdate: (id: string, tx: Partial<Omit<Transaction, "id">>) => void, onImport: (txs: Omit<Transaction, "id">[]) => void }) {
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [viewingMonth, setViewingMonth] = useState(() => new Date());
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fintrack_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const saveSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const newHistory = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 5);
      localStorage.setItem('fintrack_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveSearch(searchQuery);
      e.currentTarget.blur();
    }
  };

  const handleSearchBlur = () => {
    if (searchQuery) {
      saveSearch(searchQuery);
    }
    setTimeout(() => setIsSearchFocused(false), 200);
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(tx => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!tx.note?.toLowerCase().includes(query) && !tx.category.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // Date filter
      const txDate = parseISO(tx.date);
      const now = new Date();

      if (dateFilter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });
        if (!isWithinInterval(txDate, { start, end })) return false;
      } else if (dateFilter === 'month') {
        const start = startOfMonth(viewingMonth);
        const end = endOfMonth(viewingMonth);
        if (!isWithinInterval(txDate, { start, end })) return false;
      } else if (dateFilter === 'custom') {
        if (customDateRange.start) {
          if (txDate < customDateRange.start) return false;
        }
        if (customDateRange.end) {
          if (txDate > customDateRange.end) return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, dateFilter, customDateRange.start, customDateRange.end, categoryFilter, sortBy, sortOrder, viewingMonth, searchQuery]);

  const { filteredIncome, filteredExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
      if (tx.type === 'transfer' && tx.transferCharge) expense += tx.transferCharge;
    });
    return { filteredIncome: income, filteredExpense: expense };
  }, [filteredTransactions]);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...categories.income, ...categories.expense]));
  }, [categories]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Akun Sumber', 'Akun Tujuan', 'Jumlah', 'Biaya Transfer'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => {
        const srcAccount = accounts.find(a => a.id === tx.accountId)?.name || '';
        const dstAccount = accounts.find(a => a.id === tx.toAccountId)?.name || '';
        
        const row = [
          format(parseISO(tx.date), 'yyyy-MM-dd HH:mm'),
          tx.type,
          tx.category,
          `"${(tx.note || '').replace(/"/g, '""')}"`, // Escape commas and quotes
          `"${srcAccount}"`,
          `"${dstAccount}"`,
          tx.amount,
          tx.transferCharge || 0
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transaksi_fintrack_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          alert('Format CSV tidak valid: tidak ada data.');
          return;
        }

        // Assuming headers are exactly what we exported: ['Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Akun Sumber', 'Akun Tujuan', 'Jumlah', 'Biaya Transfer']
        const newTransactions: Omit<Transaction, "id">[] = [];
        const dataLines = lines.slice(1);

        for (const line of dataLines) {
            // Regex to handle quotes around values
            const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
            const values = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
              values.push(match[1] !== undefined ? match[1] : match[2]);
            }
            // filter out last empty match if it occurs due to regex behavior
            if (values.length > 8) values.pop();

            if (values.length < 7) continue; // Skip malformed lines

            const [dateStr, typeStr, categoryStr, noteStr, srcAccStr, dstAccStr, amountStr, feeStr] = values;
            
            const typeValue = typeStr?.trim();
            if (typeValue !== 'income' && typeValue !== 'expense' && typeValue !== 'transfer') continue;

            const categoryValue = categoryStr?.trim() || 'Lainnya';
            const noteValue = noteStr ? noteStr.replace(/""/g, '"') : undefined;
            const amountValue = Number(amountStr?.trim() || 0);
            if (isNaN(amountValue)) continue;

            // Simple date parse fallback
            let dateVal = new Date().toISOString();
            try {
                if (dateStr) {
                   const d = new Date(dateStr.trim());
                   if (!isNaN(d.getTime())) dateVal = d.toISOString();
                }
            } catch (e) {}

            // Find matching account or fallback to first available
            const matchingSrc = accounts.find(a => a.name === srcAccStr?.trim());
            const srcAccountId = matchingSrc ? matchingSrc.id : (accounts[0]?.id || '');
            if (!srcAccountId) continue;

            const tx: Omit<Transaction, "id"> = {
              type: typeValue,
              category: categoryValue,
              amount: amountValue,
              date: dateVal,
              accountId: srcAccountId,
              note: noteValue || ''
            };

            if (typeValue === 'transfer') {
               const matchingDst = accounts.find(a => a.name === dstAccStr?.trim());
               tx.toAccountId = matchingDst ? matchingDst.id : (accounts.length > 1 ? accounts[1].id : accounts[0].id);
               const feeVal = Number(feeStr?.trim() || 0);
               if (!isNaN(feeVal)) tx.transferCharge = feeVal;
            }

            newTransactions.push(tx);
        }

        if (newTransactions.length > 0) {
            onImport(newTransactions);
            alert(`Berhasil mengimpor ${newTransactions.length} transaksi.`);
        } else {
            alert('Tidak ada transaksi valid yang ditemukan dalam file CSV.');
        }

      } catch (err) {
        console.error('Error parsing CSV', err);
        alert('Gagal membaca file CSV. Pastikan format sesuai.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Semua Transaksi</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <LucideIcons.ArrowDownLeft className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Pemasukan</p>
                <p className="text-lg font-bold text-slate-50 mt-0.5">Rp {filteredIncome.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <LucideIcons.ArrowUpRight className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Pengeluaran</p>
                <p className="text-lg font-bold text-slate-50 mt-0.5">Rp {filteredExpense.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 max-w-md w-full relative group">
            <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari berdasarkan catatan atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
            />
            {isSearchFocused && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-lg z-10 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700/50">
                  <span className="text-xs font-medium text-slate-400">Riwayat Pencarian</span>
                  <button 
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchHistory([]);
                        localStorage.removeItem('fintrack_search_history');
                      }} 
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div>
                  {searchHistory.map((historyItem, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(historyItem);
                        saveSearch(historyItem);
                        setIsSearchFocused(false);
                      }}
                    >
                      <LucideIcons.History className="w-4 h-4 text-slate-500" />
                      {historyItem}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto shrink-0">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            className="hidden" 
          />
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-[#1e293b] border border-slate-700 text-slate-300 hover:bg-[#0f172a] flex-1 md:flex-none justify-center"
          >
            <LucideIcons.Upload className="h-4 w-4" />
            Impor CSV
          </button>
          <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-[#1e293b] border border-slate-700 text-slate-300 hover:bg-[#0f172a] flex-1 md:flex-none justify-center"
             disabled={filteredTransactions.length === 0}
          >
            <LucideIcons.Download className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1 md:flex-none justify-center", showFilters ? "bg-indigo-500/20 text-indigo-300" : "bg-[#1e293b] border border-slate-700 text-slate-300 hover:bg-[#0f172a]")}
          >
            <LucideIcons.Filter className="h-4 w-4" />
            Filter Data
          </button>
        </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 mb-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Rentang Waktu</label>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Waktu</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Per Bulan</option>
                <option value="custom">Kustom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kategori</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          {dateFilter === 'month' && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-sm font-medium text-slate-300">Pilih Bulan:</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewingMonth(prev => subMonths(prev, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 border border-slate-700"
                >
                  <LucideIcons.ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <span className="font-semibold text-slate-50 min-w-[120px] text-center capitalize">
                  {format(viewingMonth, 'MMMM yyyy', { locale: id })}
                </span>
                <button 
                  onClick={() => setViewingMonth(prev => addMonths(prev, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 border border-slate-700"
                >
                  <LucideIcons.ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mulai Tanggal/Waktu</label>
                <input 
                  type="datetime-local" 
                  value={customDateRange.start ? format(customDateRange.start, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sampai Tanggal/Waktu</label>
                <input 
                  type="datetime-local" 
                  value={customDateRange.end ? format(customDateRange.end, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Urutkan Berdasarkan</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="date">Tanggal</option>
                <option value="amount">Jumlah</option>
                <option value="category">Kategori</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Urutan</label>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">Menurun (Terbaru/Terbesar)</option>
                <option value="asc">Menaik (Terlama/Terkecil)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 shadow-xs shadow-black/5 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <List className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada transaksi yang sesuai.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredTransactions.map(tx => {
              const srcAccount = accounts.find(a => a.id === tx.accountId)?.name;
              const dstAccount = accounts.find(a => a.id === tx.toAccountId)?.name;
              const formattedName = tx.type === 'transfer' ? `${srcAccount} → ${dstAccount}` : srcAccount;
              if (editingTxId === tx.id) {
                 return (
                   <InlineEditTransactionRow 
                     key={tx.id} 
                     transaction={tx} 
                     accounts={accounts} 
                     categories={categories} 
                     categoryIcons={categoryIcons}
                     onSave={(updates) => {
                       onUpdate(tx.id, updates);
                       setEditingTxId(null);
                     }}
                     onCancel={() => setEditingTxId(null)}
                   />
                 )
              }
              return (
                <TransactionRow key={tx.id} transaction={tx} accountName={formattedName} showDelete onDelete={() => onDelete(tx.id)} onEdit={() => setEditingTxId(tx.id)} categoryIcons={categoryIcons} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'Receipt', 'Film', 'ShoppingCart', 'HeartPulse', 'MoreHorizontal', 'Briefcase', 'Laptop', 'TrendingUp', 'Gift', 
  'Home', 'Activity', 'Coffee', 'Music', 'Map', 'Smartphone', 'Plane', 'Train', 'Bus', 'CreditCard', 'Shield', 'Book', 'Wallet', 'User', 'Settings',
  'Zap', 'Umbrella', 'Tv', 'Truck', 'Tool', 'Tag', 'Sun', 'Star', 'Smile', 'Scissors', 'Printer', 'Phone', 'PenTool', 'Monitor', 'Mic', 'Mail', 
  'Key', 'Image', 'Headphones', 'Globe', 'Gamepad2', 'Flag', 'Feather', 'Droplet', 'Crosshair', 'Compass', 'Cloud', 'Camera', 'Bell', 'Battery', 'Award', 'Anchor'
];

const CategoryItem: React.FC<{
  categoryName: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  isFirst: boolean;
  isLast: boolean;
  iconName: string;
  onEdit: (type: 'income' | 'expense', oldName: string, newName: string) => void;
  onDelete: (type: 'income' | 'expense', name: string) => void;
  onIconChange: (categoryName: string, iconName: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({
  categoryName,
  type,
  isDefault,
  isFirst,
  isLast,
  iconName,
  onEdit,
  onDelete,
  onIconChange,
  onMoveUp,
  onMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(categoryName);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const handleSave = () => {
    if (editName.trim() && editName.trim() !== categoryName) {
      onEdit(type, categoryName, editName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?\n\nSemua transaksi dengan kategori ini akan dipindahkan ke "Lainnya".`)) {
      onDelete(type, categoryName);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#0f172a] border border-slate-700 rounded-lg">
        <input 
          autoFocus
          type="text" 
          value={editName} 
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm bg-[#1e293b] border-2 border-indigo-500 rounded-md outline-none"
        />
        <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-400 transition-colors">Simpan</button>
        <button onClick={() => { setIsEditing(false); setEditName(categoryName); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-md transition-colors">
          <LucideIcons.X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-xs group">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button 
            onClick={onMoveUp} 
            disabled={isFirst}
            className="text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-500"
          >
            <LucideIcons.ChevronUp className="w-4 h-4" />
          </button>
          <button 
            onClick={onMoveDown}
            disabled={isLast}
            className="text-slate-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-500"
          >
            <LucideIcons.ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => setIsIconPickerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-slate-400 hover:bg-indigo-500/200/10 hover:text-indigo-400 transition-colors"
          title="Ubah Ikon"
        >
          <DynamicIcon name={iconName} className="w-5 h-5" />
        </button>
        <span className="text-slate-200 font-medium">{categoryName}</span>
      </div>
      <div className="flex items-center gap-2">
        {(isDefault || categoryName === 'Lainnya') && (
          <span className="text-xs font-medium text-slate-500 px-2 bg-[#0f172a] py-1 rounded-md">Bawaan</span>
        )}
        {!isDefault && categoryName !== 'Lainnya' && categoryName !== 'Other' && (
          <>
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 rounded-md hover:bg-indigo-500/200/20 transition-colors">Edit</button>
            <button onClick={handleDelete} className="p-1.5 text-red-400 bg-red-500/80/10 rounded-md hover:bg-red-100 transition-colors">
              <LucideIcons.Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {isIconPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-50">Pilih Ikon</h3>
              <button 
                onClick={() => setIsIconPickerOpen(false)}
                className="p-1 hover:bg-slate-700/50 rounded-full text-slate-400"
              >
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-1">
              {AVAILABLE_ICONS.map(i => (
                <button
                  key={i}
                  onClick={() => {
                    onIconChange(categoryName, i);
                    setIsIconPickerOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center aspect-square rounded-xl hover:bg-indigo-500/200/10 hover:text-indigo-400 transition-colors",
                    iconName === i ? "bg-indigo-500/10 text-indigo-400 border border-indigo-200" : "bg-[#0f172a] text-slate-400 border border-transparent"
                  )}
                >
                  <DynamicIcon name={i} className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetsView({ 
  transactions, 
  budgets, 
  updateBudget, 
  deleteBudget,
  categories,
  categoryIcons 
}: { 
  transactions: Transaction[], 
  budgets: Budget[], 
  updateBudget: (cat: string, limit: number) => void, 
  deleteBudget: (cat: string) => void,
  categories: { income: string[], expense: string[] },
  categoryIcons: Record<string, string>
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categories.expense[0] || '');
  const [limitInput, setLimitInput] = useState('');

  // Calculate current month's spending per category
  const currentMonthSpending = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const spending: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const txDate = parseISO(tx.date);
        if (isWithinInterval(txDate, { start, end })) {
          spending[tx.category] = (spending[tx.category] || 0) + tx.amount;
        }
      }
    });
    return spending;
  }, [transactions]);

  const handleSave = () => {
    if (!selectedCategory || !limitInput) return;
    updateBudget(selectedCategory, Number(limitInput));
    setIsAdding(false);
    setEditingCategory(null);
    setLimitInput('');
    setSelectedCategory(categories.expense[0] || '');
  };

  const handleEdit = (budget: Budget) => {
    setEditingCategory(budget.category);
    setSelectedCategory(budget.category);
    setLimitInput(budget.monthlyLimit.toString());
    setIsAdding(true);
  };

  const unusedCategories = categories.expense.filter(c => !budgets.some(b => b.category === c));

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-tight hidden md:block">Anggaran Bulanan</h2>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingCategory(null);
            setSelectedCategory(unusedCategories[0] || categories.expense[0] || '');
            setLimitInput('');
          }}
          disabled={unusedCategories.length === 0 && !editingCategory}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors hover:bg-indigo-400 md:ml-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Tambah Anggaran
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#1e293b] p-5 rounded-2xl border border-indigo-100 shadow-md mb-6 animate-in slide-in-from-top-2">
          <h3 className="font-semibold text-slate-50 mb-4">{editingCategory ? 'Edit Anggaran' : 'Anggaran Baru'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!!editingCategory}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {editingCategory ? (
                  <option value={editingCategory}>{editingCategory}</option>
                ) : (
                  unusedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Batas Bulanan (Rp)</label>
              <input 
                type="number" 
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                placeholder="Mis. 1000000"
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => { setIsAdding(false); setEditingCategory(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-400 rounded-lg transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {budgets.length === 0 && !isAdding ? (
        <div className="text-center py-12 bg-[#1e293b] rounded-2xl border border-slate-700/50 border-dashed">
          <LucideIcons.Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-50 mb-1">Belum Ada Anggaran</h3>
          <p className="text-slate-400 text-sm">Tetapkan batas pengeluaran bulanan untuk setiap kategori.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {budgets.length > 0 && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
                <LucideIcons.BarChart2 className="w-5 h-5 text-indigo-500" />
                Ringkasan Progres Anggaran
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgets.map(b => {
                      const spent = currentMonthSpending[b.category] || 0;
                      const remaining = Math.max(b.monthlyLimit - spent, 0);
                      return {
                        name: b.category,
                        Terpakai: Math.min(spent, b.monthlyLimit),
                        Kelebihan: Math.max(spent - b.monthlyLimit, 0),
                        Sisa: remaining,
                        Limit: b.monthlyLimit
                      };
                    })}
                    margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis 
                      tickFormatter={(val) => `Rp ${val / 1000}k`} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}}
                      width={70}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Terpakai" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="Kelebihan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="Sisa" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {budgets.map(budget => {
              const spent = currentMonthSpending[budget.category] || 0;
              const rawPercentage = (spent / budget.monthlyLimit) * 100;
              const percentage = Math.min(rawPercentage, 100);
              const isWarning = rawPercentage >= 80 && rawPercentage < 100;
              const isDanger = rawPercentage >= 100;
              const remaining = Math.max(budget.monthlyLimit - spent, 0);
              
              return (
                <div key={budget.category} className="bg-[#1e293b] p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-400 shrink-0">
                        <DynamicIcon name={categoryIcons[budget.category] || 'TrendingDown'} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-50">{budget.category}</h3>
                        <p className="text-xs text-slate-400">
                          {rawPercentage.toFixed(0)}% terpakai
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(budget)} className="p-1.5 text-slate-500 hover:text-indigo-400 bg-[#0f172a] hover:bg-indigo-500/200/10 rounded-md transition-colors">
                        <LucideIcons.Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                          if (window.confirm(`Hapus anggaran untuk ${budget.category}?`)) {
                            deleteBudget(budget.category);
                          }
                        }} 
                        className="p-1.5 text-slate-500 hover:text-red-400 bg-[#0f172a] hover:bg-red-500/80/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex justify-between items-end text-sm">
                    <div className="flex flex-col">
                      <span className={cn("font-bold", isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-slate-50")}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-slate-400 text-xs">
                        dari {formatCurrency(budget.monthlyLimit)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xs font-semibold", remaining === 0 ? "text-red-400" : "text-emerald-400")}>
                        Sisa: {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-4 w-full bg-[#0f172a] rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out relative",
                        isDanger ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : isWarning ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]" : "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      )}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-50" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
                    </div>
                  </div>
                  
                  {(isWarning || isDanger) && (
                    <p className={cn("text-xs mt-2 font-medium flex items-center gap-1", isDanger ? "text-red-400" : "text-amber-400")}>
                      <LucideIcons.AlertCircle className="w-3.5 h-3.5" />
                      {isDanger ? 'Batas anggaran telah terlampaui!' : 'Hampir mencapai batas anggaran.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {unusedCategories.length > 0 && (
            <div className="mt-8 border-t border-slate-700/50 pt-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Kategori Belum Dianggarkan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {unusedCategories.map(cat => {
                  const spent = currentMonthSpending[cat] || 0;
                  return (
                    <div key={cat} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-slate-400">
                          <DynamicIcon name={categoryIcons[cat] || 'PieChart'} className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{cat}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(spent)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setIsAdding(true);
                          setEditingCategory(null);
                          setSelectedCategory(cat);
                          setLimitInput('');
                          // Scroll to top might be helpful visually if it's a long list
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-indigo-400 hover:text-indigo-300 p-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                        title="Buat Anggaran"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountsView({ 
  accounts, 
  transactions,
  onAddAccount, 
  onEditAccount, 
  onDeleteAccount 
}: { 
  accounts: (Account & { currentBalance?: number })[], 
  transactions: Transaction[],
  onAddAccount: (acc: Omit<Account, 'id'>) => void, 
  onEditAccount: (id: string, acc: Partial<Omit<Account, 'id'>>) => void,
  onDeleteAccount: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'ewallet'>('bank');
  const [initialBalance, setInitialBalance] = useState('');

  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const accountsRef = React.useRef(accounts);
  accountsRef.current = accounts;

  const syncAccount = React.useCallback((accountId: string) => {
    setSyncingAccounts(prev => {
      if (prev.has(accountId)) return prev;
      const next = new Set(prev);
      next.add(accountId);
      return next;
    });

    // Simulating API call delay for syncing external provider balance
    setTimeout(() => {
      const accToSync = accountsRef.current.find(a => a.id === accountId);
      if (accToSync) {
        // Simulate real-world adjustment by a small random mock value (-1500 to +1500 IDR variant just to show it changes, sometimes 0)
        const mockVariation = Math.floor(Math.random() * 3) * 1500 - 1500;
        if (mockVariation !== 0) {
          const newInitialBalance = (accToSync.initialBalance || 0) + mockVariation;
          onEditAccount(accountId, { initialBalance: newInitialBalance });
        }
      }
      setSyncingAccounts(prev => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }, Math.floor(Math.random() * 1000) + 1000); // 1-2s delay
  }, [onEditAccount]);

  React.useEffect(() => {
    // Sync all accounts slightly staggered on component load
    accountsRef.current.forEach((acc, index) => {
      setTimeout(() => syncAccount(acc.id), index * 300);
    });
  }, [syncAccount]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      onEditAccount(editingId, { name, type });
    } else {
      onAddAccount({ name, type, initialBalance: Number(initialBalance) || 0 });
    }
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setType('bank');
    setInitialBalance('');
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setIsAdding(true);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const getAccountStats = (accountId: string) => {
    let accIncome = 0;
    let accExpense = 0;
    let recentTrend = 0; // Positive = up, Negative = down
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    transactions.forEach(t => {
      if (t.accountId === accountId) {
        if (t.type === 'income') {
          accIncome += t.amount;
          if (new Date(t.date) >= thirtyDaysAgo) recentTrend += t.amount;
        } else if (t.type === 'expense') {
          accExpense += t.amount;
          if (new Date(t.date) >= thirtyDaysAgo) recentTrend -= t.amount;
        } else if (t.type === 'transfer') {
          accExpense += t.amount + (t.transferCharge || 0);
          if (new Date(t.date) >= thirtyDaysAgo) recentTrend -= (t.amount + (t.transferCharge || 0));
        }
      } else if (t.type === 'transfer' && t.toAccountId === accountId) {
        accIncome += t.amount;
        if (new Date(t.date) >= thirtyDaysAgo) recentTrend += t.amount;
      }
    });

    return { totalIncome: accIncome, totalExpense: accExpense, recentTrend };
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-tight hidden md:block">Daftar Akun Bank & Dompet</h2>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setName('');
            setType('bank');
            setInitialBalance('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors hover:bg-indigo-400 md:ml-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => {
          const stats = getAccountStats(acc.id);
          return (
            <div key={acc.id} className="bg-[#1e293b] p-5 rounded-2xl border border-slate-700/50 shadow-sm flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      {acc.type === 'bank' ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-50">{acc.name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{acc.type === 'ewallet' ? 'E-Wallet' : acc.type}</p>
                    </div>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity gap-1">
                    <button onClick={() => handleEdit(acc)} className="text-xs text-indigo-400 hover:text-indigo-800 font-medium px-2 py-1">Edit</button>
                    {accounts.length > 1 && (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Hapus akun ${acc.name}? Transaksi akan dipindahkan ke akun lain.`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-800 font-medium px-2 py-1"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 mb-4">
                  <p className="text-sm pb-1 text-slate-400">Saldo Saat Ini</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-50">{formatRupiah(acc.currentBalance || 0)}</p>
                    {stats.recentTrend !== 0 && (
                      <span className={cn("flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md", stats.recentTrend > 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-500/80/10")} title={stats.recentTrend > 0 ? "Pemasukan > Pengeluaran (30 hari)" : "Pengeluaran > Pemasukan (30 hari)"}>
                        {stats.recentTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        30h
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Pemasukan</p>
                    <p className="text-sm font-semibold text-green-600">+{formatRupiah(stats.totalIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Pengeluaran</p>
                    <p className="text-sm font-semibold text-red-400">-{formatRupiah(stats.totalExpense)}</p>
                  </div>
                  <div className="col-span-2 mt-1 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Saldo Awal</span>
                    <span className="font-medium text-slate-300">{formatRupiah(acc.initialBalance || 0)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                  {syncingAccounts.has(acc.id) ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <LucideIcons.Loader2 className="w-3 h-3 animate-spin" />
                      Menyinkronkan...
                    </span>
                  ) : (
                     <span className="text-xs text-slate-500">Tersinkronisasi</span>
                  )}
                  <button
                    onClick={() => {
                        const isExpanding = expandedAccountId !== acc.id;
                        setExpandedAccountId(isExpanding ? acc.id : null);
                        if (isExpanding) {
                           syncAccount(acc.id);
                        }
                    }}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {expandedAccountId === acc.id ? 'Tutup Histori' : 'Lihat Histori Transaksi'}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expandedAccountId === acc.id && "rotate-180")} />
                  </button>
                </div>
                
                {expandedAccountId === acc.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3 animate-in slide-in-from-top-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {transactions
                      .filter(t => t.accountId === acc.id || t.toAccountId === acc.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .length > 0 ? (
                        transactions
                        .filter(t => t.accountId === acc.id || t.toAccountId === acc.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(tx => {
                          const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.toAccountId === acc.id);
                          const isTransfer = tx.type === 'transfer';
                          let title = tx.category;
                          if (isTransfer) {
                             if (tx.accountId === acc.id) {
                               const destAcc = accounts.find(a => a.id === tx.toAccountId);
                               title = `Transfer ke ${destAcc?.name || '?'}`;
                             } else {
                               const srcAcc = accounts.find(a => a.id === tx.accountId);
                               title = `Transfer dari ${srcAcc?.name || '?'}`;
                             }
                          }
                          return (
                            <div key={tx.id} className="flex justify-between items-center bg-[#0f172a] p-3 rounded-xl border border-slate-700/50">
                              <div className="min-w-0 flex-1 pr-4">
                                <p className="text-sm font-semibold text-slate-50 truncate">{title}</p>
                                <p className="text-xs text-slate-400">{format(parseISO(tx.date), 'dd MMM yyyy')}</p>
                              </div>
                              <span className={cn("text-sm font-bold shrink-0", isIncome ? "text-green-600" : "text-slate-50")}>
                                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-4 text-sm text-slate-400">Belum ada transaksi di akun ini.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-0">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAdding(false)} />
           <div className="relative bg-[#1e293b] md:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
             <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
               <h2 className="text-xl font-bold text-slate-50">{editingId ? 'Edit Akun' : 'Tambah Akun'}</h2>
               <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-400 bg-[#0f172a] p-2 rounded-full transition-colors">
                 <X className="h-5 w-5" />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Nama Akun / Bank</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none" placeholder="Mis. BCA, Gopay, Dompet" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Jenis Akun</label>
                 <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none">
                   <option value="bank">Bank</option>
                   <option value="cash">Tunai (Kas)</option>
                   <option value="ewallet">E-Wallet</option>
                 </select>
               </div>
               {!editingId && (
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1">Saldo Awal (Rp)</label>
                   <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none" placeholder="0" />
                 </div>
               )}
               <button onClick={handleSave} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 rounded-xl text-lg transition-colors mt-6">
                 Simpan
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle, logOut } from '../lib/firebase';

function SettingsView({ 
  categories, 
  categoryIcons,
  updateCategoryIcon,
  onAddCategory,
  onEditCategory, 
  onDeleteCategory,
  onReorderCategory,
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder
}: { 
  categories: { income: string[], expense: string[] }; 
  categoryIcons: Record<string, string>;
  updateCategoryIcon: (categoryName: string, iconName: string) => void;
  onAddCategory: (type: 'income' | 'expense', name: string) => void;
  onEditCategory: (type: 'income' | 'expense', oldName: string, newName: string) => void; 
  onDeleteCategory: (type: 'income' | 'expense', categoryName: string) => void;
  onReorderCategory: (type: 'income' | 'expense', startIndex: number, endIndex: number) => void;
  reminders: Reminder[];
  onAddReminder: (r: Omit<Reminder, "id">) => void;
  onUpdateReminder: (id: string, r: Omit<Reminder, "id">) => void;
  onDeleteReminder: (id: string) => void;
}) {
  const { user, loading: authLoading } = useAuth();
  
  const [newCatName, setNewCatName] = useState('');
  const [addingType, setAddingType] = useState<'income' | 'expense' | null>(null);

  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderType, setReminderType] = useState<'income' | 'expense'>('expense');
  const [reminderFreq, setReminderFreq] = useState<'daily'|'weekly'|'monthly'|'yearly'>('monthly');
  const [reminderDate, setReminderDate] = useState('');

  const openAddReminder = () => {
    setIsAddingReminder(true);
    setEditingReminderId(null);
    setReminderTitle('');
    setReminderAmount('');
    setReminderType('expense');
    setReminderFreq('monthly');
    setReminderDate(new Date().toISOString().split('T')[0]);
  };

  const openEditReminder = (r: Reminder) => {
    setIsAddingReminder(true);
    setEditingReminderId(r.id);
    setReminderTitle(r.title);
    setReminderAmount(r.amount.toString());
    setReminderType(r.type);
    setReminderFreq(r.frequency);
    setReminderDate(r.nextDueDate);
  };

  const saveReminder = () => {
    if (!reminderTitle.trim() || !reminderAmount || isNaN(Number(reminderAmount)) || !reminderDate) return;
    
    const rData: Omit<Reminder, "id"> = {
      title: reminderTitle.trim(),
      amount: Number(reminderAmount),
      type: reminderType,
      frequency: reminderFreq,
      nextDueDate: reminderDate
    };

    if (editingReminderId) {
      onUpdateReminder(editingReminderId, rData);
    } else {
      onAddReminder(rData);
    }
    
    setIsAddingReminder(false);
    setEditingReminderId(null);
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    if (newCatName.trim()) {
      onAddCategory(type, newCatName.trim());
      setNewCatName('');
      setAddingType(null);
    }
  };

  const renderCategoryList = (type: 'income' | 'expense') => {
    const list = categories[type];
    const defaultList = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    
    return (
      <div className="space-y-2 mt-3">
        {list.map((cat, index) => {
          const isDefault = defaultList.includes(cat);
          return (
            <CategoryItem 
              key={cat} 
              categoryName={cat} 
              type={type} 
              isDefault={isDefault} 
              isFirst={index === 0}
              isLast={index === list.length - 1}
              iconName={categoryIcons[cat] || (type === 'income' ? 'TrendingUp' : 'TrendingDown')}
              onEdit={onEditCategory} 
              onDelete={onDeleteCategory} 
              onIconChange={updateCategoryIcon}
              onMoveUp={() => onReorderCategory(type, index, index - 1)}
              onMoveDown={() => onReorderCategory(type, index, index + 1)}
            />
          );
        })}
        {addingType === type ? (
          <div className="flex items-center gap-2 p-2 bg-indigo-500/10 border border-indigo-200 rounded-lg">
            <input 
              autoFocus
              type="text" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nama Kategori Baru"
              className="flex-1 px-3 py-1.5 text-sm bg-[#1e293b] border-2 border-indigo-500 rounded-md outline-none"
            />
            <button onClick={() => handleAddCategory(type)} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-400 transition-colors">Tambah</button>
            <button onClick={() => { setAddingType(null); setNewCatName(''); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setAddingType(type); setNewCatName(''); }}
            className="flex items-center justify-center w-full gap-2 p-3 text-sm font-medium text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/200/20 transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <h2 className="text-2xl font-bold tracking-tight mb-6 hidden md:block">Pengaturan</h2>
      
      <div className="space-y-6">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Sinkronisasi</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#0f172a] rounded-xl mb-4 gap-4">
            <div>
              <h4 className="font-medium text-slate-50">Penyimpanan Lokal</h4>
              <p className="text-sm text-slate-400">Data tersimpan otomatis di perangkat.</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Aktif</div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-indigo-500/10 border border-indigo-100 rounded-xl gap-4">
            <div>
              <h4 className="font-medium text-indigo-100">Sinkronisasi Cloud (Firebase)</h4>
              {authLoading ? (
                <p className="text-sm text-indigo-400">Memuat status...</p>
              ) : user ? (
                <p className="text-sm text-indigo-300">Masuk sebagai <span className="font-medium">{user.email}</span>. Data kini disinkronkan secara otomatis.</p>
              ) : (
                <p className="text-sm text-indigo-400">Cadangkan data Anda dengan aman ke cloud agar bisa diakses di perangkat mana pun.</p>
              )}
            </div>
            <div>
              {authLoading ? null : user ? (
                <button onClick={logOut} className="px-4 py-2 bg-[#1e293b] text-indigo-300 border border-indigo-200 hover:bg-[#0f172a] font-medium text-sm rounded-lg transition-colors whitespace-nowrap">
                  Keluar
                </button>
              ) : (
                <button onClick={signInWithGoogle} className="px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-400 font-medium text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap">
                  Login & Sinkronisasi
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Kategori Pengeluaran</h3>
          {renderCategoryList('expense')}
        </div>

        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Kategori Pemasukan</h3>
          {renderCategoryList('income')}
        </div>

        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-50">Pengingat Tagihan & Transaksi</h3>
            <button 
              onClick={openAddReminder}
              className="p-2 text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/200/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 bg-[#0f172a] rounded-xl border border-dashed border-slate-700">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Belum ada pengingat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-[#1e293b] border border-slate-700/50 rounded-xl shadow-xs hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", r.type === 'expense' ? "bg-red-500/80/10 text-red-400" : "bg-green-50 text-green-600")}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-50">{r.title}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {r.frequency} • <span className="font-medium text-indigo-400">{format(parseISO(r.nextDueDate), 'dd MMM yyyy')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("font-bold text-sm", r.type === 'expense' ? "text-red-400" : "text-green-600")}>
                      {r.type === 'expense' ? '-' : '+'}{formatCurrency(r.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditReminder(r)} className="px-2 py-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 rounded hover:bg-indigo-500/200/20 transition-colors">Edit</button>
                      <button onClick={() => onDeleteReminder(r.id)} className="p-1 text-red-400 bg-red-500/80/10 rounded hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddingReminder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAddingReminder(false)} />
           <div className="relative bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
               <h2 className="text-xl font-bold text-slate-50">{editingReminderId ? 'Edit Pengingat' : 'Tambah Pengingat'}</h2>
               <button onClick={() => setIsAddingReminder(false)} className="text-slate-500 hover:text-slate-400 bg-[#0f172a] p-2 rounded-full transition-colors">
                 <X className="h-5 w-5" />
               </button>
             </div>
             <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Judul / Nama Tagihan</label>
                 <input 
                   type="text" 
                   value={reminderTitle}
                   onChange={e => setReminderTitle(e.target.value)}
                   className="w-full px-4 py-2.5 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   placeholder="Mis. Tagihan Listrik"
                   required
                 />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipe</label>
                  <div className="flex bg-slate-700/50 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setReminderType('expense')}
                      className={cn("flex-1 py-1.5 font-medium text-sm rounded-lg transition-all", reminderType === 'expense' ? "bg-[#1e293b] text-red-400 shadow-sm" : "text-slate-400 hover:text-slate-300")}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderType('income')}
                      className={cn("flex-1 py-1.5 font-medium text-sm rounded-lg transition-all", reminderType === 'income' ? "bg-[#1e293b] text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-300")}
                    >
                      Pemasukan
                    </button>
                  </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Nominal</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                   <input 
                     type="number"
                     value={reminderAmount}
                     onChange={e => setReminderAmount(e.target.value)}
                     className="w-full pl-12 pr-4 py-2.5 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                     placeholder="0"
                     required
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1">Frekuensi</label>
                   <select 
                     value={reminderFreq}
                     onChange={e => setReminderFreq(e.target.value as any)}
                     className="w-full px-4 py-2.5 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   >
                     <option value="daily">Harian</option>
                     <option value="weekly">Mingguan</option>
                     <option value="monthly">Bulanan</option>
                     <option value="yearly">Tahunan</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1">Jatuh Tempo Berikutnya</label>
                   <input 
                     type="date"
                     value={reminderDate}
                     onChange={e => setReminderDate(e.target.value)}
                     className="w-full px-4 py-2.5 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                     required
                   />
                 </div>
               </div>
               <div className="pt-2">
                 <button 
                   onClick={saveReminder}
                   disabled={!reminderTitle.trim() || !reminderAmount || isNaN(Number(reminderAmount)) || !reminderDate}
                   className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500/200 text-white rounded-xl font-semibold transition-all shadow-md focus:ring-4 focus:ring-indigo-100"
                 >
                   Simpan Pengingat
                 </button>
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

function TransactionModal({ 
  onClose, 
  onSave, 
  categories, 
  categoryIcons,
  onAddCategory,
  initialData,
  accounts
}: { 
  onClose: () => void; 
  onSave: (tx: Omit<Transaction, "id">) => void;
  categories: { income: string[], expense: string[] };
  categoryIcons: Record<string, string>;
  onAddCategory: (type: 'income'|'expense', name: string) => void;
  initialData: Transaction | null;
  accounts: Account[];
}) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialData ? initialData.type : 'expense');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  
  const activeCategories = type === 'income' ? categories.income : categories.expense;
  const isInitialCategoryCustom = initialData && type !== 'transfer' ? !activeCategories.includes(initialData.category) : false;

  const [category, setCategory] = useState(initialData ? (isInitialCategoryCustom ? 'custom' : initialData.category) : (activeCategories[0] || ''));
  const [isCustomCategory, setIsCustomCategory] = useState(isInitialCategoryCustom);
  const [customCategoryName, setCustomCategoryName] = useState(isInitialCategoryCustom ? initialData!.category : '');
  const [note, setNote] = useState(initialData ? initialData.note : '');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || (accounts.length > 1 ? accounts[1].id : ''));
  const [transferCharge, setTransferCharge] = useState(initialData?.transferCharge?.toString() || '');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [lastSuggestedNote, setLastSuggestedNote] = useState('');

  const handleSuggestCategory = async (isAuto = false) => {
    if (!note) {
      if (!isAuto) alert("Masukkan catatan transaksi terlebih dahulu.");
      return;
    }
    if (type === 'transfer') return;
    if (isAuto && note === lastSuggestedNote) return;

    setLastSuggestedNote(note);
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/categorize-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          amount,
          type,
          existingCategories: activeCategories
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get suggestion');
      }

      const result = await response.json();
      
      if (result.recommendedCategory) {
        if (result.isNew || !activeCategories.includes(result.recommendedCategory)) {
          setIsCustomCategory(true);
          setCategory('custom');
          setCustomCategoryName(result.recommendedCategory);
        } else {
          setIsCustomCategory(false);
          setCategory(result.recommendedCategory);
        }
      }
    } catch (e) {
      console.error(e);
      if (!isAuto) alert("Gagal mendapatkan saran kategori.");
    } finally {
      setIsSuggesting(false);
    }
  };
  
  // Reset category when type changes
  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer') => {
    setType(newType);
    if (newType !== 'transfer') {
      const newCategories = newType === 'income' ? categories.income : categories.expense;
      setCategory(newCategories[0] || '');
      setIsCustomCategory(false);
      setCustomCategoryName('');
    } else {
      setCategory('Transfer');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomCategory(true);
      setCategory('custom');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (type === 'transfer' && accountId === toAccountId) {
      alert("Akun pengirim dan penerima tidak boleh sama");
      return;
    }
    
    let finalCategory = category;
    if (type !== 'transfer' && isCustomCategory) {
      if (!customCategoryName.trim()) return;
      finalCategory = customCategoryName.trim();
      onAddCategory(type as 'income'|'expense', finalCategory);
    } else if (type === 'transfer') {
      finalCategory = 'Transfer';
    }

    onSave({
      type,
      amount: Number(amount),
      category: finalCategory,
      note,
      date: initialData ? initialData.date : new Date().toISOString(),
      accountId,
      ...(type === 'transfer' && { 
        toAccountId, 
        transferCharge: transferCharge ? Number(transferCharge) : undefined 
      })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#1e293b] md:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-50">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-400 bg-[#0f172a] p-2 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex flex-col overflow-y-auto">
          {/* Type Toggle */}
          <div className="flex bg-slate-700/50 rounded-xl p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'expense' ? "bg-[#1e293b] text-red-400 shadow-sm" : "text-slate-400 hover:text-slate-300")}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'income' ? "bg-[#1e293b] text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-300")}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'transfer' ? "bg-[#1e293b] text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-300")}
            >
              Transfer
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah (Rp/IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">Rp</span>
              <input 
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-lg font-semibold transition-all outline-none"
                placeholder="0"
                step="any"
              />
            </div>
          </div>

          {accounts.length > 0 && (
            <div className={cn("grid gap-4", type === 'transfer' ? "grid-cols-2" : "grid-cols-1")}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {type === 'transfer' ? 'Dari Akun' : 'Akun'}
                </label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                >
                  {accounts.map((acc: Account) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Ke Akun</label>
                  <select 
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                  >
                    {accounts.map((acc: Account) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {type === 'transfer' && (
             <div>
               <label className="block text-sm font-medium text-slate-300 mb-1">Biaya Transfer (Rp/IDR)</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-md">Rp</span>
                 <input 
                   type="number"
                   value={transferCharge}
                   onChange={e => setTransferCharge(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   placeholder="0 (Opsional)"
                   step="any"
                 />
               </div>
             </div>
          )}

          {type !== 'transfer' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-300">Kategori</label>
                <button
                  type="button"
                  onClick={() => handleSuggestCategory(false)}
                  disabled={isSuggesting || !note}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                  title={!note ? "Masukkan catatan terlebih dahulu" : "Saran kategori pintar (AI)"}
                >
                  <LucideIcons.Sparkles className="w-3.5 h-3.5" />
                  {isSuggesting ? 'Menganalisis...' : 'Saran AI'}
                </button>
              </div>
              {!isCustomCategory ? (
                <div className="flex gap-3">
                  <div className="w-[52px] h-[52px] shrink-0 flex items-center justify-center bg-indigo-500/10 border border-indigo-100 rounded-xl text-indigo-400">
                    <DynamicIcon name={categoryIcons[category] || (type === 'income' ? 'TrendingUp' : 'TrendingDown')} className="w-6 h-6" />
                  </div>
                  <select 
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none appearance-none"
                  >
                    {activeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom" className="font-semibold text-indigo-400">+ Tambah Kategori Baru</option>
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    autoFocus
                    required
                    value={customCategoryName}
                    onChange={e => setCustomCategoryName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-[#1e293b] border-2 border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                    placeholder="Mis. Bonus, Langganan..."
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsCustomCategory(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Catatan (Opsional)</label>
            <input 
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => handleSuggestCategory(true)}
              className="w-full px-4 py-3 bg-[#0f172a] border-transparent focus:border-indigo-500 focus:bg-[#1e293b] focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
              placeholder={type === 'transfer' ? "Mis. Uang saku bulanan" : "Mis. Makan siang dengan klien"}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 rounded-xl text-lg transition-colors active:scale-[0.98]"
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Components ---

function SummaryCard({ title, amount, type }: { title: string, amount: number, type: 'balance'|'income'|'expense' }) {
  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  
  return (
    <div className={cn(
      "p-6 rounded-3xl border shadow-xs transition-all",
      type === 'balance' ? "bg-indigo-500 text-white border-indigo-700 shadow-indigo-600/20" : "bg-[#1e293b] text-slate-50 border-slate-700/50"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className={cn("text-sm font-medium", type === 'balance' ? "text-indigo-100" : "text-slate-400")}>{title}</span>
        {isIncome && <TrendingUp className="h-5 w-5 text-green-500" />}
        {isExpense && <TrendingDown className="h-5 w-5 text-red-400" />}
        {type === 'balance' && <Wallet className="h-5 w-5 text-indigo-200" />}
      </div>
      <div className="text-3xl font-bold tracking-tight">
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

const InlineEditTransactionRow: React.FC<{ 
  transaction: Transaction, 
  accounts: Account[], 
  categories: { income: string[], expense: string[] },
  onSave: (updates: Partial<Omit<Transaction, "id">>) => void,
  onCancel: () => void,
  categoryIcons: Record<string, string>
}> = ({ 
  transaction, 
  accounts, 
  categories, 
  onSave, 
  onCancel,
  categoryIcons
}) => {
  const [type, setType] = useState<'income'|'expense'|'transfer'>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [toAccountId, setToAccountId] = useState(transaction.toAccountId || '');
  const [date, setDate] = useState(format(parseISO(transaction.date), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState(transaction.note || '');
  const [transferCharge, setTransferCharge] = useState(transaction.transferCharge?.toString() || '');

  const activeCategories = type === 'income' ? categories.income : categories.expense;
  
  const handleTypeChange = (newType: 'income'|'expense'|'transfer') => {
    setType(newType);
    if (newType !== 'transfer') {
      const cats = newType === 'income' ? categories.income : categories.expense;
      setCategory(cats[0] || '');
    } else {
      setCategory('Transfer');
    }
  };

  const handleSave = () => {
    if (!amount || isNaN(Number(amount))) return;
    onSave({
      type,
      amount: Number(amount),
      category,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      transferCharge: type === 'transfer' && transferCharge ? Number(transferCharge) : undefined,
      date: new Date(date).toISOString(),
      note
    });
  };

  return (
    <div className="flex flex-col bg-[#0f172a] border-b border-slate-700/50 p-4 gap-4 animate-in fade-in duration-200">
      <div className="flex bg-[#1e293b] rounded-lg p-1">
        {(['expense', 'income', 'transfer'] as const).map(t => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
              type === t ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-300"
            )}
          >
            {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah</label>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Waktu</label>
          <input 
            type="datetime-local" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {type !== 'transfer' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Akun</label>
              <select 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Dari Akun</label>
              <select 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Ke Akun</label>
              <select 
                value={toAccountId} 
                onChange={e => setToAccountId(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                 <option value="" disabled>Pilih Akun Tujuan</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Catatan</label>
        <input 
          type="text" 
          value={note} 
          onChange={e => setNote(e.target.value)}
          className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Catatan opsional..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors"
        >
          Batal
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors shadow-none"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}

const TransactionRow: React.FC<{ transaction: Transaction, accountName?: string, showDelete?: boolean, onDelete?: () => void, onEdit?: () => void, categoryIcons?: Record<string, string> }> = ({ transaction, accountName, showDelete, onDelete, onEdit, categoryIcons }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  return (
    <div className="flex flex-col group border-b last:border-0 border-gray-50 md:border-b-0 animate-in fade-in duration-300">
      <div 
        className={cn("flex items-center justify-between p-4 bg-[#1e293b] md:bg-transparent md:hover:bg-[#0f172a] rounded-xl md:rounded-none transition-colors", "cursor-pointer")}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0",
            isTransfer ? "bg-blue-100 text-blue-600" : isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-400"
          )}>
            {isTransfer ? <LucideIcons.ArrowRightLeft className="h-5 w-5 md:h-6 md:w-6" /> : <DynamicIcon name={categoryIcons?.[transaction.category] || (isIncome ? 'TrendingUp' : 'TrendingDown')} className="h-5 w-5 md:h-6 md:w-6" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-50 truncate">{isTransfer ? 'Transfer' : transaction.category}</p>
            <div className="flex items-center text-xs md:text-sm text-slate-400 gap-1 md:gap-2">
              <span className="shrink-0">{format(parseISO(transaction.date), 'dd MMM yyyy')}</span>
              {accountName && !isExpanded && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0 mx-1 md:mx-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{isTransfer ? accountName.replace(' → ', ' - ') : accountName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-2">
          <span className={cn("font-bold text-right text-sm md:text-base", isTransfer ? "text-blue-600" : isIncome ? "text-green-600" : "text-slate-50")}>
            {isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            {isTransfer && transaction.transferCharge ? (
              <span className="block text-xs font-normal text-red-400 whitespace-nowrap mt-0.5">-{formatCurrency(transaction.transferCharge)} (biaya)</span>
            ) : null}
          </span>
          <button 
            className="p-1 text-slate-500 hover:text-slate-400 shrink-0"
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 md:px-16 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50 space-y-3 text-sm">
            {isTransfer && (
              <>
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Dari Akun</span>
                  <span className="font-medium text-slate-50">{accountName?.split(' → ')[0] || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Ke Akun</span>
                  <span className="font-medium text-slate-50">{accountName?.split(' → ')[1] || '-'}</span>
                </div>
                {(transaction.transferCharge ?? 0) > 0 && (
                  <div className="flex justify-between items-center bg-red-500/80/10 p-2 rounded-lg border border-red-100 mt-2">
                    <span className="text-red-700 font-medium flex items-center gap-1.5 shadow-sm">
                      <TrendingDown className="w-4 h-4" /> Biaya Transfer (Fee)
                    </span>
                    <span className="font-bold text-red-400">-{formatCurrency(transaction.transferCharge!)}</span>
                  </div>
                )}
              </>
            )}
            {!isTransfer && accountName && (
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-slate-400">Akun</span>
                <span className="font-medium text-slate-50">{accountName}</span>
              </div>
            )}
            <div className="flex justify-between items-start pt-1">
              <span className="text-slate-400 whitespace-nowrap mr-4">Catatan</span>
              <span className="font-medium text-slate-50 text-right">{transaction.note || '-'}</span>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-slate-700">
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-200 rounded-lg transition-colors border border-indigo-200"
                >
                  Edit
                </button>
              )}
              {showDelete && onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors border border-red-200 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors outline-none",
        active ? "bg-indigo-500/10 text-indigo-300" : "text-slate-400 hover:bg-[#0f172a] hover:text-slate-50"
      )}
    >
      <span className={cn("flex-shrink-0", active ? "text-indigo-400" : "text-slate-500")}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
      </span>
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none",
        active ? "text-indigo-400" : "text-slate-500"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
