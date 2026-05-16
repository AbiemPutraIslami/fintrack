import { useState, useEffect, useCallback, useMemo } from "react";
import { Transaction, FinanceSummary, Account, Reminder, Budget } from "../types/finance";
import { useAuth } from "./useAuth";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

const STORAGE_KEY = "fintrack_transactions";
const CATEGORIES_KEY = "fintrack_categories";
const ACCOUNTS_KEY = "fintrack_accounts";
const REMINDERS_KEY = "fintrack_reminders";
const BUDGETS_KEY = "fintrack_budgets";

// Helper to generate IDs
const generateId = () => crypto.randomUUID();

export const DEFAULT_EXPENSE_CATEGORIES = ['Makanan', 'Transportasi', 'Tagihan', 'Hiburan', 'Belanja', 'Kesehatan', 'Lainnya'];
export const DEFAULT_INCOME_CATEGORIES = ['Gaji', 'Pekerjaan Lepas', 'Investasi', 'Hadiah', 'Lainnya'];

const CATEGORY_ICONS_KEY = "fintrack_category_icons";

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  'Makanan': 'Utensils',
  'Transportasi': 'Car',
  'Tagihan': 'Receipt',
  'Hiburan': 'Film',
  'Belanja': 'ShoppingCart',
  'Kesehatan': 'HeartPulse',
  'Lainnya': 'MoreHorizontal',
  'Gaji': 'Briefcase',
  'Pekerjaan Lepas': 'Laptop',
  'Investasi': 'TrendingUp',
  'Hadiah': 'Gift'
};

export interface CategoriesState {
  income: string[];
  expense: string[];
}

export function useFinance() {
  const { user, loading: authLoading } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CategoriesState>({
    income: DEFAULT_INCOME_CATEGORIES,
    expense: DEFAULT_EXPENSE_CATEGORIES,
  });
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(DEFAULT_CATEGORY_ICONS);

  // Persistence handler
  const persistState = useCallback(async (
    txs: Transaction[], 
    accs: Account[], 
    rems: Reminder[], 
    buds: Budget[], 
    cats: CategoriesState, 
    icons: Record<string, string>
  ) => {
    // Local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(rems));
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(buds));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
    localStorage.setItem(CATEGORY_ICONS_KEY, JSON.stringify(icons));

    // Firestore
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
          transactions: txs,
          accounts: accs,
          reminders: rems,
          budgets: buds,
          categories: cats,
          categoryIcons: icons
        }, { merge: true });
      } catch (e) {
        console.error("Error saving to Firestore", e);
      }
    }
  }, [user]);


  const saveAccounts = (data: Account[]) => {
    setAccounts(data);
    persistState(transactions, data, reminders, budgets, categories, categoryIcons);
  };
  const saveBudgets = (data: Budget[]) => {
    setBudgets(data);
    persistState(transactions, accounts, reminders, data, categories, categoryIcons);
  };
  const saveReminders = (data: Reminder[]) => {
    setReminders(data);
    persistState(transactions, accounts, data, budgets, categories, categoryIcons);
  };
  const saveTransactions = (data: Transaction[]) => {
    setTransactions(data);
    persistState(data, accounts, reminders, budgets, categories, categoryIcons);
  };
  const saveCategories = (cats: CategoriesState, icons: Record<string, string>) => {
    setCategories(cats);
    setCategoryIcons(icons);
    persistState(transactions, accounts, reminders, budgets, cats, icons);
  };

  // Load from local storage sync
  const loadLocalData = useCallback(() => {
    try {
      let loadedAccounts: Account[] = [];
      const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      if (storedAccounts) {
        loadedAccounts = JSON.parse(storedAccounts);
        setAccounts(loadedAccounts);
      } else {
        const defaultAccount: Account = { id: generateId(), name: 'Dompet Utama', type: 'cash', initialBalance: 0 };
        loadedAccounts = [defaultAccount];
        setAccounts(loadedAccounts);
      }

      let loadedTxs: Transaction[] = [];
      const storedTx = localStorage.getItem(STORAGE_KEY);
      if (storedTx) {
        loadedTxs = JSON.parse(storedTx);
        setTransactions(loadedTxs);
      } else {
        const initialMock: Transaction[] = [
          { id: generateId(), type: 'income', amount: 5000000, category: 'Gaji', note: 'Gaji bulanan', date: new Date().toISOString(), accountId: loadedAccounts[0].id },
          { id: generateId(), type: 'expense', amount: 1500000, category: 'Tagihan', note: 'Bayar kos', date: new Date().toISOString(), accountId: loadedAccounts[0].id },
          { id: generateId(), type: 'expense', amount: 300000, category: 'Makanan', note: 'Makan siang', date: new Date(Date.now() - 86400000).toISOString(), accountId: loadedAccounts[0].id },
        ];
        loadedTxs = initialMock;
        setTransactions(loadedTxs);
      }
      
      let loadedCats = { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES };
      const storedCategories = localStorage.getItem(CATEGORIES_KEY);
      if (storedCategories) {
        loadedCats = JSON.parse(storedCategories);
        setCategories(loadedCats);
      }

      let loadedIcons = { ...DEFAULT_CATEGORY_ICONS };
      const storedIcons = localStorage.getItem(CATEGORY_ICONS_KEY);
      if (storedIcons) {
        loadedIcons = { ...loadedIcons, ...JSON.parse(storedIcons) };
        setCategoryIcons(loadedIcons);
      }

      let loadedReminders: Reminder[] = [];
      const storedReminders = localStorage.getItem(REMINDERS_KEY);
      if (storedReminders) {
        loadedReminders = JSON.parse(storedReminders);
        setReminders(loadedReminders);
      }

      let loadedBudgets: Budget[] = [];
      const storedBudgets = localStorage.getItem(BUDGETS_KEY);
      if (storedBudgets) {
        loadedBudgets = JSON.parse(storedBudgets);
        setBudgets(loadedBudgets);
      }
      
      // If we aren't logged in, save local data back to ensure localStorage is flushed
      if (!user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTxs));
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(loadedAccounts));
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(loadedReminders));
        localStorage.setItem(BUDGETS_KEY, JSON.stringify(loadedBudgets));
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(loadedCats));
        localStorage.setItem(CATEGORY_ICONS_KEY, JSON.stringify(loadedIcons));
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    }
  }, [user]);

  // Handle Firebase snapshot logic
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // User is not logged in, load from local storage
      loadLocalData();
      return;
    }

    // User is logged in, let's setup real-time listener
    const docRef = doc(db, "users", user.uid);
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTransactions(data.transactions || []);
        setAccounts(data.accounts || []);
        setReminders(data.reminders || []);
        setBudgets(data.budgets || []);
        if (data.categories) setCategories(data.categories);
        if (data.categoryIcons) setCategoryIcons(data.categoryIcons);

        // Update local storage as a cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.transactions || []));
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data.accounts || []));
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(data.reminders || []));
        localStorage.setItem(BUDGETS_KEY, JSON.stringify(data.budgets || []));
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data.categories || { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES }));
        localStorage.setItem(CATEGORY_ICONS_KEY, JSON.stringify(data.categoryIcons || DEFAULT_CATEGORY_ICONS));

      } else if (isInitialLoad) {
        // Document doesn't exist, we should upload our local data to Firestore
        loadLocalData();
        // Since loadLocalData uses setTransactions etc, which are batched, we need to explicitly run a save
        // We will just call persistState in the next tick
        setTimeout(() => {
          const accs = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
          const txs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          const rems = JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]");
          const buds = JSON.parse(localStorage.getItem(BUDGETS_KEY) || "[]");
          const cats = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || "null") || { income: DEFAULT_INCOME_CATEGORIES, expense: DEFAULT_EXPENSE_CATEGORIES };
          const icns = JSON.parse(localStorage.getItem(CATEGORY_ICONS_KEY) || "null") || DEFAULT_CATEGORY_ICONS;
          
          setDoc(docRef, {
            transactions: txs,
            accounts: accs,
            reminders: rems,
            budgets: buds,
            categories: cats,
            categoryIcons: icns
          }, { merge: true }).catch(err => console.error(err));
        }, 500);
      }
      isInitialLoad = false;
    }, (error) => {
        console.error("Firestore snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, authLoading, loadLocalData]);


  // Helper methods
  const addReminder = (reminder: Omit<Reminder, "id">) => {
    saveReminders([...reminders, { ...reminder, id: generateId() }]);
  };

  const updateReminder = (id: string, updatedReminder: Omit<Reminder, "id">) => {
    saveReminders(reminders.map(r => r.id === id ? { ...updatedReminder, id } : r));
  };

  const deleteReminder = (id: string) => {
    saveReminders(reminders.filter(r => r.id !== id));
  };

  const addCategory = (type: 'income' | 'expense', newCategory: string) => {
    if (!newCategory.trim()) return;
    saveCategories({ ...categories, [type]: [...categories[type], newCategory.trim()] }, categoryIcons);
  };

  const editCategory = (type: 'income' | 'expense', oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const finalNewName = newName.trim();
    
    const updatedCats = {
      ...categories,
      [type]: categories[type].map(c => c === oldName ? finalNewName : c)
    };

    let updatedIcons = categoryIcons;
    if (categoryIcons[oldName]) {
      updatedIcons = { ...categoryIcons, [finalNewName]: categoryIcons[oldName] };
    }
    
    setCategories(updatedCats);
    setCategoryIcons(updatedIcons);
    
    const updatedTransactions = transactions.map(t => 
      (t.type === type && t.category === oldName) ? { ...t, category: finalNewName } : t
    );

    persistState(updatedTransactions, accounts, reminders, budgets, updatedCats, updatedIcons);
  };

  const deleteCategory = (type: 'income' | 'expense', categoryName: string) => {
    const fallback = 'Lainnya';
    const updatedCats = {
      ...categories,
      [type]: categories[type].filter(c => c !== categoryName)
    };
    
    if (!updatedCats[type].includes(fallback)) {
      updatedCats[type].push(fallback);
    }

    setCategories(updatedCats);

    const updatedTransactions = transactions.map(t => 
      (t.type === type && t.category === categoryName) ? { ...t, category: fallback } : t
    );

    persistState(updatedTransactions, accounts, reminders, budgets, updatedCats, categoryIcons);
  };

  const reorderCategory = (type: 'income' | 'expense', startIndex: number, endIndex: number) => {
    const list = Array.from(categories[type]);
    const [removed] = list.splice(startIndex, 1);
    list.splice(endIndex, 0, removed);
    
    saveCategories({ ...categories, [type]: list }, categoryIcons);
  };

  const updateCategoryIcon = (categoryName: string, iconName: string) => {
    saveCategories(categories, { ...categoryIcons, [categoryName]: iconName });
  };

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    saveTransactions([{ ...transaction, id: generateId() }, ...transactions]);
  };

  const importTransactions = (newTransactions: Omit<Transaction, "id">[]) => {
    const transactionsToAdd = newTransactions.map(tx => ({ ...tx, id: generateId() }));
    saveTransactions([...transactionsToAdd, ...transactions]);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Omit<Transaction, "id">>) => {
    saveTransactions(transactions.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const deleteTransaction = (id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const addAccount = (account: Omit<Account, "id">) => {
    saveAccounts([...accounts, { ...account, id: generateId() }]);
  };

  const updateAccount = (id: string, updatedFields: Partial<Omit<Account, "id">>) => {
    saveAccounts(accounts.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)));
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return; 
    
    const fallbackAccountId = accounts.find(a => a.id !== id)?.id;
    if (fallbackAccountId) {
      const updatedTx = transactions.map(t => {
        let updated = { ...t };
        if (updated.accountId === id) updated.accountId = fallbackAccountId;
        if (updated.toAccountId === id) updated.toAccountId = fallbackAccountId;
        return updated;
      });
      setTransactions(updatedTx);
      persistState(updatedTx, accounts.filter((a) => a.id !== id), reminders, budgets, categories, categoryIcons);
    } else {
      saveAccounts(accounts.filter((a) => a.id !== id));
    }
  };

  const updateBudget = (category: string, monthlyLimit: number) => {
    const existingIndex = budgets.findIndex(b => b.category === category);
    if (existingIndex >= 0) {
      const updated = [...budgets];
      updated[existingIndex] = { category, monthlyLimit };
      saveBudgets(updated);
    } else {
      saveBudgets([...budgets, { category, monthlyLimit }]);
    }
  };

  const deleteBudget = (category: string) => {
    saveBudgets(budgets.filter(b => b.category !== category));
  };

  const summary = useMemo<FinanceSummary>(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
      if (t.type === "transfer" && t.transferCharge) expense += t.transferCharge;
    });
    
    const initialTotal = accounts.reduce((accTotal, a) => accTotal + (a.initialBalance || 0), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: initialTotal + income - expense,
    };
  }, [transactions, accounts]);

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
    categoryIcons,
    updateCategoryIcon,
    addTransaction,
    importTransactions,
    updateTransaction,
    deleteTransaction,
    addCategory,
    editCategory,
    deleteCategory,
    reorderCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    budgets,
    updateBudget,
    deleteBudget,
    authLoading,
  };
}
