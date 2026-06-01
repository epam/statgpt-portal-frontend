declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

declare module '@epam/statgpt-ui-components/scss/styles.scss';

declare module '*.scss?inline' {
  const content: string;
  export default content;
}
