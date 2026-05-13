'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Suggestions {
  questions: string[]
  topics: string[]
}

interface Profile {
  name: string
  hobbies: string
  from: string
  memo: string
}

type Mode = 'date' | 'firstMeet' | 'work' | 'party'
type Lang = 'ja' | 'en'

const MODES: Record<Lang, { id: Mode; label: string; emoji: string; desc: string }[]> = {
  ja: [
    { id: 'date', label: '気になる人', emoji: '🍀', desc: '片思い〜交際中' },
    { id: 'firstMeet', label: '初対面', emoji: '🤝', desc: '初めて会う相手' },
    { id: 'work', label: '仕事・職場', emoji: '💼', desc: '同僚・上司' },
    { id: 'party', label: '飲み会・複数人', emoji: '🍻', desc: 'グループでの会話' },
  ],
  en: [
    { id: 'date', label: 'Crush / Partner', emoji: '🍀', desc: 'Romantic interest' },
    { id: 'firstMeet', label: 'First Meeting', emoji: '🤝', desc: 'Someone new' },
    { id: 'work', label: 'Work / Office', emoji: '💼', desc: 'Colleagues / Boss' },
    { id: 'party', label: 'Party / Group', emoji: '🍻', desc: 'Group conversation' },
  ],
}

const T = {
  ja: {
    subtitle: '沈黙をなくす会話アシストAI',
    sceneLabel: '会話のシーンを選ぶ',
    listening: '● 聞き取り中 — 会話が止まると自動で提案します',
    transcriptLabel: '🎤 聞き取り中の会話',
    questionsLabel: '💬 次に聞けること',
    topicsLabel: '🔗 広げられる話題',
    refreshBtn: '🔄 今すぐ更新',
    loadingText: 'AIが考えています...',
    resetBtn: 'リセット',
    helpBtn: '使い方',
    errorComm: '通信エラーが発生しました',
    errorDefault: 'エラーが発生しました',
    profileTitle: '相手のプロフィールメモ',
    profileDesc: '入力した情報をもとに、より自然な質問を提案します（任意）',
    profileFields: [
      { key: 'name', label: 'ニックネーム', placeholder: '例：田中さん' },
      { key: 'hobbies', label: '趣味・好きなこと', placeholder: '例：映画鑑賞、カフェ巡り' },
      { key: 'from', label: '出身・住んでいる場所', placeholder: '例：大阪出身、今は東京' },
      { key: 'memo', label: 'その他メモ', placeholder: '例：犬を飼っている、料理が得意' },
    ],
    clearBtn: 'クリア',
    saveBtn: '保存',
    closeBtn: '閉じる',
    helpTitle: '使い方',
    helpSteps: [
      { step: '①', title: 'シーンを選ぶ', desc: 'デート・初対面・仕事・飲み会など、会話の状況に合ったシーンを選んでください。' },
      { step: '②', title: 'マイクをタップして会話を始める', desc: '会話を認識すると、3秒の沈黙後に自動で提案が表示されます。' },
      { step: '③', title: '提案をチラ見する', desc: '次に聞けること・広げられる話題をさりげなく参考にしてください。' },
    ],
    helpTip: '💡 👤 ボタンで相手のプロフィールを入力すると、より具体的な提案が届きます。',
    unsupportedTitle: 'お使いのブラウザは非対応です',
    unsupportedDesc: 'Chrome または Edge をお使いください',
  },
  en: {
    subtitle: 'AI Conversation Assistant',
    sceneLabel: 'Choose your scene',
    listening: '● Listening — suggestions appear after silence',
    transcriptLabel: '🎤 Conversation',
    questionsLabel: '💬 Questions to ask',
    topicsLabel: '🔗 Topics to explore',
    refreshBtn: '🔄 Refresh now',
    loadingText: 'AI is thinking...',
    resetBtn: 'Reset',
    helpBtn: 'How to use',
    errorComm: 'Connection error',
    errorDefault: 'An error occurred',
    profileTitle: 'Profile Memo',
    profileDesc: 'Add info to get more personalized suggestions (optional)',
    profileFields: [
      { key: 'name', label: 'Nickname', placeholder: 'e.g. Alex' },
      { key: 'hobbies', label: 'Hobbies / Interests', placeholder: 'e.g. movies, hiking' },
      { key: 'from', label: 'Hometown / Location', placeholder: 'e.g. from LA, living in NYC' },
      { key: 'memo', label: 'Other notes', placeholder: 'e.g. has a dog, loves cooking' },
    ],
    clearBtn: 'Clear',
    saveBtn: 'Save',
    closeBtn: 'Close',
    helpTitle: 'How to use',
    helpSteps: [
      { step: '①', title: 'Choose a scene', desc: 'Select the situation that matches your conversation.' },
      { step: '②', title: 'Tap the mic and start talking', desc: 'After 3 seconds of silence, suggestions appear automatically.' },
      { step: '③', title: 'Glance at suggestions', desc: 'Use the questions and topics as subtle conversation starters.' },
    ],
    helpTip: '💡 Tap 👤 to add a profile for more personalized suggestions.',
    unsupportedTitle: 'Browser not supported',
    unsupportedDesc: 'Please use Chrome or Edge',
  },
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('ja')
  const [mode, setMode] = useState<Mode>('date')
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [supported, setSupported] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [profile, setProfile] = useState<Profile>({ name: '', hobbies: '', from: '', memo: '' })
  const [profileDraft, setProfileDraft] = useState<Profile>({ name: '', hobbies: '', from: '', memo: '' })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptRef = useRef('')
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const t = T[lang]
  const modes = MODES[lang]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      if (!SR) setSupported(false)
    }
  }, [])

  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 10) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, mode, profile, lang }),
      })
      const data = await res.json()
      if (data.questions) setSuggestions(data)
      else setError(data.error ?? t.errorDefault)
    } catch {
      setError(t.errorComm)
    } finally {
      setLoading(false)
    }
  }, [mode, profile, lang, t.errorDefault, t.errorComm])

  const startListening = useCallback(async () => {
    const SR = window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    try {
      wakeLockRef.current = await navigator.wakeLock?.request('screen')
    } catch { /* 非対応端末は無視 */ }

    const recognition = new SR()
    recognition.lang = lang === 'ja' ? 'ja-JP' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        if (e.results[i].isFinal) final += txt
      }
      if (final) {
        transcriptRef.current += final + (lang === 'ja' ? '。' : '. ')
        setTranscript(transcriptRef.current)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => fetchSuggestions(transcriptRef.current), 3000)
      }
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start() } catch { /* 無視 */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [fetchSuggestions, lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    wakeLockRef.current?.release()
    wakeLockRef.current = null
    setListening(false)
  }, [])

  const handleReset = () => {
    stopListening()
    setTranscript('')
    transcriptRef.current = ''
    setSuggestions(null)
    setError('')
  }

  if (!supported) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl mb-4">😢</p>
          <p className="text-white text-lg font-bold mb-2">{t.unsupportedTitle}</p>
          <p className="text-gray-400 text-sm">{t.unsupportedDesc}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white sm:items-center sm:justify-center">
    <div className="w-full h-full flex flex-col sm:max-w-sm sm:h-[85vh] sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl sm:border sm:border-gray-800">
      {/* ヘッダー */}
      <header className="flex-shrink-0 px-5 pt-5 pb-3 space-y-2">
        {/* 1行目: タイトル + ボタン群 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-400 tracking-tight">EndlessTalk</h1>
          <div className="flex items-center gap-2">
            {/* 言語切替 */}
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
              {(['ja', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                    lang === l ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {l === 'ja' ? 'JP' : 'EN'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
            >
              {t.helpBtn}
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
            >
              {t.resetBtn}
            </button>
          </div>
        </div>
        {/* 2行目: モードバッジ + 👤 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {transcript
              ? <span className="bg-indigo-900 text-indigo-300 px-2.5 py-1 rounded-full">{modes.find(m => m.id === mode)?.emoji} {modes.find(m => m.id === mode)?.label}</span>
              : t.subtitle
            }
          </span>
          <button
            onClick={() => { setProfileDraft(profile); setShowProfile(true) }}
            className={`relative w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors ${
              Object.values(profile).some(v => v)
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            👤
            {Object.values(profile).some(v => v) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">

        {/* 認識テキスト */}
        {transcript && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-2">{t.transcriptLabel}</p>
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{transcript}</p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-gray-400 text-sm">{t.loadingText}</p>
          </div>
        )}

        {/* エラー */}
        {error && <p className="text-red-400 text-sm px-2">{error}</p>}

        {/* 提案 */}
        {suggestions && !loading && (
          <>
            <div>
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-xs text-gray-500">{t.questionsLabel}</p>
                <button
                  onClick={() => fetchSuggestions(transcriptRef.current)}
                  disabled={!transcript}
                  className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950 hover:bg-indigo-900 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
                >
                  {t.refreshBtn}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.questions.map((q, i) => (
                  <div key={i} className="bg-indigo-950 border border-indigo-800 rounded-2xl px-4 py-4">
                    <p className="text-indigo-100 font-medium leading-snug text-lg">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-3 px-1">{t.topicsLabel}</p>
              <div className="flex gap-2 flex-wrap">
                {suggestions.topics.map((topic, i) => (
                  <span key={i} className="bg-gray-800 text-gray-200 font-medium px-4 py-2 rounded-full text-base">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 初期状態 */}
        {!suggestions && !loading && !transcript && (
          <div className="flex-1 flex flex-col gap-5 py-4">
            <div>
              <p className="text-sm text-gray-300 font-medium mb-3 px-1">{t.sceneLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {modes.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border-2 transition-all ${
                      mode === m.id
                        ? 'border-indigo-500 bg-indigo-950 text-white'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-3xl mb-1">{m.emoji}</span>
                    <span className="font-bold text-sm">{m.label}</span>
                    <span className="text-xs mt-0.5 opacity-60">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* マイクボタン */}
      <div className="flex-shrink-0 px-5 pb-8 pt-3 flex flex-col items-center gap-2">
        {listening && (
          <p className="text-xs text-indigo-400 animate-pulse">{t.listening}</p>
        )}
        <button
          onClick={listening ? stopListening : startListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            listening
              ? 'bg-red-500 hover:bg-red-600 shadow-red-900'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900'
          }`}
        >
          {listening ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
            </svg>
          )}
        </button>
      </div>

      {/* 使い方モーダル */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">{t.helpTitle}</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <ol className="space-y-4">
              {t.helpSteps.map(({ step, title, desc }) => (
                <li key={step} className="flex gap-3">
                  <span className="text-indigo-400 font-bold text-sm w-5 shrink-0">{step}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="bg-gray-800 rounded-2xl p-3">
              <p className="text-xs text-gray-400 leading-relaxed">{t.helpTip}</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* プロフィールメモモーダル */}
      {showProfile && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">{t.profileTitle}</h2>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <p className="text-xs text-gray-500">{t.profileDesc}</p>
            <div className="space-y-3">
              {t.profileFields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    type="text"
                    value={profileDraft[key as keyof Profile]}
                    onChange={e => setProfileDraft(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-gray-800 text-white placeholder-gray-600 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setProfile({ name: '', hobbies: '', from: '', memo: '' }); setShowProfile(false) }}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm font-medium"
              >
                {t.clearBtn}
              </button>
              <button
                onClick={() => { setProfile(profileDraft); setShowProfile(false) }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
