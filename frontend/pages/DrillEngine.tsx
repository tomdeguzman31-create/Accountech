
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SUBJECTS } from '../constants';
import { useAuth } from '../App';
import { drillApi } from '../services/api';
import { 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Lightbulb,
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  Home,
  Target,
  TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DrillQuestion = {
  id: string;
  topic: string;
  difficulty: string;
  content: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  reference: string;
};

type SubmitResult = {
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  status: 'Passed' | 'Remedial';
  remedials: Array<{
    questionId: string;
    topic: string;
    correctAnswer: string;
    selectedAnswer: string;
    referenceText: string | null;
  }>;
};

// ---------------------------------------------------------------------------
// Result Screen Component
// ---------------------------------------------------------------------------
const ResultScreen: React.FC<{
  result: SubmitResult;
  subjectName?: string;
  subjectCode?: string;
  onRetry: () => void;
  onHome: () => void;
}> = ({ result, subjectName, subjectCode, onRetry, onHome }) => {
  const isPassed = result.status === 'Passed';
  const pct = Math.round(result.accuracyPercentage);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className={`rounded-3xl p-8 text-white text-center mb-6 ${isPassed ? 'bg-gradient-to-br from-[#065f46] to-[#2f4f93]' : 'bg-gradient-to-br from-[#7f1d1d] to-[#2f4f93]'}`}>
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isPassed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          {isPassed ? <Trophy size={40} className="text-[#facc15]" /> : <Target size={40} className="text-red-300" />}
        </div>
        <h2 className="text-2xl font-black mb-1">{isPassed ? 'Drill Passed!' : 'Keep Practicing!'}</h2>
        {subjectCode && (
          <p className="text-white/70 text-sm font-bold mb-4">{subjectCode} — {subjectName}</p>
        )}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-4xl font-black text-[#facc15]">{pct}%</p>
            <p className="text-[10px] font-black uppercase text-white/60 mt-1">Accuracy</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-4xl font-black">{result.score}<span className="text-xl text-white/60">/{result.totalQuestions}</span></p>
            <p className="text-[10px] font-black uppercase text-white/60 mt-1">Score</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-4xl font-black">{result.totalQuestions - result.score}</p>
            <p className="text-[10px] font-black uppercase text-white/60 mt-1">Missed</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-700 flex items-center gap-2">
            <TrendingUp size={14} className="text-[#2f4f93]" />
            Performance
          </span>
          <span className={`text-xs font-black px-2 py-0.5 rounded ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {isPassed ? 'Passed' : 'Remedial'}
          </span>
        </div>
        <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] font-bold text-slate-400">0%</span>
          <span className="text-[9px] font-bold text-slate-400">Passing: 75%</span>
          <span className="text-[9px] font-bold text-slate-400">100%</span>
        </div>
      </div>

      {/* Remedial items */}
      {result.remedials.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-500" />
            Remedial Items ({result.remedials.length})
          </h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {result.remedials.map((r, i) => (
              <div key={r.questionId ?? i} className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-[10px] font-black uppercase text-amber-600 mb-1">{r.topic}</p>
                <div className="flex gap-3 text-[11px] font-bold">
                  <span className="text-red-600">
                    Your answer: <span className="font-black">{r.selectedAnswer}</span>
                  </span>
                  <span className="text-emerald-700">
                    Correct: <span className="font-black">{r.correctAnswer}</span>
                  </span>
                </div>
                {r.referenceText && (
                  <p className="mt-2 text-[10px] text-slate-600 italic leading-snug">"{r.referenceText}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-200 text-slate-700 font-black text-sm hover:bg-slate-300 transition-colors"
        >
          <Home size={18} />
          Dashboard
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1e3a8a] text-white font-black text-sm hover:bg-[#1e3a8a]/90 transition-colors"
        >
          <RotateCcw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main DrillEngine
// ---------------------------------------------------------------------------
const DrillEngine: React.FC<{ 
  subjectId: string; 
  difficultyTierId?: string;
  onComplete: () => void 
}> = ({ subjectId, difficultyTierId, onComplete }) => {
  const { token, difficultyTiers, subjects } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }>>([]);
  const [sessionQuestions, setSessionQuestions] = useState<DrillQuestion[]>([]);
  const [drillResult, setDrillResult] = useState<SubmitResult | null>(null);

  // Resolve subject info (try from context subjects first, then fallback to MOCK)
  const allSubjects = subjects.length ? subjects : MOCK_SUBJECTS;
  const currentSubject = allSubjects.find((s) => s.id === subjectId);
  
  const questions = useMemo(() => sessionQuestions, [sessionQuestions]);

  // ---------------------------------------------------------------------------
  // Load session questions
  // ---------------------------------------------------------------------------
  const startSession = () => {
    if (!token || !subjectId) {
      setError('Unable to start drill session. Please sign in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers([]);
    setDrillResult(null);

    const tierName = difficultyTiers.find((t) => t.id === difficultyTierId)?.name ?? '';
    // Extract the difficulty label from parentheses, e.g. "Recall (Easy)" → "Easy"
    const difficultyMatch = tierName.match(/\((.*?)\)/);
    const requestedDifficulty = difficultyMatch?.[1] as 'Easy' | 'Average' | 'Difficult' | undefined;

    drillApi
      .createSession(token, subjectId, requestedDifficulty)
      .then((payload) => setSessionQuestions(payload.questions))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load drill questions.';
        setError(message);
        setSessionQuestions([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    startSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, subjectId, difficultyTierId]);

  const currentQuestion = questions[currentIdx];

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleOptionSelect = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    setAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, selectedAnswer: selectedOption },
    ]);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Submit drill
      if (!token) {
        onComplete();
        return;
      }

      setIsSubmitting(true);
      drillApi
        .submit(token, { subjectId, answers })
        .then((result) => {
          setDrillResult(result);
        })
        .catch(() => {
          // If submit fails, still show a basic result from local scoring
          setDrillResult({
            score,
            totalQuestions: questions.length,
            accuracyPercentage: questions.length > 0 ? (score / questions.length) * 100 : 0,
            status: questions.length > 0 && (score / questions.length) >= 0.75 ? 'Passed' : 'Remedial',
            remedials: [],
          });
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const speakQuestionAndOptions = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    let fullText = currentQuestion.content + '. ';
    fullText += 'Option A: ' + currentQuestion.options.A + '. ';
    fullText += 'Option B: ' + currentQuestion.options.B + '. ';
    fullText += 'Option C: ' + currentQuestion.options.C + '. ';
    fullText += 'Option D: ' + currentQuestion.options.D + '. ';

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#1e3a8a]/10 flex items-center justify-center">
          <BookOpen size={28} className="text-[#1e3a8a] animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Preparing Drill Session...</h3>
        <p className="text-slate-500 text-sm">Fetching adaptive questions from the server.</p>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
          <Trophy size={28} className="text-emerald-500 animate-bounce" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Saving Your Results...</h3>
        <p className="text-slate-500 text-sm">Recording your drill session. Please wait.</p>
      </div>
    );
  }

  // Show result screen
  if (drillResult) {
    return (
      <ResultScreen
        result={drillResult}
        subjectName={currentSubject?.name}
        subjectCode={currentSubject?.code}
        onRetry={startSession}
        onHome={onComplete}
      />
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <BookOpen size={40} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">No Questions Available</h3>
          <p className="text-slate-500 mt-2 text-sm">{error || `There are currently no drill questions for ${currentSubject?.name ?? 'this subject'}.`}</p>
          {!error && (
            <p className="text-slate-400 mt-1 text-xs">Ask your faculty to upload questions for this subject.</p>
          )}
        </div>
        <button onClick={onComplete} className="w-full sm:w-auto px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg hover:bg-[#1e3a8a]/90 transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-2 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-[#1e3a8a] text-white px-2 md:px-3 py-1 rounded-lg font-black text-[10px] md:text-xs shrink-0">
            {currentSubject?.code ?? '—'}
          </div>
          <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight truncate">{currentSubject?.name ?? 'Drill'}</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs font-bold">
          <Clock size={14} />
          <span>Drill Progress</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
          <span>Item {currentIdx + 1} / {questions.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden border border-slate-100">
          <div className="h-full bg-[#facc15] transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Question header */}
        <div className="bg-[#1e3a8a] p-6 md:p-8 text-white relative">
          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-400/20 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10">
                {currentQuestion.topic}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 ${
                currentQuestion.difficulty === 'Easy'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : currentQuestion.difficulty === 'Average'
                  ? 'bg-yellow-500/20 text-yellow-200'
                  : 'bg-red-500/20 text-red-200'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base md:text-xl font-bold leading-relaxed flex-1">{currentQuestion.content}</h3>
              <button 
                onClick={speakQuestionAndOptions}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0"
                title={isSpeaking ? 'Stop Reading' : 'Read Question and Options'}
              >
                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 md:p-8 space-y-3 md:space-y-4">
          {(Object.keys(currentQuestion.options) as Array<'A' | 'B' | 'C' | 'D'>).map((key) => {
            const label = currentQuestion.options[key];
            const isSelected = selectedOption === key;
            const isCorrect = isAnswered && key === currentQuestion.correctAnswer;
            const isWrong = isAnswered && isSelected && key !== currentQuestion.correctAnswer;

            return (
              <button
                key={key}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(key)}
                className={`w-full p-3 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${isCorrect
                    ? 'border-emerald-500 bg-emerald-50'
                    : isWrong
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-[#1e3a8a] bg-blue-50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm ${
                    isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {key}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-700">{label}</span>
                </div>
                <div className="shrink-0">
                  {isCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                  {isWrong && <AlertCircle size={20} className="text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-8 pb-6 md:pb-8">
          {!isAnswered ? (
            <button
              disabled={!selectedOption}
              onClick={handleSubmit}
              className="w-full bg-[#065f46] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-emerald-800 transition-all shadow-xl disabled:opacity-30"
            >
              CONFIRM ANSWER
            </button>
          ) : (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Feedback box */}
              <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${
                selectedOption === currentQuestion.correctAnswer
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-red-50 border-red-100 text-red-800'
              }`}>
                <div className="flex items-center gap-2 md:gap-3 font-black mb-3 md:mb-4">
                  {selectedOption === currentQuestion.correctAnswer
                    ? <CheckCircle2 size={20} />
                    : <AlertCircle size={20} />}
                  <span className="uppercase tracking-tight text-sm md:text-base">
                    {selectedOption === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {currentQuestion.reference && (
                  <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={13} className="text-amber-500 shrink-0" />
                      <span className="text-[9px] font-black uppercase text-slate-500">Reference</span>
                    </div>
                    <p className="italic text-xs md:text-sm text-slate-600 leading-relaxed">"{currentQuestion.reference}"</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 hover:bg-[#1e3a8a]/90 transition-colors"
              >
                {currentIdx < questions.length - 1 ? 'NEXT ITEM' : 'FINISH DRILL'}{' '}
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillEngine;
