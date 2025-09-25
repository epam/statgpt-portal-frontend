# Conversation View

This is StatGpt portals library, provides reusable React components, context, and utilities
for managing and displaying advanced conversation views within the StatGPT portals.
It includes logic for representing conversations, chating, handling stream-messages, showing attachments, advanced UI and welcome-page.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Typescript](https://img.shields.io/badge/Typescript-5+-61dafb.svg)](https://www.typescriptlang.org/)


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Styling & Customization](#styling--customization)
- [Localization](#localization)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

- Base conversation view component
- Advanced UI components for displaying conversation views
- Context and utilities for managing chat state
- Support for streaming messages
- Handling and displaying attachments
- Welcome page integration with suggested prompts
- Customizable styles and icons

## Installation

```bash
npm install @dev-statgpt/conversation-view
```

## Usage

```tsx
import { ConversationView } from '@dev-statgpt/conversation-view';

// Example usage
<ConversationView
  conversation={conversation}
  actions={conversationViewActions}
  locale={locale}
  titles={conversationViewTitles}
  messageStyles={messageStyles}
  attachmentsStyles={attachmentsStyles}
  ...
/>
```


## Styling & Customization

You can customize the conversation view and it's components by using the `...Styles` (ex.  `messageStyles`) prop. This allows you to override icons & default styles with your own CSS styles.

## Localization

The component supports localization of used chat-model through the `locale` prop. You can also provide translations for various UI elements using the `titles` prop.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/epam/statgpt-portal-frontend/blob/development/CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).

## License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.
