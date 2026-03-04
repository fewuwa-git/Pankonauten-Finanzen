import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        JWT_SECRET: !!process.env.JWT_SECRET,
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
}
