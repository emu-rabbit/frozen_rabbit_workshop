# ❄️ 冷凍兔肉的工坊 | Frozen Rabbit Workshop

> **"兔肉不私藏的好筆記本"** — 為《最終幻想14》（FFXIV）能工巧匠設計的物資籌備管理工具。

[![FFXIV](https://img.shields.io/badge/Final%20Fantasy%20XIV-FFXIV-blue.svg)](https://na.finalfantasyxiv.com/)
[![React](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![Universalis](https://img.shields.io/badge/Data-Universalis-orange.svg)](https://universalis.app/)

## 📖 專案簡介

**冷凍兔肉的工坊** 是一個專為 FFXIV 玩家打造的批次備料管理平台。當你需要製作大量的 HQ 裝備、消耗品或是進行版本初期的拓荒準備時，工坊能協助你將複雜的配方拆解，並根據市場即時價格與個人需求，制定最優化的籌備路徑。

## ✨ 核心功能

### 🛠️ 備料台 (Workbench)
- **智慧分配**：針對清單中的每一項素材，自由分配「購買」、「製作」、「採集」或「既有庫存」。
- **即時預算**：串接 [Universalis](https://universalis.app/) API，根據你選定的資料中心即時預估總花費。
- **時程估算**：粗略估算完成整份清單所需的製作與採集時間。
- **市場策略**：支援「激進（最低價）」、「平衡（1/4 位數）」與「保守（中位數）」三種定價基準。

### 📋 待辦清單 (Todo List)
- **一鍵生成**：根據備料台的分配結果，生成分類清晰的行動清單（購買區、採集區、製作區）。
- **精確導航**：購買項目會列出最便宜的市場服或 NPC 座標；採集項目則包含地圖、座標以及限時點的 ET 時間。
- **快速複製**：內建一鍵複製素材名稱功能，搜尋市場板不再手忙腳亂。

### 🐰 兔肉私心筆記 (Recommended Notes)
- **版本精選**：預載由站長整理的高價值、熱門裝備或消耗品清單（如 iLv710/770 十件套裝）。
- **快速匯入**：點擊即可載入備料台，省去逐一搜尋物品的時間。

## 🌍 多語系支援
工坊提供完整的在地化支持，並嚴格遵循各區域官方術語：
- 繁體中文 (Traditional Chinese)
- 簡體中文 (Simplified Chinese)
- English
- 日本語 (Japanese)

## 🛠️ 技術架構
- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **State Management**: Vue Composition API
- **Internationalization**: Vue I18n
- **Icons**: PrimeIcons

## 🙏 致謝與開源聲明
本專案的數據與技術獲得以下社群專案支持：
- **Universalis**: 提供全球市場資料。
- **Teamcraft**: 提供物品、配方與採集細節。
- **XIVAPI**: 提供遊戲內圖示與物品資料 API。

---

### ⚠️ 常見問題
**Q: 為甚麼要把兔肉冷凍起來，可以烤來吃嗎？**  
**A: 不可以。**

---

*Made with ❤️ for the FFXIV community.*
