import React, { useState, useEffect } from 'react';
import { Sun, Moon, Copy, RotateCcw, History, Languages, ArrowRightLeft } from 'lucide-react';

interface Translation {
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [apiKey, setApiKey] = useState('AIzaSyDVYqPVUOz4LB_0oEV9g77aoDDcwEp854A');
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isFormal, setIsFormal] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_CHARS = 5000;

  const languages = [
    { code: 'auto', name: 'Detect Language' },
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Turkish' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setSourceText(text);
      setError(null);
    } else {
      setError(`Maksimum ${MAX_CHARS} karakter girebilirsiniz.`);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim() || !apiKey) return;
    
    setIsLoading(true);
    setTranslatedText('');
    setError(null);
    try {
      if (!apiKey.startsWith('AI') || apiKey.length < 30) {
        throw new Error('Geçersiz API anahtarı formatı');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional translator. Your task is to translate the following text from ${languages.find(l => l.code === sourceLang)?.name || 'auto-detected language'} to ${languages.find(l => l.code === targetLang)?.name}. 

Important rules:
1. Preserve the exact meaning and context of the original text
2. Maintain the tone and style of the original text
3. Keep any special terms, names, or technical words unchanged
4. Use ${isFormal ? 'formal' : 'informal'} language style
5. Only provide the direct translation, no explanations or additional text

Text to translate:
${sourceText}`
            }]
          }],
          generationConfig: {
            temperature: 0,
            topK: 1,
            topP: 1
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        if (data.error.status === 'INVALID_ARGUMENT') {
          throw new Error('API anahtarı geçersiz. Lütfen doğru bir Gemini API anahtarı girin.');
        } else if (data.error.status === 'PERMISSION_DENIED') {
          throw new Error('API anahtarı yetkisi reddedildi. Lütfen API anahtarınızın aktif olduğundan emin olun.');
        } else if (data.error.status === 'RESOURCE_EXHAUSTED') {
          throw new Error('API kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
        } else {
          throw new Error(data.error.message || 'Çeviri işlemi başarısız oldu.');
        }
      }
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('API beklenmeyen bir yanıt döndü. Lütfen tekrar deneyin.');
      }

      const translatedText = data.candidates[0].content.parts[0].text;
      setTranslatedText(translatedText);
      
      const newTranslation: Translation = {
        sourceText,
        targetText: translatedText,
        sourceLang,
        targetLang,
        timestamp: new Date(),
      };
      
      setHistory(prev => [newTranslation, ...prev]);
    } catch (error: any) {
      console.error('Çeviri hatası:', error);
      if (error.message.includes('API')) {
        setError(error.message);
      } else if (!navigator.onLine) {
        setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else {
        setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Languages className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Universal Translator</h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-yellow-400" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* API Key Input */}
        <div className="mb-6 relative">
          <input
            type="password"
            placeholder="Google Gemini API Anahtarınızı girin"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          {!apiKey && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              Çeviri yapabilmek için API anahtarı gereklidir
            </p>
          )}
        </div>

        {/* Main Translation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <span className={`text-sm ${sourceText.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {sourceText.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              value={sourceText}
              onChange={handleSourceTextChange}
              placeholder="Çevrilecek metni girin..."
              className="w-full h-64 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Target Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFormal(!isFormal)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    isFormal
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isFormal ? 'Resmi Dil' : 'Günlük Dil'}
                </button>
                <button
                  onClick={() => handleCopy(translatedText)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative"
                  disabled={!translatedText}
                >
                  {copySuccess ? (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                      Kopyalandı!
                    </div>
                  ) : null}
                  <Copy className={`w-5 h-5 ${translatedText ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
            <div className="relative h-64">
              <div className="w-full h-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : translatedText ? (
                  translatedText
                ) : (
                  "Çeviri burada görünecek..."
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Translation Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || !apiKey || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Çevriliyor...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                <span>Çevir</span>
              </>
            )}
          </button>
        </div>

        {/* History Toggle */}
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <History className="w-5 h-5" />
            <span>Translation History</span>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-4">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <span>{item.sourceLang} → {item.targetLang}</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{item.sourceText}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{item.targetText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;