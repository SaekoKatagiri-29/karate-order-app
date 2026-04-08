import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const body = await request.json()
  const { teamId, isTournamentFirst } = body

  if (!teamId) {
    return Response.json({ error: 'チームIDは必須です' }, { status: 400 })
  }

  // 対戦相手チームの情報を取得
  const team = await prisma.team.findUnique({
    where: { id: Number(teamId) },
    include: {
      coaches: { orderBy: { startYear: 'desc' } },
      players: { orderBy: [{ isRetired: 'asc' }, { enrollmentYear: 'desc' }] },
      matches: {
        where: { matchType: 'OFFICIAL' },
        orderBy: { date: 'desc' },
        include: {
          coach: true,
          orderEntries: { include: { player: true } },
          matchResults: { include: { osakaPlayer: true, opponentPlayer: true } },
        },
      },
    },
  })

  if (!team) {
    return Response.json({ error: 'チームが見つかりません' }, { status: 404 })
  }

  // 阪大選手（現役）を取得
  const osakaPlayers = await prisma.osakaPlayer.findMany({
    where: { isRetired: false },
    orderBy: { enrollmentYear: 'desc' },
  })

  // 練習試合の個人対決データも取得（相性分析用）
  const practiceResults = await prisma.matchResult.findMany({
    where: {
      position: null,
      match: { teamId: Number(teamId) },
    },
    include: { osakaPlayer: true, opponentPlayer: true, match: true },
    orderBy: { match: { date: 'desc' } },
  })

  // 現在の学年を計算
  const now = new Date()
  const academicYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const gradeOf = (enrollmentYear: number) => {
    const g = academicYear - enrollmentYear + 1
    return g >= 1 && g <= 4 ? `${g}年生` : `${enrollmentYear}年入学`
  }

  // --- プロンプト用データを構築 ---

  // 現役監督
  const currentCoach = team.coaches.find((c) => !c.endYear) ?? team.coaches[0]

  // 現役選手一覧
  const activePlayers = team.players.filter((p) => !p.isRetired)

  // 過去の公式戦オーダー履歴
  const officialMatchHistory = team.matches.map((m) => {
    const order = ['SENPO', 'CHUKEN', 'TAISHO'].map((pos) => {
      const entry = m.orderEntries.find((o) => o.position === pos)
      const result = m.matchResults.find((r) => r.position === pos)
      const playerName = entry?.player
        ? `${entry.player.name}${entry.player.nickname ? `(${entry.player.nickname})` : ''}[${gradeOf(entry.player.enrollmentYear)}]`
        : '不明'
      const resultStr = result?.result === 'WIN' ? '○' : result?.result === 'LOSS' ? '●' : result?.result === 'DRAW' ? '△' : '不明'
      return { pos: pos === 'SENPO' ? '先鋒' : pos === 'CHUKEN' ? '中堅' : '大将', player: playerName, result: resultStr }
    })
    return {
      date: m.date.toLocaleDateString('ja-JP'),
      coach: m.coach ? `${m.coach.name}${m.coach.nickname ? `(${m.coach.nickname})` : ''}` : '不明',
      isTournamentFirst: m.isTournamentFirst,
      teamResult: m.result === 'WIN' ? '勝' : m.result === 'LOSS' ? '負' : m.result === 'DRAW' ? '引分' : '不明',
      order,
    }
  })

  // 練習試合の個人相性データ
  const compatibilityData = practiceResults.map((r) => ({
    osakaPlayer: r.osakaPlayer ? `${r.osakaPlayer.name}[${gradeOf(r.osakaPlayer.enrollmentYear)}]` : '不明',
    opponentPlayer: r.opponentPlayer
      ? `${r.opponentPlayer.name}${r.opponentPlayer.nickname ? `(${r.opponentPlayer.nickname})` : ''}[${gradeOf(r.opponentPlayer.enrollmentYear)}]`
      : '不明',
    result: r.result === 'WIN' ? '阪大勝' : r.result === 'LOSS' ? '阪大負' : '引分',
    date: r.match.date.toLocaleDateString('ja-JP'),
  }))

  // プロンプト構築
  const prompt = `あなたは大学空手道部の試合分析の専門家です。
大阪大学空手道部女子組手の監督として、次の試合で相手チームがどのようなオーダー（先鋒・中堅・大将）を出してくるかを予測してください。

## 対戦相手チーム情報

**大学名：** ${team.name}（${team.type === 'NATIONAL' ? '国立' : '公立'}大学）
**現在の監督：** ${currentCoach ? `${currentCoach.name}${currentCoach.nickname ? `（${currentCoach.nickname}）` : ''}（${currentCoach.startYear}年〜）` : '不明'}
**今回の試合条件：** ${isTournamentFirst ? 'トーナメント初戦' : '通常試合（または初戦でない）'}

## 現役選手一覧

${activePlayers.length > 0
  ? activePlayers.map((p) => `- ${p.name}${p.nickname ? `（${p.nickname}）` : ''} / ${gradeOf(p.enrollmentYear)}`).join('\n')
  : '現役選手のデータなし'}

## 過去の公式戦オーダー履歴（新しい順）

${officialMatchHistory.length > 0
  ? officialMatchHistory.map((m, i) => `
### 第${i + 1}戦（${m.date}）
- 監督：${m.coach}
- 試合条件：${m.isTournamentFirst ? 'トーナメント初戦' : '通常試合'}
- チーム結果：${m.teamResult}
- オーダー：
  - 先鋒：${m.order[0].player}（${m.order[0].result}）
  - 中堅：${m.order[1].player}（${m.order[1].result}）
  - 大将：${m.order[2].player}（${m.order[2].result}）`).join('\n')
  : '公式戦の記録なし（データ不足）'}

## 練習試合での個人対決データ（相性）

${compatibilityData.length > 0
  ? compatibilityData.map((r) => `- ${r.osakaPlayer} vs ${r.opponentPlayer}：${r.result}（${r.date}）`).join('\n')
  : '練習試合の個人対決データなし'}

---

## 予測してほしいこと

上記データをもとに、以下の形式で回答してください。

1. **予測オーダー**（先鋒・中堅・大将の選手名を明記）
2. **予測の根拠**（監督の傾向、選手の出場パターン、初戦かどうかの影響など）
3. **注意点・不確実性**（データが少ない場合や、複数のパターンが考えられる場合の説明）
4. **阪大側への戦略アドバイス**（相性データや相手オーダーの傾向をふまえた提言）

データが少ない場合でも、あるデータから読み取れる傾向を最大限に活用して予測してください。`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return Response.json({
      prediction: text,
      dataUsed: {
        officialMatchCount: officialMatchHistory.length,
        practiceResultCount: compatibilityData.length,
        activePlayerCount: activePlayers.length,
      },
    })
  } catch (err) {
    console.error('Claude API error:', err)
    return Response.json({ error: 'AI予測の取得に失敗しました' }, { status: 500 })
  }
}
