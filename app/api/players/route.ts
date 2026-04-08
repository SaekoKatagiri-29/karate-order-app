import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, nickname, enrollmentYear, teamId } = body

  if (!name || !enrollmentYear || !teamId) {
    return Response.json({ error: '氏名・入学年度・チームIDは必須です' }, { status: 400 })
  }

  const player = await prisma.player.create({
    data: {
      name,
      nickname: nickname || null,
      enrollmentYear: Number(enrollmentYear),
      teamId: Number(teamId),
    },
  })
  return Response.json(player, { status: 201 })
}
