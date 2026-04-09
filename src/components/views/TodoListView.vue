<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import { useWorkbench } from '../../composables/useWorkbench';

const { t, locale } = useI18n();
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
    <div class="todo-view min-h-screen p-6 max-w-5xl mx-auto pb-32">
        <!-- Header -->
        <header class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <button @click="emit('back')" class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm active:scale-90">
                    <i class="pi pi-arrow-left text-slate-500"></i>
                </button>
                <div>
                    <h2 class="text-3xl font-black text-slate-800 tracking-tight">{{ t('todo.title') }}</h2>
                    <p class="text-slate-400 font-bold text-sm">{{ t('todo.backToWorkbench') }}</p>
                </div>
            </div>

            <!-- Progress Card -->
            <div class="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-soft-green-100 shadow-xl min-w-[240px]">
                <div class="flex justify-between items-end mb-2">
                    <span class="text-xs font-black text-soft-green-600 uppercase tracking-widest">{{ t('todo.progress', { n: progress.completed, total: progress.total }) }}</span>
                    <span class="text-xl font-black text-soft-green-900 font-mono">{{ Math.round(progress.percent) }}%</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-soft-green-500 transition-all duration-500 ease-out" :style="{ width: `${progress.percent}%` }"></div>
                </div>
            </div>
        </header>

        <!-- Sections -->
        <div class="space-y-10">
            <template v-for="section in generateTodoSections" :key="section.key">
                <section v-if="sectionItems[section.key]?.length > 0">
                    <div class="flex items-center gap-3 mb-4 px-2">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" :class="[getSectionConfig(section.key).bg, getSectionConfig(section.key).border, 'border']">
                            <i class="pi text-lg" :class="[getSectionConfig(section.key).icon, getSectionConfig(section.key).text]"></i>
                        </div>
                        <h3 class="text-xl font-black tracking-tight" :class="getSectionConfig(section.key).text">
                            {{ t(`todo.section.${section.key}`) }}
                        </h3>
                        <div class="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-2"></div>
                    </div>

                    <draggable 
                        v-model="sectionItems[section.key]" 
                        item-key="id" 
                        @end="onDragEnd(section.key)"
                        class="space-y-3"
                        handle=".drag-handle"
                        ghost-class="opacity-50"
                    >
                        <template #item="{ element: item }">
                            <div class="group relative bg-white rounded-2xl border transition-all duration-300 flex items-center p-3 gap-4"
                                 :class="[
                                     todoChecked[`${section.key}_${item.id}`] 
                                        ? 'border-slate-100 opacity-60' 
                                        : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                                 ]">
                                
                                <!-- Drag Handle -->
                                <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                                    <i class="pi pi-bars scale-90"></i>
                                </div>

                                <!-- Checkbox -->
                                <div @click="toggleCheck(section.key, item.id)" 
                                     class="w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer"
                                     :class="[
                                         todoChecked[`${section.key}_${item.id}`]
                                            ? 'bg-soft-green-500 border-soft-green-500'
                                            : 'border-slate-200 hover:border-soft-green-400 bg-slate-50'
                                     ]">
                                    <i v-if="todoChecked[`${section.key}_${item.id}`]" class="pi pi-check text-white text-xs font-bold"></i>
                                </div>

                                <!-- Icon & Name -->
                                <div class="flex items-center gap-3 flex-1 min-w-0">
                                    <img :src="item.icon" class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-100" />
                                    <div class="flex flex-col min-w-0">
                                        <h4 class="font-black text-[15px] truncate" :class="todoChecked[`${section.key}_${item.id}`] ? 'text-slate-400 line-through' : 'text-slate-800'">
                                            {{ getLocalizedName(item.name) }}
                                        </h4>
                                        
                                        <!-- Extra Info -->
                                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <!-- Qty -->
                                            <div class="flex items-center gap-1">
                                                <span class="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{{ t('todo.targetQty') }}</span>
                                                <span class="text-xs font-black text-slate-600">x{{ item.quantity }}</span>
                                            </div>

                                            <!-- Buy: Price -->
                                            <template v-if="section.key === 'buy'">
                                                <div class="flex items-center gap-1">
                                                    <span class="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{{ t('todo.targetPrice') }}</span>
                                                    <span class="text-xs font-black text-orange-500">{{ formatMoney(item.marketPrice) }}</span>
                                                </div>
                                            </template>

                                            <!-- Gather: Info -->
                                            <template v-if="section.key === 'gather' && item.gathering">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[11px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-100 shadow-sm">
                                                        {{ t(item.gathering.jobName) }} Lv.{{ item.gathering.level }}{{ renderStars(item.gathering.stars) }}
                                                    </span>
                                                    <div class="flex items-center gap-1">
                                                        <span class="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{{ t('todo.gatherLocation') }}</span>
                                                        <span class="text-xs font-bold text-slate-500 truncate">{{ getLocalizedName(item.gathering.zoneName) }}</span>
                                                    </div>
                                                </div>
                                            </template>

                                            <!-- Craft: Info -->
                                            <template v-if="section.key === 'craft' && item.crafting">
                                                <span class="text-[11px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100 shadow-sm">
                                                    {{ t(item.crafting.jobName) }} Lv.{{ item.crafting.level }}{{ renderStars(item.crafting.stars) }}
                                                </span>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </section>
            </template>
        </div>
    </div>
</template>

<style scoped>
.drag-handle {
    touch-action: none;
}
.ghost-item {
    background: #f8fafc !important;
    border: 2px dashed #cbd5e1 !important;
}

/* Checkbox animation */
button:active {
    transform: scale(0.95);
}
</style>
