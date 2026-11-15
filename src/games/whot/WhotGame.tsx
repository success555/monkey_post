import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WhotEngine } from './WhotEngine';
import { WhotDeck } from './WhotDeck';
import { whotSound } from './WhotAudio';
import { WhotCard, WhotSuit, WhotGameState } from './types';

interface WhotGameProps {
  onExit: () => void;
}

const CHIDI_QUOTES = {
  idle: [
    "Play your card quick, my friend, no time to waste!",
    "Keep your eyes on the market, harmattan dey blow!",
    "You think you fit check up on Bros Chidi?",
    "Street card master don play Whot before you wear short knicker!"
  ],
  playerHoldOn: [
    "Ehn ehn? Hold On? You wan play double?",
    "Continuous fire! Make we see your next card!"
  ],
  playerAttack: [
    "Ah ah! Pick two? Who do you this kind thing?!",
    "General Market?! Chai, see as you send me go buy bread!"
  ],
  aiAttack: [
    "Oya take this one! Go market go buy pure water!",
    "Suspension! You no dey go anywhere this round!",
    "General Market! Everybody must report to market!"
  ],
  lastCard: [
    "LAST CARD OH! Danger dey look you for face!",
    "One card left! If you no block am now, na check-up straight!"
  ],
  checkUp: [
    "CHECK UP! Match don finish! Pack your cards go house!",
    "Kabiyesi! You play well, true Naija Whot champion!"
  ]
};

export const WhotGame: React.FC<WhotGameProps> = ({ onExit }) => {
  const engineRef = useRef<WhotEngine>(new WhotEngine());
  const [gameState, setGameState] = useState<WhotGameState>(engineRef.current.state);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSuitPicker, setShowSuitPicker] = useState<boolean>(false);
  const [pendingWhotCardId, setPendingWhotCardId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [commentary, setCommentary] = useState<string>("Welcome to Naija Whot! First to check up wins.");

  const getRandomQuote = (quotes: string[]) => quotes[Math.floor(Math.random() * quotes.length)];

  // Helper to sync state
  const syncState = useCallback(() => {
    setGameState({ ...engineRef.current.state });
  }, []);

  // AI Turn Logic
  const triggerAiTurn = useCallback(() => {
    if (engineRef.current.state.isGameOver) return;
    setIsAiThinking(true);
    setCommentary("Bros Chidi is reading the table...");

    setTimeout(() => {
      const engine = engineRef.current;
      const aiDecision = engine.getBestAIMove();

      if (aiDecision.action === 'play' && aiDecision.cardId) {
        const result = engine.playCard(aiDecision.cardId, aiDecision.chosenSuit);
        whotSound.playCardSlap();

        if (result.specialAction === 'hold_on') whotSound.playHoldOn();
        else if (result.specialAction === 'pick_two' || result.specialAction === 'pick_three') whotSound.playPickPenalty();
        else if (result.specialAction === 'general_market') whotSound.playGeneralMarket();
        else if (result.specialAction === 'whot') whotSound.playWhot20();

        if (result.isCheckUp) {
          whotSound.playCheckUp();
          setShowWinModal(true);
          setCommentary(getRandomQuote(CHIDI_QUOTES.checkUp));
        } else if (engine.state.aiHand.length === 1) {
          setCommentary("Bros Chidi shouts: LAST CARD!");
        } else if (result.specialAction !== 'normal') {
          setCommentary(getRandomQuote(CHIDI_QUOTES.aiAttack));
        } else {
          setCommentary(getRandomQuote(CHIDI_QUOTES.idle));
        }

        syncState();

        // If AI played Hold On or Suspension, it plays again!
        if (result.nextTurn === 'ai' && !result.isCheckUp) {
          triggerAiTurn();
          return;
        }
      } else {
        // AI goes to market
        engine.goToMarket();
        whotSound.playCardSlide();
        setCommentary("Bros Chidi went to Market!");
        syncState();
      }

      setIsAiThinking(false);
    }, 850);
  }, [syncState]);

  // Handle Player Clicking a Card in Hand
  const handlePlayCard = (card: WhotCard) => {
    const engine = engineRef.current;
    if (gameState.currentTurn !== 'player' || isAiThinking || gameState.isGameOver) return;

    if (!engine.canPlayCard(card)) {
      return;
    }

    // If 20 WHOT! card is selected, open suit picker modal
    if (card.number === 20) {
      setPendingWhotCardId(card.id);
      setShowSuitPicker(true);
      return;
    }

    executePlayerPlay(card.id);
  };

  // Execute Player Card Play
  const executePlayerPlay = (cardId: string, chosenSuit?: WhotSuit) => {
    const engine = engineRef.current;
    const result = engine.playCard(cardId, chosenSuit);
    if (!result.valid) return;

    whotSound.playCardSlap();
    if (result.specialAction === 'hold_on') whotSound.playHoldOn();
    else if (result.specialAction === 'pick_two' || result.specialAction === 'pick_three') whotSound.playPickPenalty();
    else if (result.specialAction === 'general_market') whotSound.playGeneralMarket();
    else if (result.specialAction === 'whot') whotSound.playWhot20();

    if (result.isCheckUp) {
      whotSound.playCheckUp();
      setShowWinModal(true);
      setCommentary(getRandomQuote(CHIDI_QUOTES.checkUp));
    } else if (engine.state.playerHand.length === 1) {
      setCommentary("LAST CARD! You dey on fire!");
    } else if (result.specialAction === 'hold_on') {
      setCommentary(getRandomQuote(CHIDI_QUOTES.playerHoldOn));
    } else if (['pick_two', 'pick_three', 'general_market'].includes(result.specialAction)) {
      setCommentary(getRandomQuote(CHIDI_QUOTES.playerAttack));
    }

    syncState();

    // If turn switched to AI, trigger AI loop
    if (result.nextTurn === 'ai' && !result.isCheckUp) {
      triggerAiTurn();
    }
  };

  // Complete Whot 20 play with chosen suit
  const handleSelectWhotSuit = (suit: WhotSuit) => {
    if (!pendingWhotCardId) return;
    setShowSuitPicker(false);
    executePlayerPlay(pendingWhotCardId, suit);
    setPendingWhotCardId(null);
  };

  // Player Goes to Market (Draws Card)
  const handleGoToMarket = () => {
    if (gameState.currentTurn !== 'player' || isAiThinking || gameState.isGameOver) return;
    const engine = engineRef.current;

    whotSound.playCardSlide();
    engine.goToMarket();
    setCommentary("You went to Market!");
    syncState();

    // Pass turn to AI
    triggerAiTurn();
  };

  // Restart Match
  const handleRestart = () => {
    engineRef.current.reset();
    syncState();
    setIsAiThinking(false);
    setShowWinModal(false);
    setShowSuitPicker(false);
    setPendingWhotCardId(null);
    setCommentary("New match started! First to check up wins.");
  };

  const handleToggleMute = () => {
    const muted = whotSound.toggleMute();
    setIsMuted(muted);
  };

  const topDiscard = engineRef.current.getTopDiscard();
  const playablePlayerCards = engineRef.current.getPlayableCards(gameState.playerHand);

  return (
    <div className="relative w-screen h-[100dvh] max-h-screen overflow-hidden bg-emerald-950 font-sans select-none text-white flex flex-col justify-between p-1 xs:p-1.5 sm:p-3">
      {/* Table Background with Rich Lagos Green Felt & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800 via-emerald-950 to-stone-950 opacity-95 pointer-events-none" />

      {/* Decorative Table Felt Border */}
      <div className="absolute inset-1 xs:inset-1.5 sm:inset-3 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-amber-600/30 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] sm:shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none" />

      {/* HEADER HUD */}
      <header className="relative z-20 shrink-0 flex items-center justify-between w-full px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-b from-stone-950/80 to-transparent">
        {/* Back to Hub Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-600/30 text-amber-300 font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-md active:scale-95"
          >
            <span>&larr;</span>
            <span className="hidden xs:inline">ARCADE</span>
            <span>HUB</span>
          </button>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-600/20 text-amber-400 text-xs font-semibold">
            <span>🃏</span>
            <span>NAIJA WHOT! CARD GAME</span>
          </div>
        </div>

        {/* Turn Status Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-900/90 backdrop-blur-md px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full sm:rounded-2xl border border-amber-500/30 shadow-lg">
          <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${gameState.currentTurn === 'player' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">
            <span className="hidden sm:inline">
              {gameState.currentTurn === 'player' ? 'Your Turn to Play' : 'Bros Chidi Thinking...'}
            </span>
            <span className="sm:hidden">
              {gameState.currentTurn === 'player' ? 'Your Turn' : 'Chidi Thinking'}
            </span>
          </span>
        </div>

        {/* Action Buttons (Mute, Rules, Restart) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleToggleMute}
            aria-label="Toggle Mute"
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-xs sm:text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setShowRules(true)}
            aria-label="Rules Guide"
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-600/40 flex items-center justify-center text-xs sm:text-sm font-black text-amber-400 hover:text-amber-200 transition-all active:scale-95 shadow-sm"
          >
            ?
          </button>
          <button
            onClick={handleRestart}
            aria-label="Restart Match"
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-center text-xs sm:text-sm text-stone-300 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            ↺
          </button>
        </div>
      </header>

      {/* TOP OPPONENT: BROS CHIDI (AI) */}
      <section aria-label="Opponent Area" className="relative z-10 shrink-0 flex flex-col items-center justify-center my-0.5 sm:my-1">
        {/* Opponent Info Header */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-950/70 border border-stone-800 backdrop-blur mb-0.5 sm:mb-1">
          <span className="text-xs sm:text-sm">🧔🏾‍♂️</span>
          <span className="text-[10px] sm:text-xs font-bold text-amber-200">Bros Chidi</span>
          <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
            {gameState.aiHand.length} Cards
          </span>
          {gameState.aiCalledLastCard && (
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-black animate-bounce shadow">
              LAST CARD!
            </span>
          )}
        </div>

        {/* Opponent Card Stack (Face Down Fans) */}
        <div className="flex justify-center -space-x-2.5 sm:-space-x-3.5 max-w-[95vw] overflow-hidden px-2 py-0.5">
          {gameState.aiHand.map((card, idx) => (
            <div
              key={card.id}
              className="w-[clamp(1.75rem,5.5vh,3.25rem)] h-[clamp(2.5rem,7.5vh,4.5rem)] rounded-md sm:rounded-lg bg-gradient-to-br from-amber-700 via-amber-900 to-stone-950 border border-amber-500/40 shadow-md flex items-center justify-center text-amber-400/80 transform transition-transform"
              style={{
                transform: `rotate(${(idx - gameState.aiHand.length / 2) * 2}deg)`
              }}
            >
              <span className="font-display text-[7px] sm:text-[9px] font-black tracking-wider text-amber-400/60">WHOT</span>
            </div>
          ))}
        </div>
      </section>

      {/* CENTER CARD ARENA: MARKET PILE + DISCARD PILE + STATUS BANNERS */}
      <main aria-label="Table Arena" className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center w-full px-2 py-0.5 sm:py-1 my-auto">
        {/* Commentary Speech Banner */}
        <div className="mb-1 sm:mb-1.5 max-w-xs sm:max-w-md px-3 py-0.5 sm:py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-600/30 shadow-md text-center">
          <p className="text-[10px] sm:text-xs font-semibold text-amber-200 italic truncate">
            &ldquo;{commentary}&rdquo;
          </p>
        </div>

        {/* Penalty Warning Banner (Pick 2 / Pick 3) */}
        {gameState.pendingPenalty > 0 && (
          <div className="mb-1 sm:mb-1.5 px-2.5 py-0.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-[9px] sm:text-xs font-black animate-pulse shadow-md flex items-center gap-1.5">
            <span>⚠️</span>
            <span>
              +{gameState.pendingPenalty} CARDS! Defend with {gameState.penaltyType === 'pick_two' ? '2' : '5'} or Market!
            </span>
          </div>
        )}

        {/* Demanded Suit Banner from 20 Whot */}
        {gameState.demandedSuit && (
          <div className="mb-1 sm:mb-1.5 px-2.5 py-0.5 rounded-xl bg-amber-950/90 border border-amber-400 text-amber-200 text-[9px] sm:text-xs font-black shadow-md flex items-center gap-1.5 animate-bounce">
            <span>📿</span>
            <span>
              CALL: {gameState.demandedSuit.toUpperCase()} {WhotDeck.getSuitSymbol(gameState.demandedSuit)}
            </span>
          </div>
        )}

        {/* The Two Center Piles: Market (Draw) vs Discard (Live) */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-10 my-auto">
          {/* MARKET PILE (DRAW DECK) */}
          <div
            onClick={handleGoToMarket}
            className={`group relative w-[clamp(3.8rem,11.5vh,6.5rem)] h-[clamp(5.2rem,16.5vh,9.5rem)] rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-700 via-amber-900 to-stone-950 border-2 border-amber-500/50 shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 hover:border-amber-400 hover:shadow-amber-500/20 ${
              gameState.currentTurn === 'player' ? 'hover:-translate-y-1 sm:hover:-translate-y-2' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            {/* Card Stack Illusion Shadows */}
            <div className="absolute inset-0.5 rounded-xl sm:rounded-2xl bg-amber-800 -rotate-2 -z-10 shadow-sm" />
            <div className="absolute inset-1 rounded-xl sm:rounded-2xl bg-amber-900 rotate-2 -z-20 shadow-sm" />

            <span className="text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-wider text-amber-300/80 mb-0.5">
              MARKET
            </span>
            <span className="text-xs sm:text-base md:text-xl font-display font-black text-amber-400 group-hover:scale-105 transition-transform">
              WHOT
            </span>
            <div className="mt-0.5 sm:mt-1 px-1.5 py-0.2 rounded-full bg-stone-950/80 border border-amber-500/30 text-[7px] sm:text-[8px] md:text-[9px] font-bold text-amber-300">
              {gameState.marketDeck.length} left
            </div>
            {gameState.currentTurn === 'player' && (
              <span className="mt-0.5 text-[6px] sm:text-[7px] md:text-[8px] font-extrabold text-emerald-400 uppercase tracking-tight">
                {gameState.pendingPenalty > 0 ? `+${gameState.pendingPenalty}` : 'DRAW'}
              </span>
            )}
          </div>

          {/* DISCARD PILE (TOP LIVE CARD) */}
          <div className="relative">
            {topDiscard && (
              <WhotCardView
                card={topDiscard}
                isPlayable={false}
                size="large"
                className="transform rotate-1 shadow-xl ring-2 ring-amber-400/40"
              />
            )}
            <div className="absolute -bottom-3.5 sm:-bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] sm:text-[9px] font-black tracking-wider uppercase text-stone-300 bg-stone-950/80 px-1.5 sm:px-2 py-0.2 rounded-full border border-stone-700">
              Current Card
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM AREA: PLAYER'S HAND & CONTROLS */}
      <footer aria-label="Player Hand Area" className="relative z-20 shrink-0 flex flex-col items-center justify-end w-full pb-0.5 sm:pb-1">
        {/* Hand Status & Last Card Warning */}
        <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1 px-2.5 py-0.5 rounded-full bg-stone-950/80 backdrop-blur border border-stone-800 text-[10px] sm:text-xs">
          <span className="font-bold text-stone-200">Your Hand ({gameState.playerHand.length})</span>
          {gameState.playerCalledLastCard && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-stone-950 font-black animate-pulse">
              LAST CARD!
            </span>
          )}
          {playablePlayerCards.length === 0 && gameState.currentTurn === 'player' && !gameState.isGameOver && (
            <span className="text-amber-400 font-bold hidden sm:inline">&mdash; Click Market to draw!</span>
          )}
        </div>

        {/* Fanned Interactive Player Cards */}
        <div className="flex justify-center items-end -space-x-3 sm:-space-x-4 md:-space-x-5 max-w-[96vw] overflow-x-auto px-2 sm:px-4 pt-1 sm:pt-2 pb-0.5 scrollbar-none">
          {gameState.playerHand.map((card, idx) => {
            const isPlayable = gameState.currentTurn === 'player' && engineRef.current.canPlayCard(card);
            const total = gameState.playerHand.length;
            const rotation = (idx - total / 2) * 2;

            return (
              <div
                key={card.id}
                onClick={() => handlePlayCard(card)}
                className={`transition-all duration-200 shrink-0 ${
                  isPlayable
                    ? 'cursor-pointer hover:-translate-y-3 sm:hover:-translate-y-5 hover:scale-105 active:scale-95 hover:z-30'
                    : 'opacity-80 cursor-not-allowed'
                }`}
                style={{
                  transform: `rotate(${rotation}deg)`
                }}
              >
                <WhotCardView card={card} isPlayable={isPlayable} size="normal" />
              </div>
            );
          })}
        </div>
      </footer>

      {/* SUIT PICKER MODAL (When Playing WHOT 20) */}
      {showSuitPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-md max-h-[92vh] overflow-y-auto bg-stone-900 border-2 border-yellow-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 text-center shadow-2xl">
            <span className="text-3xl sm:text-4xl block mb-1 sm:mb-2">📿</span>
            <h2 className="text-lg sm:text-2xl font-black text-yellow-400 mb-0.5 sm:mb-1">CALL YOUR SHAPE!</h2>
            <p className="text-[10px] sm:text-xs text-stone-400 mb-3 sm:mb-6">
              You played WHOT 20! Choose which shape the opponent must play:
            </p>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-6">
              {(['circle', 'triangle', 'cross', 'square', 'star'] as WhotSuit[]).map((suit) => {
                const color = WhotDeck.getSuitColor(suit);
                const symbol = WhotDeck.getSuitSymbol(suit);

                return (
                  <button
                    key={suit}
                    onClick={() => handleSelectWhotSuit(suit)}
                    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 ${color.border} ${color.bg} hover:scale-105 active:scale-95 transition-all shadow-lg group`}
                  >
                    <span className={`text-xl sm:text-3xl ${color.text} mb-0.5 sm:mb-1 group-hover:scale-110 transition-transform`}>
                      {symbol}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-stone-200">
                      {suit}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setShowSuitPicker(false);
                setPendingWhotCardId(null);
              }}
              className="text-xs text-stone-400 hover:text-stone-200 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* RULES GUIDE MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-stone-900 border border-amber-600/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-stone-200">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center text-sm"
            >
              &times;
            </button>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🃏</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-amber-400">NAIJA WHOT! RULES</h2>
                <p className="text-[10px] sm:text-xs text-stone-400">The Undisputed National Card Game of Nigeria</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 text-[11px] sm:text-xs leading-relaxed text-stone-300">
              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">Basic Play</span>
                Match the <strong>Shape</strong> (Circle, Triangle, Cross, Square, Star) or <strong>Number</strong> of the top card on the discard pile. If you have no match, you must <strong>Go to Market</strong> and draw 1 card.
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-1">Special Action Cards</span>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>1 = HOLD ON</strong>: Play again immediately!</li>
                  <li><strong>2 = PICK TWO</strong>: Next player picks 2 cards from Market (defendable!).</li>
                  <li><strong>5 = PICK THREE</strong>: Next player picks 3 cards from Market (defendable!).</li>
                  <li><strong>8 = SUSPENSION</strong>: The next player is suspended (skips turn).</li>
                  <li><strong>14 = GENERAL MARKET</strong>: ALL other players must draw 1 card!</li>
                  <li><strong>20 = WHOT! (Wild Card)</strong>: Play on any card and call any shape!</li>
                </ul>
              </div>

              <div className="p-2.5 sm:p-3 bg-stone-950/60 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">Last Card & Check Up</span>
                When you hold only 1 card left, you shout <strong>&quot;LAST CARD!&quot;</strong>. The first player to shed all cards shouts <strong>&quot;CHECK UP!&quot;</strong> and wins!
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
            >
              Got it &mdash; Let&apos;s Play!
            </button>
          </div>
        </div>
      )}

      {/* CHECK-UP / GAME OVER MODAL */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-md bg-stone-900 border-2 border-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-2xl">
            <span className="text-4xl sm:text-5xl block mb-1 sm:mb-2">
              {gameState.winner === 'player' ? '👑' : '🧔🏾‍♂️'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 mb-1">
              {gameState.winner === 'player' ? 'CHECK UP! YOU WIN!' : 'CHECK UP! BROS CHIDI WINS!'}
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-300 mb-4 sm:mb-6">
              {gameState.winner === 'player'
                ? "Kabiyesi! You cleared your entire hand! Real Naija card grandmaster!"
                : "Bros Chidi swept the table clean! Better practice your market defense!"}
            </p>

            <div className="flex gap-2.5 sm:gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-[11px] sm:text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 shadow-lg shadow-amber-500/30"
              >
                Play Rematch
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all border border-stone-700"
              >
                Arcade Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: BEAUTIFULLY RENDERED NAIJA WHOT CARD ---
interface WhotCardViewProps {
  card: WhotCard;
  isPlayable: boolean;
  size?: 'normal' | 'large';
  className?: string;
}

const WhotCardView: React.FC<WhotCardViewProps> = ({
  card,
  isPlayable,
  size = 'normal',
  className = ''
}) => {
  const color = WhotDeck.getSuitColor(card.suit);
  const symbol = WhotDeck.getSuitSymbol(card.suit);
  const isWhot = card.number === 20;

  const sizeStyles = size === 'large'
    ? 'w-[clamp(3.8rem,11.5vh,6.5rem)] h-[clamp(5.2rem,16.5vh,9.5rem)]'
    : 'w-[clamp(2.9rem,8.8vh,5rem)] h-[clamp(4.2rem,13vh,7.2rem)]';

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl bg-stone-100 text-stone-950 font-sans border-2 select-none flex flex-col justify-between p-1 sm:p-2 shadow-lg transition-all ${sizeStyles} ${
        isPlayable
          ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-emerald-500/30'
          : 'border-stone-300'
      } ${className}`}
    >
      {/* Top Left Corner Number & Suit Symbol */}
      <div className="flex flex-col items-start leading-none">
        <span className={`font-black font-display text-[9px] sm:text-xs md:text-sm ${isWhot ? 'text-yellow-600' : 'text-stone-900'}`}>
          {card.number}
        </span>
        <span className={`text-[7px] sm:text-[9px] md:text-xs ${color.text}`}>
          {symbol}
        </span>
      </div>

      {/* Center Grand Symbol & Special Tag */}
      <div className="flex flex-col items-center justify-center my-auto leading-none">
        <span className={`${size === 'large' ? 'text-lg sm:text-2xl md:text-3xl' : 'text-sm sm:text-lg md:text-xl'} ${color.text} font-black drop-shadow-sm`}>
          {symbol}
        </span>
        {isWhot ? (
          <span className="text-[5px] sm:text-[6px] md:text-[7px] font-display font-black tracking-wider text-amber-700 uppercase mt-0.5">
            WHOT
          </span>
        ) : (
          <span className="text-[5px] sm:text-[6px] md:text-[7px] font-black uppercase text-stone-400 tracking-wider">
            {card.suit}
          </span>
        )}
      </div>

      {/* Bottom Right Corner Inverted Number & Symbol */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`font-black font-display text-[9px] sm:text-xs md:text-sm ${isWhot ? 'text-yellow-600' : 'text-stone-900'}`}>
          {card.number}
        </span>
        <span className={`text-[7px] sm:text-[9px] md:text-xs ${color.text}`}>
          {symbol}
        </span>
      </div>

      {/* Playable Indicator Glow Tag */}
      {isPlayable && (
        <div className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 px-1 sm:px-1.5 py-0.2 rounded-full bg-emerald-500 text-stone-950 text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-wider shadow">
          PLAY
        </div>
      )}
    </div>
  );
};

export default WhotGame;

