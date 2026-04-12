import { NextResponse } from 'next/server'

const PASSWORD = 'pnd'

export async function POST(request: Request) {
  const { password, section } = await request.json()

  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('karate-auth', section, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30日
    sameSite: 'lax',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('karate-auth')
  return response
}
