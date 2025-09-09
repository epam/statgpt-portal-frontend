# Download Panel

The Download Panel library provides reusable React components and utilities for managing and displaying download panels in StatGPT projects.

## Features

- UI components for download panels and dialogs
- Utilities for handling file downloads
- Support for multiple file formats (CSV, XLSX, JSON, etc.)

## Usage

```tsx
import { DownloadPanel } from '@statgpt/download-panel';

// Example usage
<DownloadPanel
  availableFormats={['csv', 'xlsx', 'json']}
  onDownload={(format) => {
    // handle download logic
  }}
/>
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.
