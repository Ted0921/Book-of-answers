import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import { fetchAnswer } from './services/geminiService';
import NumberInput from './components/NumberInput';
import AnswerDisplay from './components/AnswerDisplay';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.AwaitingInput);
  const [answer, setAnswer] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const seekAnswer = useCallback(async () => {
    if (gameState === GameState.Thinking) return;
    
    setGameState(GameState.Thinking);
    setError(null);

    try {
      const newAnswer = await fetchAnswer();
      setAnswer(newAnswer);
      setGameState(GameState.Answer);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setGameState(GameState.Error);
    }
  }, [gameState]);

  const handleReset = useCallback(() => {
    setGameState(GameState.AwaitingInput);
    setAnswer('');
    setError(null);
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {gameState === GameState.AwaitingInput ? (
          <NumberInput onSubmit={seekAnswer} />
        ) : (
          <>
            <AnswerDisplay 
              gameState={gameState}
              answer={answer}
              error={error}
            />
            {(gameState === GameState.Answer || gameState === GameState.Error) && (
              <button
                onClick={handleReset}
                className="mt-6 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
              >
                Ask Another Question
              </button>
            )}
          </>
        )}
      </div>
      <footer className="absolute bottom-4 text-center text-xs text-gray-500">
          <p>Powered by Gemini. For entertainment purposes only.</p>
      </footer>
    </main>
  );
};

export default App;