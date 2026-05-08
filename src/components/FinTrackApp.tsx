import React, { useState, useMemo } from 'react';
import { useFinance } from '../hooks/useFinance';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns';
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
import { Transaction, Account, Reminder } from '../types/finance';

const COLORS = ['#22c55e', '#ef4444'];
const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export function FinTrackApp() {
  const { transactions, accounts, summary, categories, addTransaction, updateTransaction, deleteTransaction, addCategory, editCategory, deleteCategory, reorderCategory, addAccount, updateAccount, deleteAccount, reminders, addReminder, updateReminder, deleteReminder } = useFinance();
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'accounts' | 'settings'>('home');
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
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-indigo-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-600" />
            FinTrack
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <DesktopNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Dasbor" />
          <DesktopNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List />} label="Transaksi" />
          <DesktopNavItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<CreditCard />} label="Daftar Akun" />
          <DesktopNavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Pengaturan" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => handleOpenTransactionModal()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Tambah Transaksi
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-600" />
            FinTrack
          </h1>
          <button
            onClick={() => handleOpenTransactionModal()}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 sm:pb-24 pb-24 md:pb-8 space-y-6">
          {activeTab === 'home' && <DashboardView summary={summary} transactions={transactions} accounts={accounts} onEditTransaction={handleOpenTransactionModal} />}
          {activeTab === 'transactions' && <TransactionListView transactions={transactions} accounts={accounts} categories={categories} onDelete={deleteTransaction} onEdit={handleOpenTransactionModal} />}
          {activeTab === 'accounts' && <AccountsView accounts={accounts} onAddAccount={addAccount} onEditAccount={updateAccount} onDeleteAccount={deleteAccount} />}
          {activeTab === 'settings' && <SettingsView categories={categories} onAddCategory={addCategory} onEditCategory={editCategory} onDeleteCategory={deleteCategory} onReorderCategory={reorderCategory} reminders={reminders} onAddReminder={addReminder} onUpdateReminder={updateReminder} onDeleteReminder={deleteReminder} />}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Beranda" />
          <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List />} label="Transaksi" />
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
          onAddCategory={addCategory}
          initialData={editingTransaction}
          accounts={accounts}
        />
      )}
    </div>
  );
}

// --- Subviews ---

function DashboardView({ summary, transactions, accounts, onEditTransaction }: { summary: any, transactions: Transaction[], accounts: Account[], onEditTransaction: (tx: Transaction) => void }) {
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Arus Kas</h3>
          {summary.totalIncome === 0 && summary.totalExpense === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Belum ada data</div>
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

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs h-full flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengeluaran berdasarkan Kategori</h3>
          {expensesByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Belum ada pengeluaran</div>
          ) : (
            <div className="flex-1 min-h-[16rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByCategory} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    tickFormatter={(val: string) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {flowChartData.type === 'trend' ? 'Tren Arus Kas Harian' : 'Arus Kas per Akun'}
          </h3>
          <div className="flex bg-gray-50 p-1 rounded-xl">
            <button onClick={() => setChartPeriod('week')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'week' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}>Minggu</button>
            <button onClick={() => setChartPeriod('month')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'month' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}>Bulan</button>
            <button onClick={() => setChartPeriod('year')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'year' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}>Tahun</button>
            <button onClick={() => setChartPeriod('all')} className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-colors", chartPeriod === 'all' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}>Semua</button>
          </div>
        </div>
        {flowChartData.data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Belum ada data</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowChartData.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transaksi Terakhir</h3>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {recent.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-6">
              <List className="h-10 w-10 mb-2 opacity-20" />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            recent.map(tx => {
              const srcAccount = accounts.find(a => a.id === tx.accountId)?.name;
              const dstAccount = accounts.find(a => a.id === tx.toAccountId)?.name;
              const formattedName = tx.type === 'transfer' ? `${srcAccount} → ${dstAccount}` : srcAccount;
              return (
                <TransactionRow key={tx.id} transaction={tx} accountName={formattedName} onEdit={() => onEditTransaction(tx)} />
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionListView({ transactions, accounts, categories, onDelete, onEdit }: { transactions: Transaction[], accounts: Account[], categories: { income: string[], expense: string[] }, onDelete: (id: string) => void, onEdit: (tx: Transaction) => void }) {
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
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
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        if (!isWithinInterval(txDate, { start, end })) return false;
      } else if (dateFilter === 'custom') {
        if (startDate) {
          const start = startOfDay(new Date(startDate));
          if (txDate < start) return false;
        }
        if (endDate) {
          const end = endOfDay(new Date(endDate));
          if (txDate > end) return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, startDate, endDate, categoryFilter]);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...categories.income, ...categories.expense]));
  }, [categories]);

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-tight hidden md:block">Semua Transaksi</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors md:ml-auto justify-center", showFilters ? "bg-indigo-100 text-indigo-700" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50")}
        >
          <Filter className="h-4 w-4" />
          Filter Data
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rentang Waktu</label>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Waktu</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="custom">Kustom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kategori</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Tanggal</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs shadow-black/5 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <List className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada transaksi yang sesuai.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTransactions.map(tx => {
              const srcAccount = accounts.find(a => a.id === tx.accountId)?.name;
              const dstAccount = accounts.find(a => a.id === tx.toAccountId)?.name;
              const formattedName = tx.type === 'transfer' ? `${srcAccount} → ${dstAccount}` : srcAccount;
              return (
                <TransactionRow key={tx.id} transaction={tx} accountName={formattedName} showDelete onDelete={() => onDelete(tx.id)} onEdit={() => onEdit(tx)} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const CategoryItem: React.FC<{
  categoryName: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (type: 'income' | 'expense', oldName: string, newName: string) => void;
  onDelete: (type: 'income' | 'expense', name: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({
  categoryName,
  type,
  isDefault,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(categoryName);

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
      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <input 
          autoFocus
          type="text" 
          value={editName} 
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm bg-white border-2 border-indigo-500 rounded-md outline-none"
        />
        <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">Simpan</button>
        <button onClick={() => { setIsEditing(false); setEditName(categoryName); }} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs group">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button 
            onClick={onMoveUp} 
            disabled={isFirst}
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            onClick={onMoveDown}
            disabled={isLast}
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <span className="text-gray-800 font-medium">{categoryName}</span>
      </div>
      <div className="flex items-center gap-2">
        {(isDefault || categoryName === 'Lainnya') && (
          <span className="text-xs font-medium text-gray-400 px-2 bg-gray-50 py-1 rounded-md">Bawaan</span>
        )}
        {!isDefault && categoryName !== 'Lainnya' && categoryName !== 'Other' && (
          <>
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors">Edit</button>
            <button onClick={handleDelete} className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AccountsView({ 
  accounts, 
  onAddAccount, 
  onEditAccount, 
  onDeleteAccount 
}: { 
  accounts: (Account & { currentBalance?: number })[], 
  onAddAccount: (acc: Omit<Account, 'id'>) => void, 
  onEditAccount: (id: string, acc: Partial<Omit<Account, 'id'>>) => void,
  onDeleteAccount: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'ewallet'>('bank');
  const [initialBalance, setInitialBalance] = useState('');

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
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors hover:bg-indigo-700 md:ml-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    {acc.type === 'bank' ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{acc.type === 'ewallet' ? 'E-Wallet' : acc.type}</p>
                  </div>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity gap-1">
                  <button onClick={() => handleEdit(acc)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1">Edit</button>
                  {accounts.length > 1 && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Hapus akun ${acc.name}? Transaksi akan dipindahkan ke akun lain.`)) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm pb-1 text-gray-500">Saldo Saat Ini</p>
                <p className="text-3xl font-bold text-gray-900">{formatRupiah(acc.currentBalance || 0)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-0">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAdding(false)} />
           <div className="relative bg-white md:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
             <div className="flex justify-between items-center p-6 border-b border-gray-100">
               <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Akun' : 'Tambah Akun'}</h2>
               <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
                 <X className="h-5 w-5" />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun / Bank</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none" placeholder="Mis. BCA, Gopay, Dompet" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Akun</label>
                 <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none">
                   <option value="bank">Bank</option>
                   <option value="cash">Tunai (Kas)</option>
                   <option value="ewallet">E-Wallet</option>
                 </select>
               </div>
               {!editingId && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal (Rp)</label>
                   <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none" placeholder="0" />
                 </div>
               )}
               <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors mt-6">
                 Simpan
               </button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}

function SettingsView({ 
  categories, 
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
  onAddCategory: (type: 'income' | 'expense', name: string) => void;
  onEditCategory: (type: 'income' | 'expense', oldName: string, newName: string) => void; 
  onDeleteCategory: (type: 'income' | 'expense', categoryName: string) => void;
  onReorderCategory: (type: 'income' | 'expense', startIndex: number, endIndex: number) => void;
  reminders: Reminder[];
  onAddReminder: (r: Omit<Reminder, "id">) => void;
  onUpdateReminder: (id: string, r: Omit<Reminder, "id">) => void;
  onDeleteReminder: (id: string) => void;
}) {
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
              onEdit={onEditCategory} 
              onDelete={onDeleteCategory} 
              onMoveUp={() => onReorderCategory(type, index, index - 1)}
              onMoveDown={() => onReorderCategory(type, index, index + 1)}
            />
          );
        })}
        {addingType === type ? (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <input 
              autoFocus
              type="text" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nama Kategori Baru"
              className="flex-1 px-3 py-1.5 text-sm bg-white border-2 border-indigo-500 rounded-md outline-none"
            />
            <button onClick={() => handleAddCategory(type)} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">Tambah</button>
            <button onClick={() => { setAddingType(null); setNewCatName(''); }} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setAddingType(type); setNewCatName(''); }}
            className="flex items-center justify-center w-full gap-2 p-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors mt-2"
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sinkronisasi</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-900">Penyimpanan Lokal</h4>
              <p className="text-sm text-gray-500">Data tersimpan otomatis di perangkat.</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Aktif</div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">Sinkronisasi Cloud (Firebase) akan diaktifkan di masa mendatang setelah penyiapan backend selesai.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Pengeluaran</h3>
          {renderCategoryList('expense')}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Pemasukan</h3>
          {renderCategoryList('income')}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pengingat Tagihan & Transaksi</h3>
            <button 
              onClick={openAddReminder}
              className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Belum ada pengingat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-xs hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", r.type === 'expense' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {r.frequency} • <span className="font-medium text-indigo-600">{format(parseISO(r.nextDueDate), 'dd MMM yyyy')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("font-bold text-sm", r.type === 'expense' ? "text-red-600" : "text-green-600")}>
                      {r.type === 'expense' ? '-' : '+'}{formatCurrency(r.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditReminder(r)} className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors">Edit</button>
                      <button onClick={() => onDeleteReminder(r.id)} className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors">
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
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center p-6 border-b border-gray-100">
               <h2 className="text-xl font-bold text-gray-900">{editingReminderId ? 'Edit Pengingat' : 'Tambah Pengingat'}</h2>
               <button onClick={() => setIsAddingReminder(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
                 <X className="h-5 w-5" />
               </button>
             </div>
             <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Judul / Nama Tagihan</label>
                 <input 
                   type="text" 
                   value={reminderTitle}
                   onChange={e => setReminderTitle(e.target.value)}
                   className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   placeholder="Mis. Tagihan Listrik"
                   required
                 />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setReminderType('expense')}
                      className={cn("flex-1 py-1.5 font-medium text-sm rounded-lg transition-all", reminderType === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderType('income')}
                      className={cn("flex-1 py-1.5 font-medium text-sm rounded-lg transition-all", reminderType === 'income' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >
                      Pemasukan
                    </button>
                  </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                   <input 
                     type="number"
                     value={reminderAmount}
                     onChange={e => setReminderAmount(e.target.value)}
                     className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                     placeholder="0"
                     required
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Frekuensi</label>
                   <select 
                     value={reminderFreq}
                     onChange={e => setReminderFreq(e.target.value as any)}
                     className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   >
                     <option value="daily">Harian</option>
                     <option value="weekly">Mingguan</option>
                     <option value="monthly">Bulanan</option>
                     <option value="yearly">Tahunan</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo Berikutnya</label>
                   <input 
                     type="date"
                     value={reminderDate}
                     onChange={e => setReminderDate(e.target.value)}
                     className="w-full px-4 py-2.5 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                     required
                   />
                 </div>
               </div>
               <div className="pt-2">
                 <button 
                   onClick={saveReminder}
                   disabled={!reminderTitle.trim() || !reminderAmount || isNaN(Number(reminderAmount)) || !reminderDate}
                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-md focus:ring-4 focus:ring-indigo-100"
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
  onAddCategory,
  initialData,
  accounts
}: { 
  onClose: () => void; 
  onSave: (tx: Omit<Transaction, "id">) => void;
  categories: { income: string[], expense: string[] };
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
      <div className="relative bg-white md:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex flex-col overflow-y-auto">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'income' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={cn("flex-1 py-2 font-medium text-sm rounded-lg transition-all", type === 'transfer' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Transfer
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp/IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">Rp</span>
              <input 
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-lg font-semibold transition-all outline-none"
                placeholder="0"
                step="any"
              />
            </div>
          </div>

          {accounts.length > 0 && (
            <div className={cn("grid gap-4", type === 'transfer' ? "grid-cols-2" : "grid-cols-1")}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'transfer' ? 'Dari Akun' : 'Akun'}
                </label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                >
                  {accounts.map((acc: Account) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ke Akun</label>
                  <select 
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
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
               <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Transfer (Rp/IDR)</label>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-md">Rp</span>
                 <input 
                   type="number"
                   value={transferCharge}
                   onChange={e => setTransferCharge(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                   placeholder="0 (Opsional)"
                   step="any"
                 />
               </div>
             </div>
          )}

          {type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              {!isCustomCategory ? (
                <select 
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none appearance-none"
                >
                  {activeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom" className="font-semibold text-indigo-600">+ Tambah Kategori Baru</option>
                </select>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    autoFocus
                    required
                    value={customCategoryName}
                    onChange={e => setCustomCategoryName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white border-2 border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
                    placeholder="Mis. Bonus, Langganan..."
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsCustomCategory(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
            <input 
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-xl text-md transition-all outline-none"
              placeholder={type === 'transfer' ? "Mis. Uang saku bulanan" : "Mis. Makan siang dengan klien"}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors active:scale-[0.98]"
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
      type === 'balance' ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-600/20" : "bg-white text-gray-900 border-gray-100"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className={cn("text-sm font-medium", type === 'balance' ? "text-indigo-100" : "text-gray-500")}>{title}</span>
        {isIncome && <TrendingUp className="h-5 w-5 text-green-500" />}
        {isExpense && <TrendingDown className="h-5 w-5 text-red-500" />}
        {type === 'balance' && <Wallet className="h-5 w-5 text-indigo-200" />}
      </div>
      <div className="text-3xl font-bold tracking-tight">
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

const TransactionRow: React.FC<{ transaction: Transaction, accountName?: string, showDelete?: boolean, onDelete?: () => void, onEdit?: () => void }> = ({ transaction, accountName, showDelete, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  return (
    <div className="flex flex-col group border-b last:border-0 border-gray-50 md:border-b-0 animate-in fade-in duration-300">
      <div 
        className={cn("flex items-center justify-between p-4 bg-white md:bg-transparent md:hover:bg-gray-50 rounded-xl md:rounded-none transition-colors", "cursor-pointer")}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0",
            isTransfer ? "bg-blue-100 text-blue-600" : isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          )}>
            {isTransfer ? <ArrowRightLeft className="h-5 w-5 md:h-6 md:w-6" /> : isIncome ? <TrendingUp className="h-5 w-5 md:h-6 md:w-6" /> : <TrendingDown className="h-5 w-5 md:h-6 md:w-6" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{isTransfer ? 'Transfer' : transaction.category}</p>
            <div className="flex items-center text-xs md:text-sm text-gray-500 gap-1 md:gap-2">
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
          <span className={cn("font-bold text-right text-sm md:text-base", isTransfer ? "text-blue-600" : isIncome ? "text-green-600" : "text-gray-900")}>
            {isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            {isTransfer && transaction.transferCharge ? (
              <span className="block text-xs font-normal text-red-500 whitespace-nowrap mt-0.5">-{formatCurrency(transaction.transferCharge)} (biaya)</span>
            ) : null}
          </span>
          <button 
            className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 md:px-16 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 text-sm">
            {isTransfer && (
              <>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Dari Akun</span>
                  <span className="font-medium text-gray-900">{accountName?.split(' → ')[0] || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Ke Akun</span>
                  <span className="font-medium text-gray-900">{accountName?.split(' → ')[1] || '-'}</span>
                </div>
                {(transaction.transferCharge ?? 0) > 0 && (
                  <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                    <span className="text-red-700 font-medium flex items-center gap-1.5 shadow-sm">
                      <TrendingDown className="w-4 h-4" /> Biaya Transfer (Fee)
                    </span>
                    <span className="font-bold text-red-600">-{formatCurrency(transaction.transferCharge!)}</span>
                  </div>
                )}
              </>
            )}
            {!isTransfer && accountName && (
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500">Akun</span>
                <span className="font-medium text-gray-900">{accountName}</span>
              </div>
            )}
            <div className="flex justify-between items-start pt-1">
              <span className="text-gray-500 whitespace-nowrap mr-4">Catatan</span>
              <span className="font-medium text-gray-900 text-right">{transaction.note || '-'}</span>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-gray-200">
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors border border-indigo-200"
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
        active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <span className={cn("flex-shrink-0", active ? "text-indigo-600" : "text-gray-400")}>
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
        active ? "text-indigo-600" : "text-gray-400"
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
