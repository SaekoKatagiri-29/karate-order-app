import { prisma } from '@/lib/prisma'

export async function GET() {
  const players = await prisma.osakaPlayer.findMany({
    orderBy: [{ isRetired: 'asc' }, { enrollmentYear: 'desc' }],
  })
  return Response.json(players)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, enrollmentYear } = body

  if (!name || !enrollmentYear) {
    return Response.json({ error: '氏名と入学年度は必須です' }, { status: 400 })
  }

  const player = await prisma.osakaPlayer.create({
    data: { name, enrollmentYear: Number(enrollmentYear) },
  })
  return Response.json(player, { status: 201 })
}
