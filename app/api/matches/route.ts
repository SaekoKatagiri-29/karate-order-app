import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  const matches = await prisma.match.findMany({
    where: teamId ? { teamId: Number(teamId) } : undefined,
    include: {
      team: true,
      coach: true,
      orderEntries: { include: { player: true } },
      matchResults: { include: { osakaPlayer: true, opponentPlayer: true } },
    },
    orderBy: { date: 'desc' },
  })
  return Response.json(matches)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { date, teamId, coachId, matchType, isTournamentFirst, result, notes, orders, matchResults } = body

  if (!date || !teamId || !matchType) {
    return Response.json({ error: '試合日・対戦相手・試合種別は必須です' }, { status: 400 })
  }

  const match = await prisma.$transaction(async (tx) => {
    const created = await tx.match.create({
      data: {
        date: new Date(date),
        teamId: Number(teamId),
        coachId: coachId ? Number(coachId) : null,
        matchType,
        isTournamentFirst: Boolean(isTournamentFirst),
        result: result || null,
        notes: notes || null,
      },
    })

    // オーダー登録（先鋒・中堅・大将）
    if (orders && orders.length > 0) {
      await tx.orderEntry.createMany({
        data: orders
          .filter((o: { position: string; playerId: string | number }) => o.playerId)
          .map((o: { position: string; playerId: string | number }) => ({
            matchId: created.id,
            position: o.position,
            playerId: Number(o.playerId),
          })),
      })
    }

    // 個人戦結果登録
    if (matchResults && matchResults.length > 0) {
      await tx.matchResult.createMany({
        data: matchResults
          .filter((r: { position: string; result: string }) => r.result)
          .map((r: { position: string; osakPlayerId?: string | number; opponentPlayerId?: string | number; result: string; score?: string; notes?: string; osakaPlayerNotes?: string; opponentPlayerNotes?: string }) => ({
            matchId: created.id,
            position: r.position,
            osakPlayerId: r.osakPlayerId ? Number(r.osakPlayerId) : null,
            opponentPlayerId: r.opponentPlayerId ? Number(r.opponentPlayerId) : null,
            result: r.result,
            score: r.score || null,
            notes: r.notes || null,
            osakaPlayerNotes: r.osakaPlayerNotes || null,
            opponentPlayerNotes: r.opponentPlayerNotes || null,
          })),
      })
    }

    return created
  })

  return Response.json(match, { status: 201 })
}
