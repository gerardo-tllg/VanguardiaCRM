import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ cases: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('cases')
    .select('case_number, client_name')
    .or(
        `client_name.ilike.%${q}%,case_number.ilike.%${q}%,phone.ilike.%${q}%, email.ilike.%${q}%`
    )
    .limit(10);

    if (error) {
        return NextResponse.json({ cases: [] });
    }

    return NextResponse.json({ cases: data || [] });
}