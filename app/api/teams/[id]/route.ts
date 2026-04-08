import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const team = await prisma.team.findUnique({
    where: { id: Number(id) },
    include: {
      coaches: { orderBy: { startYear: 'desc' } },
      players: { orderBy: [{ isRetired: 'asc' }, { enrollmentYear: 'desc' }] },
    },
  })
  if (!team) return Response.json({ error: '見つかりません' }, { status: 404 })
  return Response.json(team)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, type } = body

  const team = await prisma.team.update({
    where: { id: Number(id) },
    data: { name, type },
  })
  return Response.json(team)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.team.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
