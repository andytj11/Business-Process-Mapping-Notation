import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Ensure this path is correct
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/' // Default redirect to home

  if (token_hash && type) {
    const supabase = createClient() // Use the server client from utils

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Successfully verified OTP, redirect user
      return redirect(next)
    }
    // Log error if OTP verification fails
    console.error('Error verifying OTP:', error.message)
  }

  // If token_hash or type is missing, or if OTP verification fails, redirect to an error page
  // Ensure you have an /error page or change this to a more appropriate redirect
  const errorUrl = new URL('/error', request.url)
  errorUrl.searchParams.set('message', 'Invalid or expired confirmation link.')
  return redirect(errorUrl.toString())
}
