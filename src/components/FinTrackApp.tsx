import React, { useState, useMemo } from 'react';
import { useFinance } from '../hooks/useFinance';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
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
  ArrowRightLeft
} from 'lucide-react';
import { Transaction, Account } from '../types/finance';

const COLORS = ['#22c55e', '#ef4444'];
const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export function FinTrackApp() {
  const { transactions, accounts, summary, categories, addTransaction, updateTransaction, deleteTransaction, addCategory, editCategory, deleteCategory, addAccount, updateAccount, deleteAccount } = useFinance();
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
          {activeTab === 'settings' && <SettingsView categories={categories} onEditCategory={editCategory} onDeleteCategory={deleteCategory} />}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2 pb-safe">
          <MobileNavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home />} label="Beranda" />
          <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List />} label="Daftar" />
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
  onEdit: (type: 'income' | 'expense', oldName: string, newName: string) => void;
  onDelete: (type: 'income' | 'expense', name: string) => void;
}> = ({
  categoryName,
  type,
  isDefault,
  onEdit,
  onDelete
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
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
      <span className="text-gray-800 font-medium">{categoryName}</span>
      {!isDefault && categoryName !== 'Other' && (
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors">Edit</button>
          <button onClick={handleDelete} className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      {(isDefault || categoryName === 'Lainnya') && (
        <span className="text-xs font-medium text-gray-400 px-2 bg-gray-50 py-1 rounded-md">Bawaan</span>
      )}
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
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAdding(false)} />
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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

  onEditCategory, 
  onDeleteCategory 
}: { 
  categories: { income: string[], expense: string[] }; 
  onEditCategory: (type: 'income' | 'expense', oldName: string, newName: string) => void; 
  onDeleteCategory: (type: 'income' | 'expense', categoryName: string) => void;
}) {

  const renderCategoryList = (type: 'income' | 'expense') => {
    const list = categories[type];
    const defaultList = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    
    return (
      <div className="space-y-2 mt-3">
        {list.map(cat => {
          const isDefault = defaultList.includes(cat);
          return (
            <CategoryItem 
              key={cat} 
              categoryName={cat} 
              type={type} 
              isDefault={isDefault} 
              onEdit={onEditCategory} 
              onDelete={onDeleteCategory} 
            />
          );
        })}
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
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex flex-col max-h-[80vh] overflow-y-auto">
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
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  return (
    <div 
      className={cn("flex items-center justify-between p-4 bg-white md:bg-transparent md:hover:bg-gray-50 rounded-xl md:rounded-none transition-colors group", onEdit && "cursor-pointer")}
      onClick={() => onEdit && onEdit()}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
          isTransfer ? "bg-blue-100 text-blue-600" : isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        )}>
          {isTransfer ? <ArrowRightLeft className="h-6 w-6" /> : isIncome ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{isTransfer ? 'Transfer' : transaction.category}</p>
          <div className="flex items-center text-sm text-gray-500 gap-2">
            <span>{format(parseISO(transaction.date), 'dd MMM yyyy')}</span>
            {accountName && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="truncate max-w-[100px]">{accountName}</span>
              </>
            )}
            {transaction.note && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="truncate max-w-[100px] sm:max-w-[200px]">{transaction.note}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={cn("font-bold", isTransfer ? "text-blue-600" : isIncome ? "text-green-600" : "text-gray-900")}>
          {isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
        {showDelete && onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all md:focus:opacity-100"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
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
