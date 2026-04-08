import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, nickname, startYear, teamId } = body

  if (!name || !startYear || !teamId) {
    return Response.json({ error: '氏名・就任年・チームIDは必須です' }, { status: 400 })
  }

  const coach = await prisma.coach.create({
    data: { name, nickname: nickname || null, startYear: Number(startYear), teamId: Number(teamId) },
  })
  return Response.json(coach, { status: 201 })
}
