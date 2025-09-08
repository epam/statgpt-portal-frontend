# SDMX Toolkit

This library provides utilities and helpers for working with SDMX (Statistical Data and Metadata eXchange) data formats.

## Features

- Parse and handle SDMX-JSON data
- Utilities for working with SDMX codes, dimensions, and structures
- Helpers for localization and formatting
- Type definitions for SDMX concepts

## Installation

```bash
npm install @statgpt/sdmx-toolkit
```

## Usage

```typescript
import { getParsedResponse, getLocalizedName } from '@statgpt/sdmx-toolkit';

// Example: Parse SDMX-JSON data
const data = await fetch('https://example.com/data.json').then(res => res.json());
const parsed = getParsedResponse(data);

// Example: Get localized name for a code
const name = getLocalizedName(code, 'en');
```

## Contributing

Feel free to open issues or submit pull requests for improvements and bug fixes.
