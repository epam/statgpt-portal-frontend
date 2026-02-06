import { withAuth } from '../../../utils/auth/withAuth';
import { getHandler } from './getHandler';
import { postHandler } from './postHandler';

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
