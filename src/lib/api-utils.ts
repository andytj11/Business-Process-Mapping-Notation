import { NextResponse } from 'next/server';

interface ApiError extends Error {
  code?: string | number;
}

export function handleApiError(error: any, customMessage?: string) {
  console.error(customMessage || 'API Error:', error);

  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const errorCode = (error as ApiError).code;

  return NextResponse.json(
    {
      error: errorMessage,
      ...(errorCode && { code: errorCode }), // Include code only if it exists
    },
    { status: 500 }
  );
}
