import { useState, useEffect, useCallback, useMemo } from "react";
import { Transaction, FinanceSummary, Account } from "../types/finance";


const STORAGE_KEY = "fintrack_transactions";
const CATEGORIES_KEY = "fintrack_categories";
const ACCOUNTS_KEY = "fintrack_accounts";

// Helper to generate IDs
const generateId = () => crypto.randomUUID();


export const DEFAULT_EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Tagihan', 'Hiburan', 'Belanja', 'Kesehatan', 'Lainnya'];
export const DEFAULT_INCOME_CATEGORIES = ['Gaji', 'Pekerjaan Lepas', 'Investasi', 'Hadiah', 'Lainnya'];

export interface CategoriesState {
  income: string[];
  expense: string[];
}

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<CategoriesState>({
    income: DEFAULT_INCOME_CATEGORIES,
    expense: DEFAULT_EXPENSE_CATEGORIES,
  });

  const saveAccounts = (data: Account[]) => {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data));
      setAccounts(data);
    } catch (e) {
      console.error("Failed to save accounts", e);
    }
  };

  // Load from local storage
  const loadData = useCallback(() => {
    try {
      let loadedAccounts: Account[] = [];
      const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      if (storedAccounts) {
        loadedAccounts = JSON.parse(storedAccounts);
        setAccounts(loadedAccounts);
      } else {
        const defaultAccount: Account = { id: generateId(), name: 'Dompet Utama', type: 'cash', initialBalance: 0 };
        loadedAccounts = [defaultAccount];
        saveAccounts(loadedAccounts);
      }

      const storedTx = localStorage.getItem(STORAGE_KEY);
      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      } else {
        // Mock data for initial view
        const initialMock: Transaction[] = [
          { id: generateId(), type: 'income', amount: 5000000, category: 'Gaji', note: 'Gaji bulanan', date: new Date().toISOString(), accountId: loadedAccounts[0].id },
          { id: generateId(), type: 'expense', amount: 1500000, category: 'Tagihan', note: 'Bayar kos', date: new Date().toISOString(), accountId: loadedAccounts[0].id },
          { id: generateId(), type: 'expense', amount: 300000, category: 'Makanan', note: 'Makan siang', date: new Date(Date.now() - 86400000).toISOString(), accountId: loadedAccounts[0].id },
        ];
        saveTransactions(initialMock);
      }
      
      const storedCategories = localStorage.getItem(CATEGORIES_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  const saveTransactions = (data: Transaction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTransactions(data);
    } catch (e) {
      console.error("Failed to save transactions", e);
    }
  };

  const addCategory = (type: 'income' | 'expense', newCategory: string) => {
    if (!newCategory.trim()) return;
    const updated = {
      ...categories,
      [type]: [...categories[type], newCategory.trim()]
    };
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      setCategories(updated);
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  };

  const editCategory = (type: 'income' | 'expense', oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const finalNewName = newName.trim();
    
    const updated = {
      ...categories,
      [type]: categories[type].map(c => c === oldName ? finalNewName : c)
    };
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      setCategories(updated);
    } catch (e) {
      console.error("Failed to save categories", e);
    }

    // Update existing transactions
    const updatedTransactions = transactions.map(t => 
      (t.type === type && t.category === oldName) ? { ...t, category: finalNewName } : t
    );
    saveTransactions(updatedTransactions);
  };

  const deleteCategory = (type: 'income' | 'expense', categoryName: string) => {
    const fallback = 'Lainnya';
    const updated = {
      ...categories,
      [type]: categories[type].filter(c => c !== categoryName)
    };
    
    // Ensure fallback exists
    if (!updated[type].includes(fallback)) {
      updated[type].push(fallback);
    }

    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      setCategories(updated);
    } catch (e) {
      console.error("Failed to save categories", e);
    }

    // Reassign transactions
    const updatedTransactions = transactions.map(t => 
      (t.type === type && t.category === categoryName) ? { ...t, category: fallback } : t
    );
    saveTransactions(updatedTransactions);
  };

  useEffect(() => {
    loadData();

    // Listen for storage events to sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === CATEGORIES_KEY) {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadData]);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTx: Transaction = { ...transaction, id: generateId() };
    saveTransactions([newTx, ...transactions]);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Omit<Transaction, "id">>) => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, ...updatedFields } : t));
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    saveTransactions(updated);
  };

  const summary = useMemo<FinanceSummary>(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
      if (t.type === "transfer" && t.transferCharge) expense += t.transferCharge;
    });
    
    // Calculate global balance based on accounts initial plus income minus expenses
    const initialTotal = accounts.reduce((accTotal, a) => accTotal + (a.initialBalance || 0), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: initialTotal + income - expense,
    };
  }, [transactions, accounts]);

  const addAccount = (account: Omit<Account, "id">) => {
    const newAccount: Account = { ...account, id: generateId() };
    saveAccounts([...accounts, newAccount]);
  };

  const updateAccount = (id: string, updatedFields: Partial<Omit<Account, "id">>) => {
    const updated = accounts.map((a) => (a.id === id ? { ...a, ...updatedFields } : a));
    saveAccounts(updated);
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return; // Must have at least one account
    
    // Fallback transactions to another account
    const fallbackAccountId = accounts.find(a => a.id !== id)?.id;
    if (fallbackAccountId) {
      const updatedTx = transactions.map(t => {
        let updated = { ...t };
        if (updated.accountId === id) updated.accountId = fallbackAccountId;
        if (updated.toAccountId === id) updated.toAccountId = fallbackAccountId;
        return updated;
      });
      saveTransactions(updatedTx);
    }

    const updated = accounts.filter((a) => a.id !== id);
    saveAccounts(updated);
  };

  const accountsWithBalance = useMemo(() => {
    return accounts.map(acc => {
      const txs = transactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id);
      let balance = acc.initialBalance || 0;
      txs.forEach(t => {
        if (t.type === 'income' && t.accountId === acc.id) balance += t.amount;
        else if (t.type === 'expense' && t.accountId === acc.id) balance -= t.amount;
        else if (t.type === 'transfer') {
          if (t.accountId === acc.id) {
            balance -= t.amount;
            if (t.transferCharge) balance -= t.transferCharge;
          }
          if (t.toAccountId === acc.id) {
            balance += t.amount;
          }
        }
      });
      return { ...acc, currentBalance: balance };
    });
  }, [accounts, transactions]);

  return {
    transactions,
    accounts: accountsWithBalance,
    summary,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    editCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
