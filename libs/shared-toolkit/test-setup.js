import { getJestProjectsAsync } from '@nx/jest';
import '@testing-library/jest-dom';

export default async () => ({
  projects: await getJestProjectsAsync(),
});
