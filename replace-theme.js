import fs from 'fs';

const files = [
  'src/components/FinTrackApp.tsx',
  'src/components/AnalysisView.tsx'
];

const replacements = [
  // Backgrounds
  [/bg-white/g, 'bg-[#1e293b]'],
  [/bg-gray-50/g, 'bg-[#0f172a]'],
  [/bg-gray-100/g, 'bg-slate-700/50'],
  [/bg-gray-200/g, 'bg-slate-700'],
  
  // Text colors
  [/text-gray-900/g, 'text-slate-50'],
  [/text-gray-800/g, 'text-slate-200'],
  [/text-gray-700/g, 'text-slate-300'],
  [/text-gray-600/g, 'text-slate-400'],
  [/text-gray-500/g, 'text-slate-400'],
  [/text-gray-400/g, 'text-slate-500'],
  [/text-black/g, 'text-white'],
  
  // Borders
  [/border-gray-100/g, 'border-slate-700/50'],
  [/border-gray-200/g, 'border-slate-700'],
  [/border-gray-300/g, 'border-slate-600'],
  [/divide-gray-50/g, 'divide-slate-700/50'],
  [/divide-gray-100/g, 'divide-slate-700/50'],
  [/divide-gray-200/g, 'divide-slate-700'],
  
  // Hover states
  [/hover:bg-gray-50/g, 'hover:bg-slate-800'],
  [/hover:bg-gray-100/g, 'hover:bg-slate-700'],
  [/hover:text-gray-900/g, 'hover:text-white'],
  [/hover:text-gray-700/g, 'hover:text-slate-200'],

  // Brand colors adjustments (for dark mode)
  [/text-indigo-600/g, 'text-indigo-400'],
  [/text-indigo-700/g, 'text-indigo-300'],
  [/text-indigo-900/g, 'text-indigo-100'],
  [/bg-indigo-50/g, 'bg-indigo-500/10'],
  [/bg-indigo-100/g, 'bg-indigo-500/20'],
  [/bg-indigo-600/g, 'bg-indigo-500'],
  [/hover:bg-indigo-50/g, 'hover:bg-indigo-500/20'],
  [/hover:bg-indigo-700/g, 'hover:bg-indigo-400'],
  
  // Success / Danger / Warning colors adjustments
  [/text-emerald-600/g, 'text-emerald-400'],
  [/text-emerald-700/g, 'text-emerald-300'],
  [/bg-emerald-50/g, 'bg-emerald-500/10'],
  [/bg-emerald-100/g, 'bg-emerald-500/20'],
  
  [/text-rose-600/g, 'text-rose-400'],
  [/text-rose-500/g, 'text-rose-400'],
  [/bg-rose-50/g, 'bg-rose-500/10'],
  [/bg-rose-100/g, 'bg-rose-500/20'],
  [/text-red-500/g, 'text-red-400'],
  [/text-red-600/g, 'text-red-400'],
  [/bg-red-50/g, 'bg-red-500/10'],
  [/bg-red-500/g, 'bg-red-500/80'],
  
  [/text-amber-500/g, 'text-amber-400'],
  [/text-amber-600/g, 'text-amber-400'],
  [/bg-amber-50/g, 'bg-amber-500/10'],
  [/bg-amber-400/g, 'bg-amber-500/80']
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
