import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, enrollmentYear, isRetired } = body

  const player = await prisma.osakaPlayer.update({
    where: { id: Number(id) },
    data: {
      name,
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
  await prisma.osakaPlayer.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
