import React, { useState, useEffect } from 'react';
import { Trophy, RotateCcw, User, Cpu } from 'lucide-react';

// 1. 定义牌的类型接口 / Define Card Type
interface CardType {
  suit: string;
  value: string;
}

// --- 常量定义 ---
const SUITS = ['♥️', '♦️', '♣️', '♠️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 使用 Fisher-Yates 算法生成洗好的牌
const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      deck.push({ suit, value });
    });
  });

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const CrazyEights: React.FC = () => {
  // 2. 为 State 添加泛型类型定义 / Add Generic Types to States
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [aiHand, setAiHand] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentSuit, setCurrentSuit] = useState<string | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [showSuitPicker, setShowSuitPicker] = useState(false);

  const startGame = () => {
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 8);
    const aHand = newDeck.splice(0, 8);
    const firstDiscard = newDeck.pop() as CardType;
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setIsPlayerTurn(true);
    setGameStatus('playing');
    setShowSuitPicker(false);
  };

  const canPlay = (card: CardType) => {
    const topCard = discardPile[discardPile.length - 1];
    if (!topCard) return true;
    return card.value === '8' || card.suit === currentSuit || card.value === topCard.value;
  };

  const playCard = (cardIndex: number) => {
    if (!isPlayerTurn || gameStatus !== 'playing') return;
    const card = playerHand[cardIndex];

    if (canPlay(card)) {
      const newHand = [...playerHand];
      newHand.splice(cardIndex, 1);
      setPlayerHand(newHand);
      setDiscardPile([...discardPile, card]);
      
      if (newHand.length === 0) {
        setGameStatus('won');
        return;
      }

      if (card.value === '8') {
        setShowSuitPicker(true);
      } else {
        setCurrentSuit(card.suit);
        setIsPlayerTurn(false);
      }
    }
  };

  const drawCard = (isPlayer: boolean) => {
    if (deck.length === 0) {
      if (!isPlayer) setIsPlayerTurn(true);
      return;
    };
    
    const newDeck = [...deck];
    const card = newDeck.pop() as CardType;
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand([...playerHand, card]);
    } else {
      setAiHand([...aiHand, card]);
    }
  };

  // AI 逻辑
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        const playableIndex = aiHand.findIndex(card => canPlay(card));
        
        if (playableIndex !== -1) {
          const card = aiHand[playableIndex];
          const newAiHand = [...aiHand];
          newAiHand.splice(playableIndex, 1);
          setAiHand(newAiHand);
          setDiscardPile([...discardPile, card]);
          
          if (newAiHand.length === 0) {
            setGameStatus('lost');
          } else {
            setCurrentSuit(card.value === '8' ? SUITS[Math.floor(Math.random()*4)] : card.suit);
            setIsPlayerTurn(true);
          }
        } else {
          drawCard(false);
          setIsPlayerTurn(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, aiHand, discardPile, gameStatus]);

  // 每个花色对应的中国知名建筑 emoji / Landmark emoji per suit
  const SUIT_LANDMARK: Record<string, string> = {
    '♥️': '🏯',  // 故宫
    '♦️': '🗼',  // 东方明珠
    '♣️': '🏔️', // 黄山
    '♠️': '🌉',  // 南京长江大桥
  };

  // Card 组件 / Card component
  const Card = ({ card, isHidden, onClick, disabled }: {
    card?: CardType,
    isHidden: boolean,
    onClick?: () => void,
    disabled?: boolean
  }) => (
    <div
      onClick={onClick}
      className={`relative w-16 h-24 md:w-24 md:h-36 rounded-xl border-2 flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer transition-all transform overflow-hidden
        ${!disabled && 'hover:-translate-y-2'}
        ${isHidden ? 'bg-gradient-to-br from-blue-500 to-blue-800 border-white' : 'bg-white border-gray-200'}
        ${!isHidden && card && (card.suit === '♥️' || card.suit === '♦️') ? 'text-red-500' : 'text-slate-800'}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-lg'}`}
    >
      {isHidden ? (
        // 牌背：可爱小马 emoji / Card back: cute horse
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🐴</span>
          <span className="text-xs text-white/70 font-normal">✦✦✦</span>
        </div>
      ) : (
        <div className="flex flex-col items-center relative w-full h-full justify-center">
          {/* 半透明建筑背景 / Semi-transparent landmark background */}
          {card?.suit && (
            <span className="absolute text-5xl opacity-20 select-none">
              {SUIT_LANDMARK[card.suit]}
            </span>
          )}
          <span className="relative z-10">{card?.value}</span>
          <span className="relative z-10 text-3xl">{card?.suit}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-green-800 p-4 font-sans text-white flex flex-col items-center justify-between">
      {/* AI 区域 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full text-sm">
          <Cpu size={16} /> AI Cards: {aiHand.length}
        </div>
        <div className="flex -space-x-8 md:-space-x-12">
          {aiHand.map((_, i) => <Card key={i} isHidden={true} />)}
        </div>
      </div>

      {/* 公共区域 */}
      <div className="flex gap-8 items-center my-8">
        <div className="text-center">
          <p className="text-xs mb-2 uppercase opacity-70">Deck ({deck.length})</p>
          <div 
            onClick={() => isPlayerTurn && drawCard(true)}
            className="w-20 h-28 md:w-24 md:h-36 bg-blue-800 border-4 border-white/50 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <RotateCcw size={32} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs mb-2 uppercase text-yellow-400">
            Suit: {currentSuit}
          </p>
          <Card 
            card={discardPile[discardPile.length - 1]} 
            isHidden={discardPile.length === 0} 
          />
        </div>
      </div>

      {/* 玩家区域 */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-4">
        <div className={`flex flex-wrap justify-center gap-2 md:gap-4 ${!isPlayerTurn ? 'opacity-50' : ''}`}>
          {playerHand.map((card, i) => (
            <Card 
              key={i} 
              card={card} 
              isHidden={false}
              onClick={() => playCard(i)} 
              disabled={!isPlayerTurn || !canPlay(card)}
            />
          ))}
        </div>
        <div className="bg-blue-600 px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
          <User size={18} /> {isPlayerTurn ? "Your Turn" : "AI Thinking..."}
        </div>
      </div>

      {/* 变色弹窗 */}
      {showSuitPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl text-slate-800 text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Pick a New Suit</h3>
            <div className="grid grid-cols-2 gap-4">
              {SUITS.map(suit => (
                <button 
                  key={suit}
                  onClick={() => {
                    setCurrentSuit(suit);
                    setShowSuitPicker(false);
                    setIsPlayerTurn(false);
                  }}
                  className="text-4xl p-4 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 结算与开始界面 */}
      {(gameStatus !== 'playing') && (
        <div className="fixed inset-0 bg-green-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center">
          {gameStatus === 'waiting' ? (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-12 py-10 shadow-2xl flex flex-col items-center">
              <h1 className="text-6xl font-black italic text-yellow-400 mb-2">Bela'Crazy Eights</h1>
              <p className="text-2xl font-bold text-white/80 mb-8 tracking-widest">Bela 的疯狂8点</p>
            </div>
          ) : (
            <>
              <Trophy className={gameStatus === 'won' ? 'text-yellow-400 mb-4' : 'text-gray-400 mb-4'} size={80} />
              <h2 className="text-5xl font-black mb-4 uppercase italic">
                {gameStatus === 'won' ? 'YOU WIN!' : 'GAME OVER'}
              </h2>
            </>
          )}
          <button
            onClick={startGame}
            className="mt-8 bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-4 rounded-full font-black text-xl shadow-2xl transition-all hover:scale-105"
          >
            {gameStatus === 'waiting' ? 'START GAME' : 'PLAY AGAIN'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CrazyEights;