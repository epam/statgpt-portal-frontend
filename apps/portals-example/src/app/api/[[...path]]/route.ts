import { NextResponse } from 'next/server';

const notFoundResponse = () =>
  NextResponse.json({ error: 'Not Found' }, { status: 404 });

export function GET() {
  return notFoundResponse();
}

export function POST() {
  return notFoundResponse();
}

export function PUT() {
  return notFoundResponse();
}

export function DELETE() {
  return notFoundResponse();
}

export function PATCH() {
  return notFoundResponse();
}

export function OPTIONS() {
  return notFoundResponse();
}
