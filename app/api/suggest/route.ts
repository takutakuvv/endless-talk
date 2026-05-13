import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODE_PROMPTS: Record<string, string> = {
  date: `相手は好意を持っている異性です。ときめきや距離感を縮めることを意識した、自然で温かみのある質問を提案してください。相手が嬉しくなるような興味・共感が伝わるトーンで。`,
  firstMeet: `初対面の相手です。警戒されないよう、当たり障りなく自然に話が広がる質問を提案してください。共通点を探したり、相手の話を引き出すようなトーンで。`,
  work: `職場の同僚や取引先など仕事関係の相手です。適度にフォーマルでありながら、場が和む話題や相手の人柄を引き出せる質問を提案してください。ビジネスライクすぎず、人間味のあるトーンで。`,
  party: `飲み会や合コンなど複数人が集まる場です。場が盛り上がり、その場にいる全員が楽しめるような話題や質問を提案してください。明るく笑いが生まれやすいトーンで。`,
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'リクエストが多すぎます。1時間後にお試しください。' }, { status: 429 })
  }

  const { transcript, mode = 'date', profile } = await req.json()
  if (!transcript?.trim()) {
    return NextResponse.json({ error: '会話が取得できませんでした' }, { status: 400 })
  }

  const modePrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.date

  const profileLines = [
    profile?.name && `名前：${profile.name}`,
    profile?.hobbies && `趣味・好きなこと：${profile.hobbies}`,
    profile?.from && `出身・場所：${profile.from}`,
    profile?.memo && `その他：${profile.memo}`,
  ].filter(Boolean)
  const profileSection = profileLines.length > 0
    ? `\n【相手のプロフィール】\n${profileLines.join('\n')}\n`
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `あなたは会話アシストAIです。以下の会話の断片を読んで、「次に聞けること（質問）」を3つと「広げられる話題」を2つ提案してください。

【シーン】
${modePrompt}
${profileSection}
【共通ルール】
- 質問は短く自然な日本語（15文字以内が理想）
- プロフィール情報がある場合はそれを活かした具体的な質問を優先する
- 話題は一言で（例：「趣味の話」「子供の頃の話」）
- 必ず以下のJSON形式のみで出力（説明文不要）

{
  "questions": ["質問1", "質問2", "質問3"],
  "topics": ["話題1", "話題2"]
}

【会話】
${transcript.slice(-500)}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: '解析失敗' }, { status: 500 })

  try {
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ error: '解析失敗' }, { status: 500 })
  }
}
