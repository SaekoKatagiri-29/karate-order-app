import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { playerId, matchId, matchDate, matchName, content } = body

  if (!playerId || !content) {
    return Response.json({ error: '選手IDと分析内容は必須です' }, { status: 400 })
  }

  const analysis = await prisma.playerAnalysis.create({
    data: {
      playerId: Number(playerId),
      matchId: matchId ? Number(matchId) : null,
      matchDate: matchDate ? new Date(matchDate) : null,
      matchName: matchName || null,
      content,
    },
    include: { match: true },
  })
  return Response.json(analysis, { status: 201 })
}
