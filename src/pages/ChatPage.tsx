import React, { useState, useEffect } from 'react';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import { Message, Category, ChatMode } from '../types';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [category, setCategory] = useState<Category>('進路');
  const [mode, setMode] = useState<ChatMode>('normal');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // 初期メッセージを設定
    const initialMessage: Message = {
      id: '1',
      text: 'こんにちは！今日はどんなことで悩んでいますか？どんな小さなことでも気軽に相談してくださいね。',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      category,
      mode
    };
    setMessages([initialMessage]);
  }, [category, mode]);

  const handleSendMessage = async (text: string) => {
    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
      category,
      mode
    };

    setMessages(prev => [...prev, userMessage]);

    // モックAI応答を生成
    setTimeout(() => {
      const aiResponse = generateMockResponse(text, category, mode);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        category,
        mode
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const generateMockResponse = (question: string, category: Category, mode: ChatMode): string => {
    const responses = {
      進路: {
        normal: 'そうですね、将来のことを考えるのは大切なことです。あなたの興味や得意なことから一緒に考えてみましょう。',
        detailed: 'そうですね、将来のことを考えるのは大切なことです。まず、あなたの興味や得意なことを整理してみることから始めましょう。自分の好きなことや夢中になれることを見つけることで、将来の道筋が見えてくることが多いです。また、色々な職業について調べてみたり、実際に働いている人の話を聞いてみることも良いですね。',
        quick: '興味や得意なことから一緒に考えてみましょう！',
        encouraging: 'あなたには必ず素晴らしい未来が待っています！一緒に将来の可能性を探していきましょう。きっと素敵な道が見つかりますよ。'
      },
      学習: {
        normal: '勉強は計画的に進めることが大切です。まずは目標を設定して、少しずつ取り組んでいきましょう。',
        detailed: '勉強は計画的に進めることが大切です。まずは具体的な目標を設定して、それを達成するための計画を立てましょう。毎日少しずつでも継続することが重要です。また、自分に合った勉強方法を見つけることも大切です。分からないことがあれば、遠慮せずに質問してくださいね。',
        quick: '目標を決めて、少しずつ頑張ろう！',
        encouraging: 'あなたなら絶対にできます！一歩ずつ前に進んでいけば、必ず成果が出ますよ。頑張っているあなたを応援しています！'
      },
      人間関係: {
        normal: '人間関係の悩みは誰にでもあることです。相手の気持ちを理解しようとする姿勢が大切ですね。',
        detailed: '人間関係の悩みは誰にでもあることです。まず、相手の立場に立って考えてみることが大切です。そして、自分の気持ちを正直に伝えることも重要です。時には誤解が生じることもありますが、お互いに理解し合おうとする気持ちがあれば、きっと良い関係を築けるはずです。',
        quick: '相手の気持ちを考えて、素直に話してみよう。',
        encouraging: 'あなたは思いやりのある優しい人です。その気持ちがあれば、きっと素晴らしい友人関係を築けますよ。自信を持ってくださいね！'
      }
    };

    return responses[category][mode];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatHeader
        category={category}
        setCategory={setCategory}
        mode={mode}
        setMode={setMode}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
      />
      <ChatMessages messages={messages} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatPage;