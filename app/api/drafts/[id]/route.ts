import { NextRequest, NextResponse } from 'next/server';
import { drafts } from '../../../../lib/transcribe';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, context: any) {
  try {
    const id = context?.params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Draft id is required' }, { status: 400 });
    }

    const draft = drafts.get(id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(draft, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch draft by id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}