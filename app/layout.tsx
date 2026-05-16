import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  verification: {
    google: '8rdv6-oBxoLXhDcxQa41xRmsPNIYtLRMosa_A3xjWdY',
  },
  title: 'EndlessTalk',
  description: '会話の沈黙を防ぐAIアシストアプリ。会話を自動で聞き取り、次に聞ける質問や広げられる話題をリアルタイムで提案します。デート・初対面・職場・飲み会の4つのシーンから選択し、その場面に合った最適なアシストを行います。',
  openGraph: {
    title: 'EndlessTalk｜沈黙をなくす会話アシストAI',
    description: '会話の沈黙を防ぐ会話アシストAI。会話を自動で聞き取り、次に聞くと効果的な質問や広げられる話題をAIがリアルタイムで提案してくれるアプリ。',
    url: 'https://www.endless-talk.com',
    siteName: 'EndlessTalk',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2913908713051662" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-gray-950">{children}</body>
    </html>
  )
}
