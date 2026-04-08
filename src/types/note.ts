export interface LocalizedString {
  tw: string;
  cn: string;
  en: string;
  ja: string;
}

export interface NoteItem {
  id: number;
  quantity: number;
}

export interface Note {
  id: string; // history_XXXXX or recommend_XXXXX
  name: string | LocalizedString; // 使用者定義或站長推薦的多國語系名稱
  items: NoteItem[];
  createdAt: Date | string; // 創建日期
}
