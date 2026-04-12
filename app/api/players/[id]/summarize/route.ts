import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const player = await prisma.player.findUnique({
    where: { id: Number(id) },
    include: {
      team: true,
      analyses: {
        include: { match: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!player) {
    return Response.json({ error: '選手が見つかりません' }, { status: 404 })
  }

  if (player.analyses.length === 0) {
    return Response.json({ error: '分析データがありません' }, { status: 400 })
  }

  const now = new Date()
  const academicYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const grade = academicYear - player.enrollmentYear + 1
  const gradeLabel = grade >= 1 && grade <= 4 ? `${grade}年生` : `${player.enrollmentYear}年入学`

  const analysisText = player.analyses
    .map((a, i) => {
      const date = a.matchDate
        ? new Date(a.matchDate).toLocaleDateString('ja-JP')
        : a.match?.date
          ? new Date(a.match.date).toLocaleDateString('ja-JP')
          : '日付不明'
      const matchLabel = a.matchName || (a.match ? `試合記録#${a.match.id}` : '不明')
      return `【分析${i + 1}】${date}・${matchLabel}\n${a.content}`
    })
    .join('\n\n')

  const prompt = `あなたは大学空手道部の試合分析の専門家です。
以下は、空手道の組手選手「${player.name}${player.nickname ? `（${player.nickname}）` : ''}」（${player.team.name}・${gradeLabel}）についての観察・分析記録です。
これらをもとに、この選手の組手スタイルのサマリを作成してください。

## 分析記録（新しい順）

${analysisText}

## サマリに含めてほしい内容

1. **基本的な組手スタイル・傾向**
2. **得意な技・戦法**
3. **苦手・弱点と思われる点**
4. **最近の傾向や変化**（複数記録がある場合）
5. **対戦時の注意点・アドバイス**

簡潔かつ実戦に役立つサマリをお願いします。`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = response.content[0].type === 'text' ? response.content[0].text : ''
    return Response.json({ summary })
  } catch (err) {
    console.error('Claude API error:', err)
    return Response.json({ error: 'AI分析の生成に失敗しました' }, { status: 500 })
  }
}
