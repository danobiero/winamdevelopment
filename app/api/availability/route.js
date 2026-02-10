import { NextResponse } from 'next/server';
import { getBookedCountByLessonIdEdit } from '@/app/_lib/data-service';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');
  const bookingId = searchParams.get('bookingId');

  if (!lessonId) {
    return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
  }

  const bookedCounts = await getBookedCountByLessonIdEdit(lessonId, bookingId);
  return NextResponse.json(bookedCounts);
}
