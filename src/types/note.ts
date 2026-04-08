export interface NoteItem {
  id: number;
  quantity: number;
}

export interface Note {
  id: string; // internal identifier 
  name: string; // 使用者定義的筆記名稱
  items: NoteItem[]; // 物品清單
  createdAt: Date; // 創建日期
}
