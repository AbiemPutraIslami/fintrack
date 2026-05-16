import fs from 'fs';

const files = [
  'src/components/FinTrackApp.tsx',
  'src/components/AnalysisView.tsx'
];

const replacements = [
  // Chart Colors
  [/#E5E7EB/gi, '#334155'], // Grid stroke
  [/#f3f4f6/gi, '#334155'], // Grid stroke
  [/#6b7280/gi, '#94a3b8'], // Tick text fill
  [/#e5e7eb/gi, '#334155'], // Remaining bar fill in budget

  // Other remaining tailwind colors that didn't match previous format or were missed
  [/text-gray-900/g, 'text-slate-50'],
  [/bg-white/g, 'bg-[#1e293b]'],
  [/border-gray-200/g, 'border-slate-700'],
  [/border-gray-100/g, 'border-slate-700/50'],

  // Hardcoded inner UI gradients that shouldn't be touched or can be handled:
  // "from-indigo-600 to-violet-600" is probably fine, but we can make it lighter if needed.
  
  // Custom scrollbar
  
  // Content Tooltip in Recharts overrides background. Let's find "contentStyle="
  [/contentStyle={{/g, "contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc',"],
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(file, content);
  console.log(`Updated ${file} for charts`);
}
