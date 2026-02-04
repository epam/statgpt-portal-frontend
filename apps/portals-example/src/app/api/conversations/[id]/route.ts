import { withAuth } from '../../../../utils/auth/withAuth';
import { deleteHandler } from './deleteHandler';
import { getHandler } from './getHandler';
import { putHandler } from './putHandler';

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
