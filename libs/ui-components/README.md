# UI Components

This library contains reusable UI components
for the StatGPT portal frontend.
It includes buttons, forms, modals,
and other visual elements to ensure a consistent
user interface across the application.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Typescript](https://img.shields.io/badge/Typescript-5+-61dafb.svg)](https://www.typescriptlang.org/)


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Styling & Customization](#styling--customization)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features
-
- Consistent, accessible, and customizable UI components
- Components for forms, buttons, inputs, modals, loaders, and more
- Built with TypeScript and Tailwind CSS
- Designed for easy integration and extension
- Customizable styles and icons

## Installation

```bash
npm install @dev-statgpt/ui-components
```

## Usage

```tsx
import { Button } from '@dev-statgpt/ui-components';

// Example usage
<Button
  title={buttonTitle}
  buttonClassName="classnames"
  isSmallButton={true}
  disabled={isDisabled}
  onClick={() => alert('Clicked!')}
/>
```


## Styling & Customization

You can customize components by using `...ClassName` props.
This allows you to override default styles with your own CSS styles.
You also can provide custom icons through corresponding props.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/epam/statgpt-portal-frontend/blob/development/CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).

## License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.
