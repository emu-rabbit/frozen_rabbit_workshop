<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import { useWorkbench } from '../../composables/useWorkbench';
import { useNotes } from '../../composables/useNotes';

const { t, locale } = useI18n();
const { activeWorkbenchNote } = useNotes();
const { 
  generateTodoSections, 
  todoChecked, 
  todoOrder,
  workbenchItems
} = useWorkbench();

const emit = defineEmits(['back']);

// Local storage for draggable items to avoid direct computed mutation
const sectionItems = ref<Record<string, any[]>>({});

// Initialize/Sync local items with computed sections
watch(generateTodoSections, (newSections) => {
    newSections.forEach(section => {
        // Only update if not already being dragged or if length changed
        if (!sectionItems.value[section.key] || sectionItems.value[section.key].length !== section.items.length) {
            sectionItems.value[section.key] = [...section.items];
        } else {
            // Update item data but keeps existing order
            // Fix: Filter out items that are no longer in this section (e.g. moved from Buy to Craft)
            sectionItems.value[section.key] = sectionItems.value[section.key]
                .filter(localItem => section.items.some(si => si.id === localItem.id))
                .map(localItem => {
                    const updated = section.items.find(si => si.id === localItem.id);
                    return updated ? { ...updated } : localItem;
                });
            
            // If internal data changed but length is same, check if we need to add new ones (unlikely given length check above)
            if (sectionItems.value[section.key].length !== section.items.length) {
                sectionItems.value[section.key] = [...section.items];
            }
        }
    });
}, { immediate: true });

const getLocalizedName = (name: any) => {
    if (typeof name === 'string') return name;
    if (!name) return 'Unknown';
    const l = locale.value as any;
    return name[l] || name.tw || name.en || name.ja || Object.values(name)[0];
};

const formatMoney = (val: number | null) => {
    if (val === null) return '---';
    return new Intl.NumberFormat().format(Math.floor(val)) + ' Gil';
};

const renderStars = (count: number) => '★'.repeat(count);

const progress = computed(() => {
    let total = 0;
    let completed = 0;
    generateTodoSections.value.forEach(section => {
        section.items.forEach(item => {
            total++;
            if (todoChecked[`${section.key}_${item.id}`]) {
                completed++;
            }
        });
    });
    return { 
        completed, 
        total, 
        percent: total > 0 ? (completed / total) * 100 : 0 
    };
});

const onDragEnd = (sectionKey: string) => {
    const items = sectionItems.value[sectionKey];
    if (items) {
        todoOrder[sectionKey] = items.map(i => i.id);
    }
};

const getSectionConfig = (key: string) => {
    switch(key) {
        case 'other': return { color: 'emerald', icon: 'pi-box', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' };
        case 'buy': return { color: 'slate', icon: 'pi-shopping-cart', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
        case 'gather': return { color: 'amber', icon: 'pi-map-marker', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' };
        case 'craft': return { color: 'indigo', icon: 'pi-hammer', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' };
        default: return { color: 'slate', icon: 'pi-list', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600' };
    }
};

const toggleCheck = (sectionKey: string, id: number) => {
    const key = `${sectionKey}_${id}`;
    todoChecked[key] = !todoChecked[key];
};
</script>

<template>
    <div class="todo-view min-h-screen bg-soft-green-50/50">
        <div class="p-6 max-w-6xl w-full mx-auto pb-32">
            <!-- Header (Synced style with WorkbenchView) -->
            <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <button @click="emit('back')" 
                            class="w-12 h-12 rounded-2xl bg-white border border-soft-green-100 flex items-center justify-center hover:bg-soft-green-50 transition-all shadow-sm active:scale-95 group">
                        <i class="pi pi-arrow-left text-soft-green-600 group-hover:-translate-x-0.5 transition-transform"></i>
                    </button>
                    <div>
                        <h2 class="text-3xl font-black text-soft-green-950 mb-1 drop-shadow-sm">{{ t('todo.title') }}</h2>
                        <div v-if="activeWorkbenchNote" class="flex items-center gap-2 text-slate-500 font-bold text-sm opacity-80">
                            <i class="pi pi-book text-xs"></i>
                            {{ getLocalizedName(activeWorkbenchNote.name) }}
                        </div>
                    </div>
                </div>

                <!-- Progress Tracker (Matches Workbench Summary Card style) -->
                <div class="bg-white/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-soft-green-100 shadow-lg flex items-center gap-6 min-w-[340px]">
                    <div class="flex flex-col flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1.5 gap-4">
                            <span class="text-[13px] font-black text-soft-green-500 uppercase tracking-widest truncate">{{ t('todo.progress', { n: progress.completed, total: progress.total }) }}</span>
                            <span class="text-2xl font-black text-soft-green-900 font-mono tracking-tighter shrink-0">{{ Math.round(progress.percent) }}%</span>
                        </div>
                        <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full bg-gradient-to-r from-soft-green-400 to-soft-green-600 transition-all duration-700 ease-out shadow-sm" :style="{ width: `${progress.percent}%` }"></div>
                        </div>
                    </div>
                    <div class="h-10 w-px bg-soft-green-100 shrink-0"></div>
                    <div class="flex -space-x-2 shrink-0">
                        <img v-for="item in activeWorkbenchNote?.items.slice(0, 3)" :key="item.id" :src="workbenchItems[item.id]?.icon" class="w-10 h-10 rounded-lg border-2 border-white shadow-sm ring-1 ring-soft-green-50" />
                        <div v-if="activeWorkbenchNote && activeWorkbenchNote.items.length > 3" class="w-10 h-10 rounded-lg bg-slate-50 border-2 border-white shadow-sm ring-1 ring-soft-green-50 flex items-center justify-center">
                            <span class="text-[10px] font-black text-slate-400">+{{ activeWorkbenchNote.items.length - 3 }}</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Sections Container -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Main List -->
                <div class="lg:col-span-12 space-y-12">
                    <template v-for="section in generateTodoSections" :key="section.key">
                        <section v-if="sectionItems[section.key]?.length > 0" class="todo-section">
                            <div class="flex items-center gap-6 mb-8 px-2">
                                <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 shrink-0" :class="[getSectionConfig(section.key).bg, getSectionConfig(section.key).border, 'border-2']">
                                    <i class="pi text-3xl" :class="[getSectionConfig(section.key).icon, getSectionConfig(section.key).text]"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black tracking-tight leading-none mb-1" :class="getSectionConfig(section.key).text">
                                        {{ t(`todo.section.${section.key}`) }}
                                    </h3>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-70">
                                        {{ sectionItems[section.key].length }} {{ sectionItems[section.key].length > 1 ? 'Items' : 'Item' }}
                                    </p>
                                </div>
                                <div class="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
                            </div>

                            <draggable 
                                v-model="sectionItems[section.key]" 
                                item-key="id" 
                                @end="onDragEnd(section.key)"
                                class="space-y-4 px-1"
                                handle=".drag-handle"
                                ghost-class="ghost-item"
                                animation="300"
                            >
                                <template #item="{ element: item }">
                                    <div class="group relative bg-white/90 backdrop-blur-md rounded-2xl border-2 transition-all duration-400 flex items-center p-3 sm:p-4 gap-4 sm:gap-6 cursor-pointer select-none"
                                         @click="toggleCheck(section.key, item.id)"
                                         :class="[
                                             todoChecked[`${section.key}_${item.id}`] 
                                                ? 'border-slate-100 opacity-60 grayscale-[0.3]' 
                                                : 'border-white shadow-soft hover:shadow-2xl hover:border-soft-green-200 hover:-translate-y-1'
                                         ]">
                                        
                                        <!-- LEFT: Actions -->
                                        <div class="flex items-center gap-3">
                                            <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-200 hover:text-soft-green-400 p-2 transition-colors"
                                                 @click.stop>
                                                <i class="pi pi-ellipsis-v text-sm"></i>
                                                <i class="pi pi-ellipsis-v text-sm -ml-1"></i>
                                            </div>

                                            <div class="w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-700 shadow-sm"
                                                 :class="[
                                                     todoChecked[`${section.key}_${item.id}`]
                                                        ? 'bg-soft-green-500 border-soft-green-500 ring-4 ring-soft-green-50'
                                                        : 'border-slate-300 hover:border-soft-green-300 bg-white'
                                                 ]">
                                                <i v-if="todoChecked[`${section.key}_${item.id}`]" class="pi pi-check text-white text-base font-black"></i>
                                            </div>
                                        </div>

                                        <!-- SUBJECT: Icon & Name -->
                                        <div class="flex items-center gap-5 flex-1 min-w-0">
                                            <div class="relative shrink-0">
                                                <div class="absolute inset-0 bg-soft-green-200 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
                                                <img :src="item.icon" class="relative w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 transition-transform group-hover:scale-105" />
                                            </div>
                                            <div class="flex flex-col min-w-0">
                                                <h4 class="font-black text-xl lg:text-2xl truncate leading-none tracking-tight mb-1.5" :class="todoChecked[`${section.key}_${item.id}`] ? 'text-slate-400 line-through' : 'text-slate-900'">
                                                    {{ getLocalizedName(item.name) }}
                                                </h4>
                                                <div class="flex items-center gap-2">
                                                    <span v-if="todoChecked[`${section.key}_${item.id}`]" class="text-[10px] font-black bg-soft-green-100 text-soft-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Completed</span>
                                                    <span v-else class="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">ID #{{ item.id }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- INFO: Metadata column (Visible on wide screens) -->
                                        <div class="hidden md:flex flex-col items-end justify-center px-8 border-r border-slate-100 min-w-[220px]">
                                            <!-- Buy: Price -->
                                            <template v-if="section.key === 'buy'">
                                                <span class="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ t('todo.targetPrice') }}</span>
                                                <span class="text-3xl font-black text-orange-600 font-mono tracking-tight leading-none">{{ formatMoney(item.marketPrice) }}</span>
                                            </template>

                                            <!-- Gather: Info -->
                                            <template v-if="section.key === 'gather' && item.gathering">
                                                <div class="flex flex-col items-end gap-2.5">
                                                    <div class="flex flex-col items-end gap-0.5 text-slate-500">
                                                        <span v-if="item.gathering.parentZoneName && item.gathering.parentZoneName !== item.gathering.zoneName" class="text-[17px] font-black text-slate-700 tracking-tight leading-none">
                                                            {{ item.gathering.parentZoneName }}
                                                        </span>
                                                        <div class="flex items-center gap-1">
                                                            <i class="pi pi-map-marker text-[10px] opacity-70"></i>
                                                            <span class="text-[13px] font-bold truncate max-w-[180px] text-slate-400 leading-tight">{{ getLocalizedName(item.gathering.zoneName) }}</span>
                                                        </div>
                                                    </div>
                                                    <span class="text-sm font-black bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm leading-none">
                                                        {{ t(item.gathering.jobName) }} Lv.{{ item.gathering.level }}{{ renderStars(item.gathering.stars) }}
                                                    </span>
                                                </div>
                                            </template>

                                            <!-- Craft: Info -->
                                            <template v-if="section.key === 'craft' && item.crafting">
                                                <div class="flex flex-col items-end gap-1">
                                                     <span class="text-sm font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm leading-none">
                                                        {{ t(item.crafting.jobName) }} Lv.{{ item.crafting.level }}{{ renderStars(item.crafting.stars) }}
                                                    </span>
                                                </div>
                                            </template>
                                        </div>

                                        <!-- GOAL: Quantitative display (Right Side) -->
                                        <div class="flex flex-col items-center justify-center bg-slate-100/50 rounded-xl px-6 py-4 min-w-[110px] border border-slate-200/50 shadow-inner group-hover:bg-soft-green-100/50 transition-all duration-300">
                                            <div class="flex items-baseline gap-1">
                                                <span class="text-base font-black text-slate-400 leading-none">x</span>
                                                <span class="text-4xl font-black text-soft-green-950 leading-none drop-shadow-sm">{{ item.quantity }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </draggable>
                        </section>
                    </template>
                    
                    <!-- Empty State -->
                    <div v-if="generateTodoSections.length === 0" class="py-32 flex flex-col items-center justify-center text-center opacity-40">
                        <i class="pi pi-inbox text-6xl mb-4 text-soft-green-200"></i>
                        <h3 class="font-black text-2xl text-soft-green-900">{{ t('todo.emptySection') }}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.drag-handle {
    touch-action: none;
}
.ghost-item {
    background: #f1f5f9 !important;
    border: 2px dashed #92c5b2 !important;
    border-radius: 1rem !important;
    opacity: 0.4;
    transform: scale(0.98);
}

.shadow-soft {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}

/* Animations */
.todo-section {
    animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.todo-section:nth-child(2) { animation-delay: 0.1s; }
.todo-section:nth-child(3) { animation-delay: 0.2s; }
.todo-section:nth-child(4) { animation-delay: 0.3s; }

/* Checkbox animation */
button:active {
    transform: scale(0.95);
}
</style>
