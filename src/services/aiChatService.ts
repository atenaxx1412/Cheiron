import { geminiApiService } from './geminiApiService';
import { firebaseAITeacherService } from './firebaseAITeacherService';
import { firebaseTeacherPersonalityService } from './firebaseTeacherPersonalityService';
import { AITeacher } from '../types';

export interface ChatRequest {
  message: string;
  teacherId: string;
  category?: string;
  mode?: string;
}

export interface ChatResponse {
  response: string;
  teacher: AITeacher;
  timestamp: string;
  tokenUsed?: number;
}

export class AiChatService {
  
  // AI先生との会話を処理
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // 先生情報を取得
      const teacher = await firebaseAITeacherService.getTeacherById(request.teacherId);
      if (!teacher) {
        throw new Error('指定された先生が見つかりません');
      }

      // NGワードチェック
      const ngWordCheck = this.checkNGWords(request.message, teacher);
      if (ngWordCheck.hasNGWord) {
        return {
          response: ngWordCheck.message,
          teacher,
          timestamp: new Date().toISOString()
        };
      }

      // 制限トピックチェック
      const restrictedTopicCheck = this.checkRestrictedTopics(request.message, teacher);
      if (restrictedTopicCheck.isRestricted) {
        return {
          response: restrictedTopicCheck.message,
          teacher,
          timestamp: new Date().toISOString()
        };
      }

      // 先生の性格情報を構築（50問データを使用）
      const teacherPersonality = await this.buildTeacherPersonality(teacher);
      
      // 相談分野に応じたコンテキスト追加
      const contextualPrompt = this.addCategoryContext(request.message, request.category);
      
      // モードに応じたプロンプト調整
      const finalPrompt = this.addModeContext(contextualPrompt, request.mode);
      
      // 返信カスタマイズを適用
      const customizedPrompt = this.applyResponseCustomization(finalPrompt, request, teacher);
      
      // Gemini APIで回答生成
      const response = await geminiApiService.generateResponse(customizedPrompt, teacherPersonality);
      
      return {
        response,
        teacher,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('AI会話処理エラー:', error);
      throw new Error(`会話処理に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 先生の性格情報を構築（50問データを優先）
  private async buildTeacherPersonality(teacher: AITeacher): Promise<string> {
    try {
      // 50問の性格データを取得
      const personalityData = await firebaseTeacherPersonalityService.getTeacherPersonality(teacher.id);
      
      if (personalityData && personalityData.isComplete) {
        // 50問データが完成している場合は、詳細な性格プロンプトを使用
        return firebaseTeacherPersonalityService.buildPersonalityPrompt(personalityData);
      } else {
        // 50問データがない場合は、基本情報から構築
        const personality = `
名前: ${teacher.displayName}
専門分野: ${teacher.specialties.join('、')}
性格・特徴: ${teacher.personality}
挨拶: ${teacher.greeting || 'こんにちは！'}

あなたは「${teacher.displayName}」として、以下の特徴を持った先生です：
- ${teacher.personality}
- 専門分野: ${teacher.specialties.join('、')}
- 温かく親身になって生徒をサポートする
- 具体的で実践的なアドバイスを心がける
- 生徒の目線に立った分かりやすい説明をする

※ この先生はまだ50問の性格分析を完了していないため、基本的な対応をします。
`;
        return personality;
      }
    } catch (error) {
      console.error('性格データ取得エラー:', error);
      // エラーの場合は基本情報を使用
      const personality = `
名前: ${teacher.displayName}
専門分野: ${teacher.specialties.join('、')}
性格・特徴: ${teacher.personality}
挨拶: ${teacher.greeting || 'こんにちは！'}

あなたは「${teacher.displayName}」として、温かく親身になって生徒をサポートする先生です。
`;
      return personality;
    }
  }

  // カテゴリに応じたコンテキスト追加
  private addCategoryContext(message: string, category?: string): string {
    if (!category) return message;

    const categoryContexts = {
      '進路': `
進路相談として以下の質問に答えてください。
- 将来の目標や夢を大切にしつつ、現実的なアドバイスを提供
- 具体的な進学先や職業について詳しく説明
- 生徒の適性や興味を考慮したアドバイス
- 今からできる準備や行動を具体的に提案

`,
      '学習': `
学習相談として以下の質問に答えてください。
- 効果的な勉強方法や学習習慣を提案
- 苦手科目の克服方法を具体的にアドバイス
- モチベーション維持の方法を教える
- 時間管理や計画の立て方をサポート

`,
      '人間関係': `
人間関係の相談として以下の質問に答えてください。
- 友人関係、家族関係、恋愛関係の悩みに対応
- コミュニケーションのコツやアドバイス
- ストレス解消法や心のケア方法を提案
- 相手の気持ちを理解し、建設的な解決策を提示

`
    };

    const context = categoryContexts[category as keyof typeof categoryContexts] || '';
    return context + message;
  }

  // モードに応じたプロンプト調整
  private addModeContext(message: string, mode?: string): string {
    if (!mode) return message;

    const modeContexts = {
      'detailed': `
【回答スタイル: 詳しく】
- 800-1500文字程度で詳細に説明してください
- 具体例を複数挙げて分かりやすく説明
- 段階的な手順やプロセスを丁寧に説明
- 背景情報や理由も含めて包括的に回答
- 実践的なアドバイスを具体的に提供

`,
      'quick': `
【回答スタイル: さくっと】
- 200-400文字程度で簡潔に回答してください
- 要点を絞って端的に説明
- すぐに実践できるアドバイスを中心に
- 無駄な説明は省いて核心部分のみ
- 読みやすく分かりやすい表現で

`,
      'encouraging': `
【回答スタイル: 励まし】
- 400-700文字程度で温かく励ます調子で回答
- 生徒の気持ちに寄り添い共感を示す
- 前向きで希望を与える表現を使用
- 生徒の努力や頑張りを認めて応援
- 優しく親身な先生として接する

`,
      'normal': `
【回答スタイル: 通常】
- 400-800文字程度でバランス良く回答
- 適度な詳しさで説明し、実用的なアドバイスを提供
- 生徒目線で分かりやすく親しみやすい口調
- 必要に応じて具体例を交える
- 落ち着いた信頼できる先生として対応

`
    };

    const context = modeContexts[mode as keyof typeof modeContexts] || '';
    return context + message;
  }

  // AIサービスの状態確認
  async getServiceStatus(): Promise<{
    isAvailable: boolean;
    activeKeys: number;
    todayRequests: number;
    message: string;
  }> {
    try {
      const stats = await geminiApiService.getUsageStats();
      
      return {
        isAvailable: stats.activeKeys > 0,
        activeKeys: stats.activeKeys,
        todayRequests: stats.todayRequests,
        message: stats.activeKeys > 0 
          ? 'AIサービスは正常に動作しています' 
          : 'APIキーの上限に達しています。しばらくお待ちください'
      };
      
    } catch (error) {
      console.error('サービス状態確認エラー:', error);
      return {
        isAvailable: false,
        activeKeys: 0,
        todayRequests: 0,
        message: 'AIサービスに接続できません'
      };
    }
  }

  // Gemini APIキーを初期化（初回起動時）
  async initializeService(): Promise<void> {
    try {
      await geminiApiService.initializeApiKeys();
      console.log('AI会話サービスが初期化されました');
    } catch (error) {
      console.error('AI会話サービス初期化エラー:', error);
      throw error;
    }
  }

  // NGワードチェック
  private checkNGWords(message: string, teacher: AITeacher): { hasNGWord: boolean; message: string } {
    if (!teacher.ngWords?.enabled || !teacher.ngWords.words.length) {
      return { hasNGWord: false, message: '' };
    }

    const lowerMessage = message.toLowerCase();
    const foundNGWord = teacher.ngWords.words.find(word => 
      lowerMessage.includes(word.toLowerCase())
    );

    if (foundNGWord) {
      const customMessage = teacher.ngWords.customMessage || 
        `申し訳ありませんが、「${foundNGWord}」に関する内容については、お答えできません。他の相談内容でしたら、お気軽にお聞かせください。`;
      
      return { hasNGWord: true, message: customMessage };
    }

    // NGカテゴリーもチェック
    const ngCategories = ['政治', '宗教', '暴力', '差別', '犯罪'];
    const foundCategory = ngCategories.find(category => 
      teacher.ngWords?.categories.includes(category) && lowerMessage.includes(category)
    );

    if (foundCategory) {
      const customMessage = teacher.ngWords?.customMessage || 
        `申し訳ありませんが、${foundCategory}に関するトピックについては、お答えできません。学習や進路、人間関係など、他の相談内容でしたらお気軽にお聞かせください。`;
      
      return { hasNGWord: true, message: customMessage };
    }

    return { hasNGWord: false, message: '' };
  }

  // 制限トピックチェック
  private checkRestrictedTopics(message: string, teacher: AITeacher): { isRestricted: boolean; message: string } {
    if (!teacher.responseCustomization?.enableCustomization || 
        !teacher.responseCustomization.restrictedTopics?.length) {
      return { isRestricted: false, message: '' };
    }

    const lowerMessage = message.toLowerCase();
    const foundTopic = teacher.responseCustomization.restrictedTopics.find(topic => 
      lowerMessage.includes(topic.toLowerCase())
    );

    if (foundTopic) {
      const message = `申し訳ありませんが、「${foundTopic}」に関する内容については、専門的な知識が必要なため、お答えできません。学習方法や進路相談、人間関係など、他の内容でしたらお気軽にご相談ください。`;
      return { isRestricted: true, message };
    }

    return { isRestricted: false, message: '' };
  }

  // 返信カスタマイズを適用
  private applyResponseCustomization(prompt: string, request: ChatRequest, teacher: AITeacher): string {
    if (!teacher.responseCustomization?.enableCustomization || 
        !teacher.responseCustomization.customPrompts?.length) {
      return prompt;
    }

    // カテゴリまたはモードに応じたカスタムプロンプトを探す
    const customPrompt = teacher.responseCustomization.customPrompts.find(cp => 
      (cp.category && cp.category === request.category) || 
      (cp.mode && cp.mode === request.mode)
    );

    if (customPrompt) {
      return `${customPrompt.prompt}\n\n${prompt}`;
    }

    return prompt;
  }

  // モック応答（Gemini API不可時のフォールバック）
  private getMockResponse(teacher: AITeacher, message: string): string {
    const responses = [
      `${teacher.displayName}です。${message}について、もう少し詳しく教えてもらえますか？一緒に考えてみましょう。`,
      `なるほど、${message}についてのご相談ですね。まずは現在の状況を整理してみませんか？`,
      `${message}について悩んでいるのですね。私の経験から言えることがあります。一歩ずつ解決していきましょう。`,
      `${teacher.displayName}として、${message}についてお答えします。どんな小さなことでも気軽に相談してくださいね。`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// シングルトンインスタンス
export const aiChatService = new AiChatService();