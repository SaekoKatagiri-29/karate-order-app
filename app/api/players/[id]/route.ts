import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, nickname, enrollmentYear, isRetired } = body

  const player = await prisma.player.update({
    where: { id: Number(id) },
    data: {
      name,
      nickname: nickname || null,
      enrollmentYear: Number(enrollmentYear),
      isRetired: Boolean(isRetired),
    },
  })
  return Response.json(player)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.player.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
