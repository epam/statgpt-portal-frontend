import { AuthParams } from './../../../../models/auth';
import { NextRequest, NextResponse } from 'next/server';
import { conversationApi } from '../../api';
import { withAuth } from '../../../../utils/auth/withAuth';
import { createErrorResponse } from '../../../../utils/api/create-error-response';

export const GET = withAuth(
  async (
    _req: NextRequest,
    { token }: AuthParams,
    context: { params: Promise<{ path: string }> },
  ) => {
    try {
      const params = await context.params;
      const path = params.path;

      if (!path) {
        return NextResponse.json(
          { error: 'file path is required' },
          { status: 400 },
        );
      }

      const file = await conversationApi.getFile(
        path,
        token.access_token as string,
      );

      return NextResponse.json(file);
    } catch (error) {
      return createErrorResponse(error, 'get-file');
    }
  },
);

export const PUT = withAuth(
  async (
    req: NextRequest,
    { token }: AuthParams,
    context: { params: Promise<{ path: string }> },
  ) => {
    try {
      const params = await context.params;
      const path = params.path;

      if (!path) {
        return NextResponse.json(
          { error: 'file path is required' },
          { status: 400 },
        );
      }

      const formData = await req.formData();
      const attachment = formData.get('attachment');

      if (!(attachment instanceof File)) {
        return NextResponse.json(
          { error: 'attachment file is required' },
          { status: 400 },
        );
      }

      await conversationApi.putFile(
        path,
        attachment,
        token.access_token as string,
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      return createErrorResponse(error, 'upload-file');
    }
  },
);

export const DELETE = withAuth(
  async (
    _req: NextRequest,
    { token }: AuthParams,
    context: { params: Promise<{ path: string }> },
  ) => {
    try {
      const params = await context.params;
      const path = params.path;

      if (!path) {
        return NextResponse.json(
          { error: 'file path is required' },
          { status: 400 },
        );
      }

      await conversationApi.deleteFile(path, token.access_token as string);

      return NextResponse.json({ success: true });
    } catch (error) {
      return createErrorResponse(error, 'delete-file');
    }
  },
);
