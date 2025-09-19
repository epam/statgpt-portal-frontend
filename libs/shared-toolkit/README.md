# Shared Toolkit

This library contains shared utilities, helper functions, 
and common logic used across multiple modules in the StatGPT portal frontend. 
It promotes code reuse and consistency throughout the project.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![Typescript](https://img.shields.io/badge/Typescript-5+-61dafb.svg)](https://www.typescriptlang.org/)


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

- Common utility functions
- Shared type definitions
- Reusable helpers for data processing and formatting
- Navigation path utilities
- Lightweight and minimal dependencies

## Installation

```bash
npm install @dev-statgpt/shared-toolkit
```

## Usage

```typescript
import { getConversationNavPath } from '@dev-statgpt/shared-toolkit';

const navPath = getConversationNavPath(folderId, conversationKey);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details on:

- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](../../SECURITY.md).


## License

[MIT](./LICENSE) - see the [LICENSE](../../LICENSE) file for details.
