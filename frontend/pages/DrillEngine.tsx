
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SUBJECTS } from '../constants';
import { useAuth } from '../App';
import { drillApi } from '../services/api';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Info,
  Lightbulb,
  GraduationCap,
  Volume2,
  VolumeX
} from 'lucide-react';

const DrillEngine: React.FC<{ 
  subjectId: string; 
  difficultyTierId?: string;
  onComplete: () => void 
}> = ({ subjectId, difficultyTierId, onComplete }) => {
  const { token, difficultyTiers } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }>>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Array<{
    id: string;
    topic: string;
    difficulty: string;
    content: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    reference: string;
  }>>([]);
  
  const questions = useMemo(() => {
    return sessionQuestions;
  }, [sessionQuestions, difficultyTierId]);

  useEffect(() => {
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

    drillApi
      .createSession(
        token,
        subjectId,
        difficultyTiers.find((tier) => tier.id === difficultyTierId)?.name.match(/\((.*?)\)/)?.[1] as
          | 'Easy'
          | 'Average'
          | 'Difficult'
          | undefined,
      )
      .then((payload) => setSessionQuestions(payload.questions))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load drill questions.';
        setError(message);
        setSessionQuestions([]);
      })
      .finally(() => setIsLoading(false));
  }, [token, subjectId, difficultyTierId]);

  const currentSubject = MOCK_SUBJECTS.find(s => s.id === subjectId);
  
  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsAnswered(true);

    setAnswers((prev) => [
      ...prev.filter((answer) => answer.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, selectedAnswer: selectedOption },
    ]);

    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      if (!token) {
        onComplete();
        return;
      }

      drillApi
        .submit(token, { subjectId, answers })
        .then((result) => {
          window.alert(`Drill submitted. Score: ${result.score}/${result.totalQuestions} (${result.accuracyPercentage}%) - ${result.status}`);
        })
        .finally(() => onComplete());
    }
  };

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const speakQuestionAndOptions = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let fullText = currentQuestion.content + ". ";
    fullText += "Option A: " + currentQuestion.options.A + ". ";
    fullText += "Option B: " + currentQuestion.options.B + ". ";
    fullText += "Option C: " + currentQuestion.options.C + ". ";
    fullText += "Option D: " + currentQuestion.options.D + ". ";

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <h3 className="text-xl font-black text-slate-800">Preparing Drill Session...</h3>
        <p className="text-slate-500 mt-2 text-sm">Fetching adaptive questions from the server.</p>
      </div>
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
          <p className="text-slate-500 mt-2 text-sm">{error || `There are currently no drill questions for ${currentSubject?.name}.`}</p>
        </div>
        <button onClick={onComplete} className="w-full sm:w-auto px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg">Return to Dashboard</button>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-2 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-[#1e3a8a] text-white px-2 md:px-3 py-1 rounded-lg font-black text-[10px] md:text-xs shrink-0">
            {currentSubject?.code}
          </div>
          <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight truncate">{currentSubject?.name}</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs font-bold">
          <Clock size={14} />
          <span>Drill Progress</span>
        </div>
      </div>

      <div className="mb-6 md:mb-8">
        <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
          <span>Item {currentIdx + 1} / {questions.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden border border-slate-100">
          <div className="h-full bg-[#facc15] transition-all duration-700 ease-out" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="bg-[#1e3a8a] p-6 md:p-8 text-white relative">
          <div className="relative z-10 space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-400/20 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10">
                {currentQuestion.topic}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-200' : currentQuestion.difficulty === 'Average' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`}>
                {currentQuestion.difficulty}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base md:text-xl font-bold leading-relaxed flex-1">{currentQuestion.content}</h3>
              <button 
                onClick={speakQuestionAndOptions}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0"
                title={isSpeaking ? "Stop Reading" : "Read Question and Options"}
              >
                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-3 md:space-y-4">
          {(Object.keys(currentQuestion.options) as Array<'A'|'B'|'C'|'D'>).map((key) => {
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
                  ${isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-[#1e3a8a] bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {key}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-700">{label}</span>
                </div>
              </button>
            );
          })}
        </div>

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
              <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${selectedOption === currentQuestion.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between gap-2 md:gap-3 font-black mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    {selectedOption === currentQuestion.correctAnswer ? <CheckCircle2 size={20} md:size={24} /> : <AlertCircle size={20} md:size={24} />}
                    <span className="uppercase tracking-tight text-sm md:text-lg">{selectedOption === currentQuestion.correctAnswer ? 'Correct Execution' : 'Remedial Feedback'}</span>
                  </div>
                  <button 
                    onClick={() => toggleSpeech(currentQuestion.reference)}
                    className="p-2 bg-black/5 hover:bg-black/10 rounded-lg transition-all"
                    title="Read Feedback"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-slate-100 shadow-sm italic text-xs md:text-sm text-slate-600">
                   "{currentQuestion.reference}"
                </div>
              </div>
              <button onClick={handleNext} className="w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3">
                {currentIdx < questions.length - 1 ? 'NEXT ITEM' : 'FINISH DRILL'} <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillEngine;
