import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

type ExportFormat = 'json' | 'markdown';

type DraftRecord = {
  id: string;
  userId: string;
  title?: string | null;
  content?: string | null;
  summary?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function isExportFormat(value: string | null): value is ExportFormat {
  return value === 'json' || value === 'markdown';
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function buildMarkdownDraft(draft: DraftRecord): string {
  const title = normalizeText(draft.title) || 'Untitled Draft';
  const summary = normalizeText(draft.summary);
  const content = normalizeText(draft.content);

  const sections: string[] = [`# ${title}`];

  if (summary) {
    sections.push('', '## Summary', summary);
  }

  if (content) {
    sections.push('', '## Content', content);
  }

  return sections.join('\n');
}

function buildJsonDraft(draft: DraftRecord) {
  return {
    id: draft.id,
    title: normalizeText(draft.title) || 'Untitled Draft',
    summary: normalizeText(draft.summary) || null,
    content: normalizeText(draft.content) || null,
    createdAt: draft.createdAt ? new Date(draft.createdAt).toISOString() : null,
    updatedAt: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : null,
  };
}

function formatDraft(draft: DraftRecord, format: ExportFormat): string | object {
  return format === 'markdown' ? buildMarkdownDraft(draft) : buildJsonDraft(draft);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session : any = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formatParam = request.nextUrl.searchParams.get('format');

    if (!isExportFormat(formatParam)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "markdown".' },
        { status: 400 }
      );
    }

    const draft = (await prisma.draft.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as DraftRecord | null;

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formatted = formatDraft(draft, formatParam);

    if (formatParam === 'markdown') {
      const filename = `${normalizeText(draft.title).replace(/[^\w\-]+/g, '_') || 'draft'}.md`;
      return new NextResponse(formatted as string, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Draft export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export draft' },
      { status: 500 }
    );
  }
}