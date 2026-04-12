import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const player = await prisma.osakaPlayer.findUnique({
    where: { id: Number(id) },
    include: {
      matchResults: {
        where: { osakaPlayerNotes: { not: null } },
        include: { match: { include: { team: true } } },
        orderBy: { match: { date: 'desc' } },
      },
    },
  })

  if (!player) return Response.json({ error: '選手が見つかりません' }, { status: 404 })

  const notes = player.matchResults.filter((r) => r.osakaPlayerNotes)
  if (notes.length === 0) return Response.json({ error: 'メモデータがありません' }, { status: 400 })

  const now = new Date()
  const academicYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const grade = academicYear - player.enrollmentYear + 1
  const gradeLabel = grade >= 1 && grade <= 4 ? `${grade}年生` : `${player.enrollmentYear}年入学`

  const notesText = notes.map((r, i) => {
    const date = new Date(r.match.date).toLocaleDateString('ja-JP')
    const matchLabel = `${r.match.team.name}戦（${r.match.matchType === 'OFFICIAL' ? '公式戦' : '練習試合'}）`
    return `【記録${i + 1}】${date}・${matchLabel}\n${r.osakaPlayerNotes}`
  }).join('\n\n')

  const prompt = `あなたは大学空手道部の試合分析の専門家です。
以下は、阪大空手道部の組手選手「${player.name}」（${gradeLabel}）についての試合メモ記録です。
これらをもとに、この選手の組手スタイルのサマリを作成してください。

## 試合メモ記録（新しい順）

${notesText}

## サマリに含めてほしい内容

1. **基本的な組手スタイル・傾向**
2. **得意な技・戦法**
3. **改善点・課題と思われる点**
4. **最近の傾向や成長**（複数記録がある場合）
5. **今後の試合に向けたアドバイス**

簡潔かつ実践的なサマリをお願いします。`

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
