import React, { useState, useEffect, useCallback } from "react";
import { Trophy, RotateCcw, User, Cpu, AlertCircle } from "lucide-react";

// --- 常量定义 ---
const SUITS = ["♥️", "♦️", "♣️", "♠️"];
const VALUES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// 生成一副洗好的牌
const createDeck = () => {
  const deck = [];
  SUITS.forEach((suit) => {
    VALUES.forEach((value) => {
      deck.push({ suit, value });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const CrazyEights = () => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [aiHand, setAiHand] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [currentSuit, setCurrentSuit] = useState(null); // 处理数字8改花色
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, playing, won, lost
  const [showSuitPicker, setShowSuitPicker] = useState(false);

  // --- 游戏初始化 ---
  const startGame = () => {
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 8);
    const aHand = newDeck.splice(0, 8);
    const firstDiscard = newDeck.pop();

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setIsPlayerTurn(true);
    setGameStatus("playing");
  };

  // --- 核心逻辑：判断是否可以出牌 ---
  const canPlay = (card) => {
    const topCard = discardPile[discardPile.length - 1];
    return (
      card.value === "8" ||
      card.suit === currentSuit ||
      card.value === topCard.value
    );
  };

  // --- 玩家出牌 ---
  const playCard = (cardIndex) => {
    if (!isPlayerTurn || gameStatus !== "playing") return;
    const card = playerHand[cardIndex];

    if (canPlay(card)) {
      const newHand = [...playerHand];
      newHand.splice(cardIndex, 1);
      setPlayerHand(newHand);
      setDiscardPile([...discardPile, card]);

      if (newHand.length === 0) {
        setGameStatus("won");
        return;
      }

      if (card.value === "8") {
        setShowSuitPicker(true);
      } else {
        setCurrentSuit(card.suit);
        setIsPlayerTurn(false);
      }
    }
  };

  // --- 摸牌逻辑 ---
  const drawCard = (isPlayer) => {
    if (deck.length === 0) {
      if (!isPlayer) setIsPlayerTurn(true); // AI 无牌可摸则跳过
      return;
    }

    const newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand([...playerHand, card]);
    } else {
      setAiHand([...aiHand, card]);
    }
  };

  // --- AI 逻辑 ---
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === "playing") {
      const timer = setTimeout(() => {
        const playableIndex = aiHand.findIndex((card) => canPlay(card));

        if (playableIndex !== -1) {
          const card = aiHand[playableIndex];
          const newAiHand = [...aiHand];
          newAiHand.splice(playableIndex, 1);
          setAiHand(newAiHand);
          setDiscardPile([...discardPile, card]);

          if (newAiHand.length === 0) {
            setGameStatus("lost");
          } else {
            setCurrentSuit(
              card.value === "8"
                ? SUITS[Math.floor(Math.random() * 4)]
                : card.suit
            );
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

  // --- UI 组件 ---
  const Card = ({ card, isHidden, onClick, disabled }) => (
    <div
      onClick={onClick}
      className={`relative w-16 h-24 md:w-24 md:h-36 rounded-xl border-2 flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer transition-all transform hover:-translate-y-2
        ${isHidden ? "bg-blue-600 border-white" : "bg-white border-gray-200"}
        ${
          !isHidden && (card.suit === "♥️" || card.suit === "♦️")
            ? "text-red-500"
            : "text-slate-800"
        }
        ${disabled ? "opacity-50 grayscale cursor-not-allowed" : "shadow-lg"}`}
    >
      {isHidden ? (
        "?"
      ) : (
        <div className="flex flex-col items-center">
          <span>{card.value}</span>
          <span className="text-3xl">{card.suit}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-green-800 p-4 font-sans text-white flex flex-col items-center justify-between">
      {/* 顶部：AI 区域 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full text-sm">
          <Cpu size={16} /> AI 手牌: {aiHand.length}
        </div>
        <div className="flex -space-x-8 md:-space-x-12">
          {aiHand.map((_, i) => (
            <Card key={i} isHidden={true} />
          ))}
        </div>
      </div>

      {/* 中间：公共区域 */}
      <div className="flex gap-8 items-center my-8">
        <div className="text-center">
          <p className="text-xs mb-2 uppercase tracking-widest opacity-70">
            摸牌堆 ({deck.length})
          </p>
          <div
            onClick={() => isPlayerTurn && drawCard(true)}
            className="w-20 h-28 md:w-24 md:h-36 bg-blue-800 border-4 border-white/50 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <RotateCcw size={32} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs mb-2 uppercase tracking-widest text-yellow-400">
            当前花色: {currentSuit}
          </p>
          <Card
            card={discardPile[discardPile.length - 1] || {}}
            isHidden={discardPile.length === 0}
          />
        </div>
      </div>

      {/* 底部：玩家区域 */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-4">
        <div
          className={`flex flex-wrap justify-center gap-2 md:gap-4 transition-opacity ${
            !isPlayerTurn ? "opacity-50" : ""
          }`}
        >
          {playerHand.map((card, i) => (
            <Card
              key={i}
              card={card}
              onClick={() => playCard(i)}
              disabled={!isPlayerTurn || !canPlay(card)}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 bg-blue-600 px-6 py-2 rounded-full font-bold shadow-lg">
            <User size={18} /> 你的回合
          </div>
        </div>
      </div>

      {/* 弹窗：选择 8 的花色 */}
      {showSuitPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl text-slate-800 text-center">
            <h3 className="text-xl font-bold mb-4">选择一个新的花色</h3>
            <div className="grid grid-cols-2 gap-4">
              {SUITS.map((suit) => (
                <button
                  key={suit}
                  onClick={() => {
                    setCurrentSuit(suit);
                    setShowSuitPicker(false);
                    setIsPlayerTurn(false);
                  }}
                  className="text-4xl p-4 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 结束界面 */}
      {gameStatus !== "playing" && gameStatus !== "waiting" && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6 text-center">
          <Trophy
            className={
              gameStatus === "won"
                ? "text-yellow-400 mb-4"
                : "text-gray-400 mb-4"
            }
            size={80}
          />
          <h2 className="text-5xl font-black mb-4 uppercase italic">
            {gameStatus === "won" ? "YOU WIN!" : "GAME OVER"}
          </h2>
          <button
            onClick={startGame}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-4 rounded-full font-black text-xl shadow-2xl transition-all"
          >
            再玩一次
          </button>
        </div>
      )}

      {/* 开始按钮 */}
      {gameStatus === "waiting" && (
        <div className="fixed inset-0 bg-green-900 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl font-black mb-8 italic text-yellow-400">
            CRAZY EIGHTS
          </h1>
          <button
            onClick={startGame}
            className="bg-white text-green-900 px-12 py-4 rounded-full font-black text-2xl hover:scale-105 transition-transform"
          >
            开始游戏
          </button>
        </div>
      )}
    </div>
  );
};

export default CrazyEights;
