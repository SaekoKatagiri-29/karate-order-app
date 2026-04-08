import { prisma } from '@/lib/prisma'

export async function GET() {
  const teams = await prisma.team.findMany({
    include: {
      coaches: { orderBy: { startYear: 'desc' } },
      _count: { select: { players: true, matches: true } },
    },
    orderBy: { name: 'asc' },
  })
  return Response.json(teams)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, type } = body

  if (!name || !type) {
    return Response.json({ error: '大学名と種別は必須です' }, { status: 400 })
  }

  const team = await prisma.team.create({
    data: { name, type },
  })
  return Response.json(team, { status: 201 })
}
