# DIAL Toolkit

This is StatGpt portals library,
provides utilities and helpers for working with DIAL Api in the StatGPT ecosystem.


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

- Pre-configured API clients for easy access to DIAL services
- Type definitions for DIAL concepts
- Utility functions for DIAL data processing
- Streaming data support
- Attachment handling and processing
- Support for authorization
- Integration with StatGPT ecosystem
- Lightweight and minimal dependencies

## Installation

```bash
npm install @epam/statgpt-dial-toolkit
```

## Usage

```typescript
import { DialApiClient, ConversationApi } from '@epam/statgpt-dial-toolkit';

const config = {
  host: yuor_dial_api_host,
  version: your_dial_api_version,
};

// Example usage
export const dialApiClient = new DialApiClient(config);
export const conversationApi = new ConversationApi(dialApiClient);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/epam/statgpt-portal-frontend/blob/development/CONTRIBUTING.md) for details on:

- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).


## License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.
