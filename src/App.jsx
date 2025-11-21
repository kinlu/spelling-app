import React, { useEffect, useState } from 'react';
import {
  Volume2,
  RotateCw,
  Plus,
  Trash2,
  Check,
  BookOpen,
  Edit3,
  Headphones,
  Brain,
  Settings,
  AlertCircle,
  Sparkles,
  ScrollText,
  Loader2,
  Lightbulb,
  Info,
  Save,
} from 'lucide-react';

// --- OpenRouter Setup ---
const OPENROUTER_URL = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'gpt-4o-mini';
const STORAGE_KEY = 'spellmaster_db_v1';

const callOpenRouter = async (prompt, { jsonMode = false } = {}) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY in your env file.');
  }

  const body = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a concise English vocabulary tutor for kids practicing spelling and meaning.',
      },
      { role: 'user', content: prompt },
    ],
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SpellMaster AI',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content;
  const content = Array.isArray(message)
    ? message.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('')
    : message;

  if (!content) {
    throw new Error('OpenRouter returned no content');
  }

  return jsonMode ? JSON.parse(content) : content.trim();
};

// --- Speech Synthesis (Aussie Accent) ---
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const targetVoice =
    voices.find((v) => v.lang === 'en-AU' && (v.name.includes('Female') || v.name.includes('Karen') || v.name.includes('Catherine'))) ||
    voices.find((v) => v.lang === 'en-AU') ||
    voices.find((v) => v.lang === 'en-GB');

  if (targetVoice) utterance.voice = targetVoice;
  else utterance.lang = 'en-AU';

  window.speechSynthesis.speak(utterance);
};

// --- Initial Data ---
const initialWords = [
  {
    id: 1,
    word: 'Ambition',
    definition: 'A strong desire to do or to achieve something.',
    sentence: 'Her ambition is to become a pilot.',
  },
  {
    id: 2,
    word: 'Resilient',
    definition: 'Able to withstand or recover quickly from difficult conditions.',
    sentence: 'Plants are often resilient to changes in weather.',
  },
  {
    id: 3,
    word: 'Ephemeral',
    definition: 'Lasting for a very short time.',
    sentence: 'Fashions are ephemeral, changing with every season.',
  },
];

export default function App() {
  const [words, setWords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load words from storage:', error);
    }
    return initialWords;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    try {
      if (words && Array.isArray(words)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
      }
    } catch (error) {
      console.error('Failed to save words to storage:', error);
    }
  }, [words]);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'manage':
        return <ManageWords words={words} setWords={setWords} />;
      case 'flashcards':
        return <Flashcards words={words} />;
      case 'spelling':
        return <SpellingQuiz words={words} />;
      case 'meaning':
        return <MeaningQuiz words={words} />;
      case 'story':
        return <StoryMode words={words} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} wordCount={words.length} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
              SpellMaster <span className="text-blue-600 font-extrabold italic">AI</span>
            </h1>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight sm:hidden">SpellMaster</h1>
          </div>

          <nav className="hidden md:flex gap-1">
            <NavBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Edit3 size={16} />} label="Manage" />
            <NavBtn active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<RotateCw size={16} />} label="Cards" />
            <NavBtn active={activeTab === 'spelling'} onClick={() => setActiveTab('spelling')} icon={<Headphones size={16} />} label="Spelling" />
            <NavBtn active={activeTab === 'meaning'} onClick={() => setActiveTab('meaning')} icon={<Brain size={16} />} label="Meaning" />
            <NavBtn
              active={activeTab === 'story'}
              onClick={() => setActiveTab('story')}
              icon={<Sparkles size={16} className="text-purple-500" />}
              label="AI Story"
            />
          </nav>
        </div>
      </header>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <MobileNavBtn active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} icon={<Edit3 size={20} />} />
        <MobileNavBtn active={activeTab === 'spelling'} onClick={() => setActiveTab('spelling')} icon={<Headphones size={20} />} />
        <MobileNavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BookOpen size={20} />} highlight />
        <MobileNavBtn active={activeTab === 'meaning'} onClick={() => setActiveTab('meaning')} icon={<Brain size={20} />} />
        <MobileNavBtn
          active={activeTab === 'story'}
          onClick={() => setActiveTab('story')}
          icon={<Sparkles size={20} className="text-purple-500" />}
        />
      </div>

      <main className="max-w-3xl mx-auto p-4 pb-24 md:pb-10">{renderContent()}</main>
    </div>
  );
}

// --- Components ---

const Dashboard = ({ setActiveTab, wordCount }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center py-8">
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back!</h2>
      <p className="text-slate-500">
        You have <span className="font-bold text-blue-600">{wordCount}</span> words in your collection.
      </p>
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 inline-flex px-3 py-1 rounded-full">
        <Save size={12} /> Auto-save enabled
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MenuCard
        title="Smart Flashcards"
        desc="Tap to listen, flip for AI-generated meaning & examples."
        icon={<RotateCw className="text-white" size={24} />}
        color="bg-indigo-500"
        onClick={() => setActiveTab('flashcards')}
      />
      <MenuCard
        title="Spelling Bee"
        desc="Listen to Australian pronunciation and spell the words."
        icon={<Headphones className="text-white" size={24} />}
        color="bg-emerald-500"
        onClick={() => setActiveTab('spelling')}
      />
      <MenuCard
        title="Meaning Quiz AI"
        desc="Write definitions and get intelligent AI feedback."
        icon={<Brain className="text-white" size={24} />}
        color="bg-amber-500"
        onClick={() => setActiveTab('meaning')}
      />
      <MenuCard
        title="Add Words"
        desc="Just type a word, AI does the rest automatically."
        icon={<Plus className="text-white" size={24} />}
        color="bg-slate-500"
        onClick={() => setActiveTab('manage')}
      />
    </div>
  </div>
);

const ManageWords = ({ words, setWords }) => {
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSmart = async (e) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    setLoading(true);
    const prompt = `For the English word "${inputWord}", provide a concise dictionary definition and one simple example sentence. Return JSON format: {"definition": "...", "sentence": "..."}.`;

    try {
      const result = await callOpenRouter(prompt, { jsonMode: true });
      if (result?.definition && result?.sentence) {
        const newItem = {
          id: Date.now(),
          word: inputWord.trim(),
          definition: result.definition,
          sentence: result.sentence,
        };
        setWords([...words, newItem]);
        setInputWord('');
      } else {
        alert('AI could not process this word. Please try again.');
      }
    } catch (error) {
      console.error('AI request failed', error);
      alert('AI request failed. Ensure VITE_OPENROUTER_API_KEY is set and try again.');
    }
    setLoading(false);
  };

  const handleDelete = (id) => {
    setWords(words.filter((w) => w.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Reset to default words? This clears your custom list from local storage.')) {
      setWords(initialWords);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="text-blue-600" /> Smart Add
        </h2>
        <p className="text-sm text-slate-500 mb-4">Enter a word and we will generate the definition and sentence for you.</p>
        <form onSubmit={handleAddSmart} className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Type a word (e.g., Serendipity)"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputWord}
            className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-semibold text-slate-800">Your Collection ({words.length})</h3>
          <button
            onClick={handleReset}
            className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            title="Reset to default words"
          >
            <Trash2 size={14} /> Reset Storage
          </button>
        </div>

        {words.length === 0 && <p className="text-slate-400 text-center py-8">No words added yet.</p>}
        {words.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex-1 min-w-0 mr-4">
              <div className="font-bold text-lg text-slate-800">{item.word}</div>
              <div className="text-slate-500 text-sm truncate">{item.definition}</div>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
              title="Remove word"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Flashcards = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (words.length === 0) return <EmptyState msg="Add words to start Flashcards." />;

  const currentWord = words[currentIndex];

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 300);
  };

  const prevCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 300);
  };

  const containerStyle = { perspective: '1000px' };
  const cardStyle = {
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };
  const faceStyle = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };
  const backFaceStyle = { ...faceStyle, transform: 'rotateY(180deg)' };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md h-96 cursor-pointer group" style={containerStyle} onClick={() => setFlipped(!flipped)}>
        <div className="relative w-full h-full" style={cardStyle}>
          <div
            className="bg-white border-2 border-blue-100 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 hover:border-blue-300 transition-colors"
            style={faceStyle}
          >
            <div className="absolute top-4 right-4 text-blue-200">
              <RotateCw size={24} />
            </div>
            <span className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6">Word</span>

            <h2 className="text-5xl font-extrabold text-slate-800 mb-8 text-center break-words w-full">{currentWord.word}</h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(currentWord.word);
              }}
              className="p-5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 hover:scale-110 transition-all shadow-sm"
              title="Listen (AU Accent)"
            >
              <Volume2 size={32} />
            </button>

            <p className="text-slate-400 text-sm mt-auto flex items-center gap-2">Tap to flip for meaning & sentence</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8" style={backFaceStyle}>
            <div className="w-full flex-1 flex flex-col justify-center text-center">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Definition</span>
              <p className="text-xl font-medium leading-relaxed mb-6">{currentWord.definition}</p>

              <div className="w-full h-px bg-white/20 mb-6" />

              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Example</span>
              <p className="text-lg italic text-blue-50 font-light leading-relaxed">"{currentWord.sentence}"</p>
            </div>
            <p className="text-blue-200 text-xs mt-4">Tap to flip back</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 mt-8 w-full max-w-md justify-between px-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevCard();
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white shadow-sm hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium transition-colors"
        >
          Prev
        </button>
        <span className="font-mono text-slate-400 font-bold">
          {currentIndex + 1} / {words.length}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextCard();
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white shadow-sm hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const SpellingQuiz = ({ words }) => {
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [hint, setHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);

  const validWords = words.filter((w) => w.sentence && w.sentence.length > 5);

  if (validWords.length === 0) return <EmptyState msg="Add words to use Spelling Bee." />;
  if (!started)
    return (
      <div className="text-center py-20 animate-in fade-in">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Headphones className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Spelling Bee</h2>
        <p className="text-slate-500 mb-8">Listen to the Australian pronunciation and spell the word.</p>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95"
        >
          Start Quiz
        </button>
      </div>
    );

  const currentWord = validWords[currentIdx];
  const displaySentence = currentWord.sentence.replace(new RegExp(currentWord.word, 'gi'), '______');

  const playAudio = () => speak(currentWord.sentence);

  const getAIHint = async () => {
    setLoadingHint(true);
    const prompt = `The user is trying to spell the word "${currentWord.word}". Provide a helpful hint (mnemonic or clue). Do NOT reveal the word. Max 15 words.`;
    try {
      const result = await callOpenRouter(prompt, { jsonMode: false });
      setHint(result || 'Listen carefully to the syllables.');
    } catch (error) {
      console.error('Failed to fetch hint', error);
      setHint('AI hint unavailable. Listen carefully to the syllables.');
    }
    setLoadingHint(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === 'correct' || status === 'failed') return nextWord();

    if (input.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setStatus('correct');
      setFeedback(getPraise());
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      if (newAttempts > 0) {
        setStatus('wrong');
        setFeedback(`Incorrect. ${newAttempts} attempt(s) left.`);
      } else {
        setStatus('failed');
        setFeedback(`The answer was: ${currentWord.word}`);
      }
    }
  };

  const nextWord = () => {
    setInput('');
    setAttempts(3);
    setStatus('idle');
    setFeedback('');
    setHint('');
    setCurrentIdx((prev) => (prev + 1) % validWords.length);
  };

  const getPraise = () => {
    const phrases = ['Excellent!', 'Great Job!', 'Fantastic!', 'Spot on!', 'Perfect!'];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="h-2 bg-slate-100 w-full">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentIdx + 1) / validWords.length) * 100}%` }} />
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Word {currentIdx + 1} of {validWords.length}
          </span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < attempts ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={playAudio}
            className="mb-6 w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto hover:bg-emerald-100 transition-colors shadow-sm ring-4 ring-emerald-50/50"
          >
            <Volume2 size={32} />
          </button>
          <p className="text-xl text-slate-700 font-medium leading-relaxed">"{displaySentence}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === 'correct' || status === 'failed'}
            placeholder="Type the missing word..."
            className={`w-full text-center text-2xl font-bold p-4 rounded-xl border-2 focus:outline-none transition-colors
              ${status === 'idle' ? 'border-slate-200 focus:border-emerald-500' : ''}
              ${status === 'wrong' ? 'border-red-300 bg-red-50 text-red-600' : ''}
              ${status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : ''}
              ${status === 'failed' ? 'border-slate-300 bg-slate-100 text-slate-500' : ''}
            `}
          />

          <div className="min-h-[3.5rem] flex flex-col items-center justify-center gap-2">
            {feedback && (
              <p className={`font-bold text-lg ${status === 'correct' ? 'text-emerald-600' : 'text-red-500'}`}>
                {status === 'correct' && <Check className="inline mr-1" size={20} />}
                {status === 'wrong' && <AlertCircle className="inline mr-1" size={20} />}
                {feedback}
              </p>
            )}

            {status === 'wrong' && attempts > 0 && !hint && (
              <button
                type="button"
                onClick={getAIHint}
                disabled={loadingHint}
                className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-100 transition-colors"
              >
                {loadingHint ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                Ask AI for a Hint
              </button>
            )}
            {hint && (
              <div className="bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg text-sm text-purple-700 max-w-xs animate-in fade-in slide-in-from-top-2 text-center">
                <Lightbulb size={14} className="inline mr-1 mb-0.5 text-purple-500" /> {hint}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-md
              ${status === 'correct' || status === 'failed' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-emerald-600 hover:bg-emerald-700'}
            `}
          >
            {status === 'correct' || status === 'failed' ? 'Next Word' : 'Check Spelling'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MeaningQuiz = ({ words }) => {
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [aiResult, setAiResult] = useState(null); // { isCorrect, feedback }
  const [loading, setLoading] = useState(false);

  if (words.length === 0) return <EmptyState msg="Add words to start Meaning Quiz." />;

  const currentWord = words[currentIdx];

  const checkAnswer = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    const prompt = `User input meaning for "${currentWord.word}": "${input}".
    Actual meaning: "${currentWord.definition}".
    Evaluate if the user understands the word.
    Return JSON: {"isCorrect": boolean, "feedback": "string"}.
    Feedback should be encouraging. If wrong, explain why briefly. If right, suggest a small improvement or synonym.`;

    try {
      const result = await callOpenRouter(prompt, { jsonMode: true });
      setAiResult(result);
    } catch (err) {
      console.error('AI check failed', err);
      setAiResult({ isCorrect: false, feedback: 'AI service unavailable.' });
    }
    setLoading(false);
  };

  const next = () => {
    setInput('');
    setAiResult(null);
    setCurrentIdx((prev) => (prev + 1) % words.length);
  };

  if (!started)
    return (
      <div className="text-center py-20 animate-in fade-in">
        <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="text-amber-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">AI Definition Mastery</h2>
        <p className="text-slate-500 mb-8">Explain the word in your own words. AI will evaluate your understanding.</p>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 bg-amber-500 text-white rounded-full font-bold shadow-lg hover:bg-amber-600 transition-transform active:scale-95"
        >
          Start Quiz
        </button>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <div className="text-center mb-8">
        <span className="text-xs font-bold text-slate-400 uppercase">Define this word</span>
        <h2 className="text-4xl font-extrabold text-slate-800 mt-2 mb-6">{currentWord.word}</h2>
        <button onClick={() => speak(currentWord.word)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors">
          <Volume2 size={24} />
        </button>
      </div>

      {!aiResult ? (
        <form onSubmit={checkAnswer} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type what this word means in your own words..."
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none min-h-[100px] resize-none"
          />
          <button
            type="submit"
            disabled={loading || !input}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
            Check with AI
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className={`p-6 rounded-xl border-2 ${aiResult.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              {aiResult.isCorrect ? (
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Check className="text-emerald-600" size={20} />
                </div>
              ) : (
                <div className="bg-orange-100 p-2 rounded-full">
                  <Info className="text-orange-600" size={20} />
                </div>
              )}
              <h3 className={`font-bold text-lg ${aiResult.isCorrect ? 'text-emerald-800' : 'text-orange-800'}`}>
                {aiResult.isCorrect ? 'Great Understanding!' : 'Needs Improvement'}
              </h3>
            </div>

            <div className="text-slate-700 leading-relaxed mb-4">
              <span className="font-bold text-xs uppercase text-slate-400 block mb-1">AI Feedback</span>
              {aiResult.feedback}
            </div>

            {!aiResult.isCorrect && (
              <div className="bg-white/50 p-3 rounded-lg text-sm text-slate-600 border border-slate-200">
                <p className="font-bold text-xs uppercase text-slate-400 mb-1">Official Definition:</p>
                {currentWord.definition}
              </div>
            )}
          </div>
          <button onClick={next} className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl">
            Next Word
          </button>
        </div>
      )}
    </div>
  );
};

const StoryMode = ({ words }) => {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (words.length < 3) return;
    setLoading(true);
    setStory('');
    const wordList = words.map((w) => w.word).join(', ');
    const prompt = `Write a short, fun, and creative story (approx 100 words) using ALL of these words: ${wordList}. Highlight the words in the story by wrapping them in asterisks like *Word*. Keep the English simple.`;

    try {
      const result = await callOpenRouter(prompt, { jsonMode: false });
      setStory(result);
    } catch (error) {
      console.error('Story generation failed', error);
      setStory('AI service unavailable. Please try again later.');
    }
    setLoading(false);
  };

  if (words.length < 3) return <EmptyState msg="Add at least 3 words to generate a story." />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 text-center">
        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-purple-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Story Generator</h2>
        <p className="text-slate-500 mb-6">OpenRouter will weave your vocabulary list ({words.length} words) into a unique story.</p>

        {!story && !loading && (
          <button
            onClick={generateStory}
            className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold shadow-lg hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Sparkles size={18} /> Generate Story
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-purple-600">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">Writing your story...</p>
          </div>
        )}

        {story && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left mt-6">
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 prose prose-slate max-w-none shadow-sm">
              <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                <ScrollText size={20} /> Your Story
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {story.split('*').map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className="font-bold text-purple-700 bg-purple-200 px-1 rounded">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => speak(story.replace(/\*/g, ''))}
                className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Listen to Story"
              >
                <Volume2 size={20} />
              </button>
              <button
                onClick={generateStory}
                className="px-6 py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-full hover:bg-purple-50 transition-colors"
              >
                Generate New Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- UI Helpers ---

const NavBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
      ${active ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
    `}
  >
    {icon}
    {label}
  </button>
);

const MobileNavBtn = ({ active, onClick, icon, highlight }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl transition-colors flex flex-col items-center justify-center
      ${active ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}
      ${highlight && !active ? 'bg-blue-600 text-white shadow-md -mt-6 border-4 border-white' : ''}
    `}
  >
    {icon}
  </button>
);

const MenuCard = ({ title, desc, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
  >
    <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
    <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const EmptyState = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
    <div className="bg-slate-100 p-4 rounded-full mb-4">
      <Settings className="text-slate-400" size={32} />
    </div>
    <p className="text-slate-500 font-medium">{msg}</p>
    <p className="text-sm text-slate-400 mt-1">Go to the "Manage" tab to add content.</p>
  </div>
);
