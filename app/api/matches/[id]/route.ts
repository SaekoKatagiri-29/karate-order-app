import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id: Number(id) },
    include: {
      team: true,
      coach: true,
      orderEntries: {
        include: { player: true },
        orderBy: { position: 'asc' },
      },
      matchResults: {
        include: { osakaPlayer: true, opponentPlayer: true },
        orderBy: { position: 'asc' },
      },
    },
  })
  if (!match) return Response.json({ error: '見つかりません' }, { status: 404 })
  return Response.json(match)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.match.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
