# Gemini API トークンキャッシュ戦略

## Gemini APIのキャッシュ機能

### **Context Caching（2024年より利用可能）**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini 1.5 Proで利用可能なContext Caching
const genAI = new GoogleGenerativeAI(API_KEY);

// キャッシュ作成
const cache = await genAI.createCachedContent({
  model: 'models/gemini-1.5-pro-001',
  contents: [
    {
      role: 'user',
      parts: [{ text: '長い文脈データ...' }]
    }
  ],
  systemInstruction: {
    parts: [{ text: 'あなたは教師です...' }]
  },
  ttl: '3600s' // 1時間キャッシュ
});

// キャッシュを使用してリクエスト
const model = genAI.getGenerativeModelFromCachedContent(cache);
const result = await model.generateContent('新しい質問');
```

### **制限事項**

| 項目 | Gemini 1.5 Pro | Gemini 1.5 Flash |
|------|----------------|-------------------|
| **キャッシュ機能** | ✅ あり | ❌ なし |
| **最大キャッシュサイズ** | 1M トークン | - |
| **キャッシュ保持時間** | 最大24時間 | - |
| **料金** | キャッシュ保存料金あり | - |

---

## 現実的な問題と解決策

### **問題1: Flashにはキャッシュ機能がない**

```typescript
// 現在の状況
const currentModel = "gemini-1.5-flash"; // キャッシュ機能なし
const contextLimit = 1000000; // 約100万トークン

// 毎回全ての文脈を送信する必要がある
const prompt = `
${teacherPersonality} // 毎回送信
${conversationHistory} // 毎回送信  
${currentMessage} // 新しい質問
`;
```

### **解決策: 自前のコンテキスト管理**

```typescript
class ConversationContextManager {
  private cache = new Map<string, ProcessedContext>();
  private readonly MAX_CONTEXT_TOKENS = 50000; // 安全な範囲
  
  // 効率的な文脈構築
  async buildOptimizedContext(sessionId: string, newMessage: string) {
    const cached = this.cache.get(sessionId);
    
    if (cached && this.isStillValid(cached)) {
      // 既存の文脈に新しいメッセージを追加
      return this.appendToContext(cached, newMessage);
    }
    
    // 新しい文脈を構築
    const context = await this.buildFreshContext(sessionId);
    this.cache.set(sessionId, context);
    return context;
  }
  
  private async buildFreshContext(sessionId: string): Promise<ProcessedContext> {
    // 最新N件のメッセージを取得
    const recentMessages = await this.db.getRecentMessages(sessionId, 20);
    
    // 重要度に基づく圧縮
    const compressed = this.compressConversation(recentMessages);
    
    // トークン数を計算
    const tokens = this.countTokens(compressed);
    
    return {
      content: compressed,
      tokens,
      lastUpdated: Date.now(),
      sessionId
    };
  }
  
  // 文脈圧縮戦略
  private compressConversation(messages: Message[]): string {
    const important = messages.filter(m => this.isImportant(m));
    const recent = messages.slice(-10); // 最新10件は必ず含める
    
    // 重複除去しつつ結合
    const uniqueMessages = this.deduplicateMessages([...important, ...recent]);
    
    return uniqueMessages.map(m => 
      `${m.sender}: ${this.summarizeIfLong(m.text)}`
    ).join('\n');
  }
  
  private isImportant(message: Message): boolean {
    // 重要度判定ロジック
    return message.text.includes('重要') || 
           message.text.includes('質問') ||
           message.reactions?.includes('good') ||
           message.text.length > 200; // 長いメッセージは重要
  }
}
```

---

## 実装戦略

### **Phase 1: 基本的な文脈管理**

```typescript
// シンプルな実装から開始
class SimpleContextManager {
  async getContext(sessionId: string, maxMessages: number = 15) {
    const messages = await this.db.getRecentMessages(sessionId, maxMessages);
    
    // トークン制限チェック
    const context = this.buildContext(messages);
    if (this.countTokens(context) > 30000) {
      // 超過時は古いメッセージから削除
      return this.buildContext(messages.slice(-10));
    }
    
    return context;
  }
  
  private buildContext(messages: Message[]): string {
    const teacher = this.getTeacherInfo(messages[0]?.teacherId);
    const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    
    return `
教師設定:
${teacher.personality}

会話履歴:
${history}

注意: 上記の文脈を理解して適切な長さで返答してください。
    `;
  }
}
```

### **Phase 2: 階層的キャッシュ**

```typescript
class HierarchicalContextCache {
  // Level 1: セッション固有キャッシュ
  private sessionCache = new Map<string, SessionContext>();
  
  // Level 2: 教師プロファイルキャッシュ
  private teacherCache = new Map<string, TeacherContext>();
  
  // Level 3: グローバルテンプレートキャッシュ
  private templateCache = new Map<string, string>();
  
  async getOptimizedPrompt(sessionId: string, message: string) {
    // キャッシュされた教師情報
    const teacher = await this.getCachedTeacher(sessionId);
    
    // 圧縮された会話履歴
    const history = await this.getCachedHistory(sessionId);
    
    // 最適化されたプロンプト構築
    return this.buildPrompt(teacher, history, message);
  }
  
  private async getCachedHistory(sessionId: string): Promise<string> {
    const cached = this.sessionCache.get(sessionId);
    
    if (cached && Date.now() - cached.lastUpdate < 300000) { // 5分間有効
      return cached.compressedHistory;
    }
    
    // 新しい履歴を構築してキャッシュ
    const fresh = await this.buildCompressedHistory(sessionId);
    this.sessionCache.set(sessionId, {
      compressedHistory: fresh,
      lastUpdate: Date.now()
    });
    
    return fresh;
  }
}
```

---

## トークン制限と保存可能範囲

### **Gemini 1.5 Flash の制限**

```typescript
const limits = {
  maxInputTokens: 1000000, // 約100万トークン
  maxOutputTokens: 8192,   // 出力は8K制限
  recommendedContext: 50000, // 安全な文脈サイズ
  costEfficient: 20000     // コスト効率的なサイズ
};

// 日本語の場合の概算
const japaneseEstimate = {
  charactersPerToken: 1.5, // 日本語は1.5文字≈1トークン
  messagesStorable: {
    short: 500,   // 50文字メッセージなら500件
    medium: 200,  // 150文字メッセージなら200件  
    long: 100     // 300文字メッセージなら100件
  }
};
```

### **実際の保存可能範囲**

```typescript
// 現実的な文脈サイズ設計
const contextDesign = {
  // 基本文脈（常に含める）
  teacher: {
    personality: "~1000トークン",
    examples: "~500トークン"
  },
  
  // 会話履歴（動的）
  conversation: {
    recent: "最新10件 ~5000トークン",
    important: "重要な5件 ~2500トークン", 
    summary: "要約 ~1000トークン"
  },
  
  // 制御指示
  instructions: "~500トークン",
  
  // 合計: ~10,500トークン（安全範囲）
  total: "10,500 / 1,000,000 トークン"
};

// 1回の会話で保存できるメッセージ数
const storableMessages = {
  veryShort: "約200-300件（50文字/件）",
  short: "約100-150件（100文字/件）", 
  medium: "約50-75件（200文字/件）",
  long: "約25-35件（400文字/件）"
};
```

---

## 推奨実装アプローチ

### **Step 1: 基本実装**
```typescript
// まずはシンプルに
const context = await getRecentMessages(sessionId, 15);
const prompt = buildBasicPrompt(teacher, context, newMessage);
```

### **Step 2: 最適化**
```typescript
// 文脈圧縮とキャッシュを追加
const optimizedContext = await contextManager.getOptimizedContext(sessionId);
const prompt = buildSmartPrompt(optimizedContext, newMessage);
```

### **Step 3: 高度化**
```typescript
// 重要度ベースの文脈選択
const intelligentContext = await aiContextSelector.selectBestContext(sessionId, newMessage);
const prompt = buildAdaptivePrompt(intelligentContext, newMessage);
```

---

## 結論

**Gemini 1.5 Flashにはキャッシュ機能がない**ため、**自前でコンテキスト管理**が必要です。

### **実装優先度**
1. **基本的な文脈管理**（最新N件の会話）
2. **文脈圧縮**（重要度ベースの選択）
3. **階層キャッシュ**（教師情報、会話履歴の分離）
4. **AI支援型文脈選択**（将来的な最適化）

### **現実的な保存範囲**
- **日常的な使用**: 15-20メッセージ（十分な文脈）
- **長時間会話**: 50-100メッセージ（圧縮必要）
- **理論的最大**: 200-500メッセージ（要最適化）

この戦略により、**Claudeのような自然な文脈理解**を実現できます！