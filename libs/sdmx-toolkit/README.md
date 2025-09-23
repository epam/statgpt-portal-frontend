# SDMX Toolkit

This is StatGpt portals library
offers tools and utilities for working with SDMX
(Statistical Data and Metadata eXchange) data formats and Api
in the StatGPT portal frontend.
It includes parsing, validation, and integration logic
for SDMX structures
and utilities and helpers for working with SDMX Api standard.

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

- Parse and handle SDMX structures
- Utilities for working with SDMX codes, dimensions, and structures
- Helpers for localization and formatting
- Pre-configured API client for easy access to SDMX Api
- Type definitions for SDMX concepts
- Lightweight and minimal dependencies

## Installation

```bash
npm install @dev-statgpt/sdmx-toolkit
```

## Usage

```typescript
import { DatasetApi, SdmxApiClient, } from '@dev-statgpt/sdmx-toolkit';

const sdmxApiClient = new SdmxApiClient({
  apiUrl:  apiUrl,
  constrainsApiUrl: constrainsApiUrl,
  apiKey: apiKey,
});

// Example usage
export const datasetApi = new DatasetApi(sdmxApiClient);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details on:

- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](../../SECURITY.md).


## License

[MIT](./LICENSE) - see the [LICENSE](../../LICENSE) file for details.
