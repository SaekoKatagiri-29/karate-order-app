import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, nickname, startYear, endYear } = body

  const coach = await prisma.coach.update({
    where: { id: Number(id) },
    data: {
      name,
      nickname: nickname || null,
      startYear: Number(startYear),
      endYear: endYear ? Number(endYear) : null,
    },
  })
  return Response.json(coach)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.coach.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
