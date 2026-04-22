export interface ExportContext {
  translations: {
    title: string;
    progress: string;
    sectionOther: string;
    sectionBuy: string;
    sectionGather: string;
    sectionCraft: string;
    targetPrice: string;
    buySourceVendor: string;
    buySourceMarket: string;
    exportOfflineNote: string;
  };
  pageTitle: string;
  includeMarket: boolean;
  isDarkMode: boolean;
  formatMoney: (val: number | null) => string;
  getLocalizedName: (name: any) => string;
  getJobName: (name: string) => string;
  renderStars: (stars: number) => string;
}

export function generateTodoExportHtml(sections: any[], ctx: ExportContext): string {
  const getSectionConfig = (key: string) => {
    switch (key) {
      case 'other': return { color: 'emerald', icon: 'pi-box', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'buy': return { color: 'slate', icon: 'pi-shopping-cart', bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-200 dark:border-slate-700/50', text: 'text-slate-600 dark:text-slate-400' };
      case 'gather': return { color: 'amber', icon: 'pi-map-marker', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
      case 'craft': return { color: 'indigo', icon: 'pi-hammer', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' };
      default: return { color: 'slate', icon: 'pi-list', bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-100 dark:border-slate-800', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  const sectionLabelObj: Record<string, string> = {
    'other': ctx.translations.sectionOther,
    'buy': ctx.translations.sectionBuy,
    'gather': ctx.translations.sectionGather,
    'craft': ctx.translations.sectionCraft,
  };

  const sectionsHtml = sections.filter(s => s.items && s.items.length > 0).map(section => {
    const config = getSectionConfig(section.key);
    
    // Generate items
    const itemsHtml = section.items.map((item: any) => {
      let infoColumnHtml = '';
      
      const itemIdId = `${section.key}_${item.id}`;

      if (section.key === 'buy' && ctx.includeMarket) {
        infoColumnHtml = `
          <div class="hidden md:flex flex-col items-end justify-center px-4 md:px-8 border-r border-slate-100 dark:border-slate-800 min-w-0 md:min-w-[220px]">
            <span class="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">${ctx.translations.targetPrice}</span>
            <span class="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400 font-mono tracking-tight leading-none shrink-0 mb-1">${ctx.formatMoney(item.marketPrice)}</span>
            ${item.purchaseInfo ? `
            <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
              <i class="pi ${item.purchaseInfo.type === 'vendor' ? 'pi-map-marker text-indigo-500 dark:text-indigo-400' : 'pi-shopping-cart text-sky-500 dark:text-sky-400'}"></i>
              <span>${item.purchaseInfo.type === 'vendor' ? 
                ctx.translations.buySourceVendor
                  .replace('{name}', item.purchaseInfo.vendor?.npcName || '')
                  .replace('{zone}', item.purchaseInfo.vendor?.zoneName || '')
                  .replace('{x}', item.purchaseInfo.vendor?.coords?.x?.toFixed(1) || '??')
                  .replace('{y}', item.purchaseInfo.vendor?.coords?.y?.toFixed(1) || '??') 
                : 
                ctx.translations.buySourceMarket.replace('{world}', item.purchaseInfo.worldName || '')
              }</span>
            </div>
            ` : ''}
          </div>
        `;
      } else if (section.key === 'gather' && item.gathering) {
        infoColumnHtml = `
          <div class="hidden md:flex flex-col items-end justify-center px-4 md:px-8 border-r border-slate-100 dark:border-slate-800 min-w-0 md:min-w-[220px]">
            <div class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <i class="pi pi-map-marker text-[10px] md:text-xs opacity-70"></i>
                <span class="text-[15px] md:text-[17px] font-black tracking-tight leading-none truncate max-w-[150px]">
                    ${item.gathering.parentZoneName || ctx.getLocalizedName(item.gathering.zoneName)}
                </span>
            </div>
            <span class="mt-2 text-[10px] md:text-sm font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/40 leading-none">
                ${ctx.getJobName(item.gathering.jobName)} Lv.${item.gathering.level}${ctx.renderStars(item.gathering.stars)}
            </span>
          </div>
        `;
      } else if (section.key === 'craft' && item.crafting) {
        infoColumnHtml = `
          <div class="hidden md:flex flex-col items-end justify-center px-4 md:px-8 border-r border-slate-100 dark:border-slate-800 min-w-0 md:min-w-[220px]">
             <span class="text-[10px] md:text-sm font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40 leading-none whitespace-nowrap">
                ${ctx.getJobName(item.crafting.jobName)} Lv.${item.crafting.level}${ctx.renderStars(item.crafting.stars)}
            </span>
          </div>
        `;
      }

      return `
        <div class="item-card bg-white/90 dark:bg-[#0f172a] backdrop-blur-md rounded-2xl border-2 border-white dark:border-slate-800 shadow-sm flex items-center p-3 md:p-4 gap-3 md:gap-6 cursor-pointer select-none transition-all duration-300 relative group" 
             data-id="${itemIdId}" 
             onclick="toggleCheck(this)">
            
            <div class="flex items-center gap-1.5 md:gap-3">
                <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-200 dark:text-slate-700 hover:text-soft-green-400 p-1 md:p-2 hidden sm:block" onclick="event.stopPropagation()">
                    <i class="pi pi-ellipsis-v text-sm"></i><i class="pi pi-ellipsis-v text-sm -ml-1"></i>
                </div>
                <div class="check-box w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 transition-all duration-300">
                    <i class="pi pi-check text-white text-sm md:text-base font-black hidden"></i>
                </div>
            </div>
 
            <div class="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                <div class="relative shrink-0">
                    <img src="${item.icon}" class="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700" />
                </div>
                <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
                        <h4 class="item-title font-black text-base md:text-xl lg:text-2xl truncate leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                            ${ctx.getLocalizedName(item.name).replace(/"/g, '&quot;').replace(/'/g, '&#39;')}
                        </h4>
                        <button onclick="copyToClipboard(this, '${ctx.getLocalizedName(item.name).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                                class="copy-btn opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-soft-green-600 dark:hover:text-soft-green-400 transition-all active:scale-95 flex items-center justify-center shrink-0"
                                title="Copy Name">
                            <i class="pi pi-copy text-sm md:text-base"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60 shrink-0">#${item.id}</span>
                    </div>
                </div>
            </div>
 
            ${infoColumnHtml}
 
            <div class="flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-800/30 rounded-xl px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[110px] border border-slate-200/50 dark:border-slate-700/30 shadow-inner">
                <div class="flex items-baseline gap-0.5 md:gap-1">
                    <span class="text-xs md:text-base font-black text-slate-400 dark:text-slate-600 leading-none">x</span>
                    <span class="text-2xl md:text-4xl font-black text-soft-green-950 dark:text-soft-green-400 leading-none">${item.quantity}</span>
                </div>
            </div>
        </div>
      `;
    }).join('');

    return `
      <section class="todo-section mb-12">
          <div class="flex items-center gap-4 md:gap-6 mb-6 px-2">
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 shrink-0 ${config.bg} ${config.border} border-2">
                  <i class="pi ${config.icon} ${config.text} text-xl md:text-3xl"></i>
              </div>
              <div>
                  <h3 class="text-xl md:text-2xl font-black tracking-tight leading-none mb-1 ${config.text}">
                      ${sectionLabelObj[section.key]}
                  </h3>
                  <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] opacity-70">
                      ${section.items.length} ITEMS
                  </p>
              </div>
              <div class="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent ml-2 md:ml-4"></div>
          </div>
          <div class="sortable-list space-y-4 px-1" data-section="${section.key}">
            ${itemsHtml}
          </div>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ctx.pageTitle}</title>
    <link rel="icon" type="image/png" href="https://emu-rabbit.github.io/frozen_rabbit_workshop/logo.png" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://unpkg.com/primeicons/primeicons.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        'soft-green': { 50: '#f2fdf7', 100: '#e1f9ee', 200: '#c5f2dd', 300: '#92c5b2', 400: '#75bfa9', 500: '#52a890', 600: '#3e8f7a', 700: '#388e3c', 800: '#2e7d32', 900: '#2d6a5a', 950: '#1b4137' }
                    }
                }
            }
        }
    </script>
    <style>
        .ghost-item { opacity: 0.4; background: #f1f5f9; border: 2px dashed #92c5b2 !important; border-radius: 1rem !important; transform: scale(0.98); }
        .dark .ghost-item { background: #1e293b !important; border-color: #3e8f7a !important; }
        .checked-card { border-color: #f1f5f9 !important; opacity: 0.6; filter: grayscale(0.3); }
        .dark .checked-card { border-color: #0f172a !important; background-color: rgba(15, 23, 42, 0.5) !important; }
        .checked-card .check-box { background-color: #52a890; border-color: #52a890; }
        .checked-card .check-box i { display: block; }
        .checked-card .item-title { text-decoration: line-through; color: #94a3b8; }
        .dark .checked-card .item-title { color: #475569; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        .dark ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb { background: #334155; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
</head>
<body class="${ctx.isDarkMode ? 'dark bg-slate-950' : 'bg-soft-green-50/50'} min-h-screen font-sans pb-32 transition-colors duration-500">
    <div class="px-4 py-6 md:p-6 max-w-6xl w-full mx-auto">
        <header class="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-4">
           <div>
               <h2 class="text-2xl md:text-3xl font-black text-soft-green-950 dark:text-soft-green-500 tracking-tight">${ctx.pageTitle}</h2>
               <p class="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 mb-2 tracking-wide">${ctx.translations.exportOfflineNote}</p>
           </div>
           
           <div class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-5 py-3 md:px-6 md:py-4 rounded-xl border border-soft-green-100 dark:border-slate-800 shadow-lg flex items-center min-w-[300px]">
              <div class="flex flex-col flex-1">
                 <div class="flex items-center justify-between mb-1 gap-4">
                    <span class="text-[11px] md:text-[13px] font-black text-soft-green-500 dark:text-soft-green-500 uppercase tracking-widest text-progress-label">${ctx.translations.progress.replace('{n}', '0')}</span>
                    <span class="text-xl md:text-2xl font-black text-soft-green-900 dark:text-soft-green-400 font-mono tracking-tighter text-progress-percent">0%</span>
                 </div>
                 <div class="h-2 md:h-2.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full bg-gradient-to-r from-soft-green-400 to-soft-green-600 dark:from-soft-green-500 dark:to-soft-green-700 transition-all duration-700 ease-out progress-bar" style="width: 0%"></div>
                 </div>
              </div>
           </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-12">
                ${sectionsHtml}
            </div>
        </div>
    </div>

    <script>
        let totalItems = document.querySelectorAll('.item-card').length;
        
        function updateProgress() {
            let completedItems = document.querySelectorAll('.checked-card').length;
            let percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
            
            document.querySelector('.progress-bar').style.width = Math.round(percentage) + '%';
            document.querySelector('.text-progress-percent').innerText = Math.round(percentage) + '%';
            
            let labelTemplate = \`${ctx.translations.progress}\`;
            let newLabel = labelTemplate.replace('{n}', completedItems).replace('{total}', totalItems);
            document.querySelector('.text-progress-label').innerText = newLabel;
        }

        function toggleCheck(el) {
            el.classList.toggle('checked-card');
            updateProgress();
        }

        function copyToClipboard(btn, text) {
            event.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
                const icon = btn.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'pi pi-check text-soft-green-600 text-sm md:text-base';
                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            updateProgress();
            
            document.querySelectorAll('.sortable-list').forEach(list => {
                new Sortable(list, {
                    animation: 300,
                    handle: '.drag-handle',
                    ghostClass: 'ghost-item'
                });
            });
        });
    </script>
</body>
</html>`;
}
