import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, User, Cpu, Sparkles } from 'lucide-react';

interface CardType {
  suit: string;
  value: string;
}

// 打出8时的金色粒子特效状态
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const SUITS = ['♥️', '♦️', '♣️', '♠️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 每个花色对应的中国知名建筑 emoji
const SUIT_LANDMARK: Record<string, string> = {
  '♥️': '🏯',  // 故宫
  '♦️': '🗼',  // 东方明珠
  '♣️': '🏔️', // 黄山
  '♠️': '🌉',  // 南京长江大桥
};

const createDeck = (): CardType[] => {
  const deck: CardType[] = [];
  SUITS.forEach(suit => VALUES.forEach(value => deck.push({ suit, value })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const CrazyEights: React.FC = () => {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [aiHand, setAiHand] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentSuit, setCurrentSuit] = useState<string | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // 金色粒子特效 / Gold particle burst when 8 is played
  const triggerParticles = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: 50,
      y: 50,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 900);
  }, []);

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
    setParticles([]);
  };

  // A card is playable if it's an 8 (wild), matches current suit, or matches top card value
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
      if (newHand.length === 0) { setGameStatus('won'); return; }
      if (card.value === '8') {
        triggerParticles();
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
    }
    const newDeck = [...deck];
    const card = newDeck.pop() as CardType;
    setDeck(newDeck);
    if (isPlayer) setPlayerHand([...playerHand, card]);
    else setAiHand([...aiHand, card]);
  };

  // AI strategy: prefer non-8 cards; use 8 only as last resort
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = aiHand
          .map((card, index) => ({ card, index }))
          .filter(({ card }) => canPlay(card));
        const preferred =
          playableCards.find(({ card }) => card.value !== '8') ||
          (aiHand.length === 1 ? playableCards[0] : null) ||
          playableCards.find(({ card }) => card.value === '8');
        if (preferred) {
          const { card, index } = preferred;
          const newAiHand = [...aiHand];
          newAiHand.splice(index, 1);
          setAiHand(newAiHand);
          setDiscardPile([...discardPile, card]);
          if (newAiHand.length === 0) {
            setGameStatus('lost');
          } else {
            if (card.value === '8') triggerParticles();
            setCurrentSuit(card.value === '8' ? SUITS[Math.floor(Math.random() * 4)] : card.suit);
            setIsPlayerTurn(true);
          }
        } else {
          if (deck.length > 0) drawCard(false);
          setIsPlayerTurn(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, aiHand, discardPile, gameStatus]);

  // Card 组件 / Card component with gold border, layered shadow, glow on hover
  const Card = ({ card, isHidden, onClick, disabled }: {
    card?: CardType;
    isHidden: boolean;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <div
      onClick={onClick}
      className={`relative w-16 h-24 md:w-24 md:h-36 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer transition-all duration-200 transform overflow-hidden select-none
        ${!disabled ? 'hover:-translate-y-3 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}
        ${isHidden
          ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-yellow-400/60'
          : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border-2 border-yellow-400/80'}
        ${!isHidden && card && (card.suit === '♥️' || card.suit === '♦️') ? 'text-red-500' : 'text-slate-800'}
        ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'shadow-[0_4px_15px_rgba(0,0,0,0.4)]'}`}
    >
      {isHidden ? (
        // 牌背：奔腾小马 + 金色装饰
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl drop-shadow-lg">🐴</span>
          <span className="text-[10px] text-yellow-400/80 font-normal tracking-widest">✦ ✦ ✦</span>
        </div>
      ) : (
        <div className="flex flex-col items-center relative w-full h-full justify-center p-1">
          {/* 角落点数 */}
          <span className="absolute top-1 left-1.5 text-xs font-black leading-none">{card?.value}</span>
          <span className="absolute bottom-1 right-1.5 text-xs font-black leading-none rotate-180">{card?.value}</span>
          {/* 半透明建筑背景 */}
          {card?.suit && (
            <span className="absolute text-5xl opacity-15 select-none pointer-events-none">
              {SUIT_LANDMARK[card.suit]}
            </span>
          )}
          {/* 中心花色 */}
          <span className="relative z-10 text-3xl drop-shadow-sm">{card?.suit}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen font-sans text-white flex flex-col items-center justify-between overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a3a2a 0%, #0d1f16 60%, #060e0a 100%)' }}
    >
      {/* 暗角效果 Vignette */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.7)' }} />

      {/* 金色粒子特效 / Gold particles when 8 is played */}
      {particles.map(p => (
        <div key={p.id}
          className="pointer-events-none fixed z-40 w-2 h-2 rounded-full bg-yellow-400"
          style={{
            left: `calc(50% + ${p.vx * 30}px)`,
            top: `calc(50% + ${p.vy * 30}px)`,
            opacity: p.life,
            transform: `scale(${p.life})`,
            transition: 'all 0.8s ease-out',
            boxShadow: '0 0 6px 2px rgba(250,204,21,0.8)',
          }}
        />
      ))}

      {/* AI 区域 */}
      <div className="relative z-10 flex flex-col items-center gap-2 pt-4">
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-sm text-white/80">
          <Cpu size={14} /> <span>AI · {aiHand.length} cards</span>
        </div>
        <div className="flex -space-x-8 md:-space-x-12">
          {aiHand.map((_, i) => <Card key={i} isHidden={true} />)}
        </div>
      </div>

      {/* 公共区域 */}
      <div className="relative z-10 flex gap-10 items-center my-6">
        <div className="text-center">
          <p className="text-xs mb-2 uppercase tracking-widest text-white/40">Deck ({deck.length})</p>
          <div
            onClick={() => isPlayerTurn && drawCard(true)}
            className="w-20 h-28 md:w-24 md:h-36 bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-yellow-400/50 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 hover:border-yellow-400 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <RotateCcw size={28} className="text-yellow-400/70" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs mb-2 uppercase tracking-widest text-yellow-400/80">
            {currentSuit} Current Suit
          </p>
          <Card
            card={discardPile[discardPile.length - 1]}
            isHidden={discardPile.length === 0}
          />
        </div>
      </div>

      {/* 玩家区域 */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-3 pb-4">
        <div className={`flex flex-wrap justify-center gap-2 md:gap-3 transition-opacity ${!isPlayerTurn ? 'opacity-40' : ''}`}>
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
        {/* 状态栏 毛玻璃 */}
        <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold backdrop-blur-md border transition-all
          ${isPlayerTurn
            ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-300'
            : 'bg-white/10 border-white/10 text-white/50'}`}>
          <User size={14} />
          {isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}
        </div>
      </div>

      {/* 花色选择弹窗 */}
      {showSuitPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/90 border border-yellow-400/30 p-8 rounded-2xl text-center shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-yellow-400 tracking-widest uppercase">Choose a Suit</h3>
            <div className="grid grid-cols-2 gap-3">
              {SUITS.map(suit => (
                <button
                  key={suit}
                  onClick={() => {
                    setCurrentSuit(suit);
                    setShowSuitPicker(false);
                    setIsPlayerTurn(false);
                  }}
                  className="text-4xl p-4 hover:bg-yellow-400/20 rounded-xl border border-white/10 hover:border-yellow-400/50 transition-all hover:scale-110"
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 开始 / 结算界面 */}
      {gameStatus !== 'playing' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 p-6 text-center"
          style={{ background: 'radial-gradient(ellipse at center, #0d2a1a 0%, #060e0a 100%)' }}
        >
          {/* 暗角 */}
          <div className="pointer-events-none fixed inset-0"
            style={{ boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.8)' }} />

          <div className="relative z-10 flex flex-col items-center">
            {gameStatus === 'waiting' ? (
              <div className="bg-white/5 backdrop-blur-md border border-yellow-400/20 rounded-3xl px-12 py-10 shadow-2xl flex flex-col items-center mb-8">
                {/* 衬线风格标题 */}
                <h1 className="text-6xl font-black italic text-yellow-400 mb-1 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                  style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>
                  Bela'Crazy Eights
                </h1>
                <p className="text-xl text-white/60 tracking-[0.3em] mt-2">Bela 的疯狂8点</p>
                <div className="mt-4 flex gap-2 text-yellow-400/40 text-2xl">
                  <span>♥️</span><span>♦️</span><span>♣️</span><span>♠️</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center mb-8">
                <Trophy
                  className={gameStatus === 'won' ? 'text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'text-slate-500 mb-4'}
                  size={80}
                />
                <h2 className="text-5xl font-black uppercase italic tracking-wider"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {gameStatus === 'won' ? 'YOU WIN!' : 'GAME OVER'}
                </h2>
              </div>
            )}

            <button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black px-14 py-4 rounded-full font-black text-xl shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_40px_rgba(250,204,21,0.7)] transition-all hover:scale-105 active:scale-95"
            >
              {gameStatus === 'waiting' ? 'START GAME' : 'PLAY AGAIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrazyEights;
