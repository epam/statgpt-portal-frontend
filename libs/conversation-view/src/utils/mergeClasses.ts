import classNames from 'classnames';
import { extendTailwindMerge } from 'tailwind-merge';

type CustomGroups = 'typography';

const twMerge = extendTailwindMerge<CustomGroups>({
  extend: {
    classGroups: {
      typography: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'body-1',
        'body-2',
        'body-3',
        'caption',
      ],
    },
  },
});

export function mergeClasses(...inputs: Parameters<typeof classNames>): string {
  return twMerge(classNames(...inputs));
}
