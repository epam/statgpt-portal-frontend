# Conversation List

This is StatGpt portals library, provides reusable React components and utilities for displaying and managing lists of conversations in StatGPT Portals projects. It handles rendering, selection, and interaction with conversation items.

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

- UI components for rendering conversation lists and items
- Support for highlighting search queries within conversation names
- Action menus for conversation management (delete, share, etc.)
- Customizable styles and icons
- Smooth scrolling to selected conversation

## Installation

```bash
npm install @dev-statgpt/conversation-list
```

## Usage

```tsx
import { ConversationList } from '@dev-statgpt/conversation-list';

// Example usage
<ConversationList
  selectedConversationId={selectedId}
  conversations={conversations}
  handleConversationClick={handleConversationSelect}
  handleSelectedConversationRemove={handleSelectedConversationRemove}
  conversationStyles={conversationStyles}
  actions={actions}
  locale={locale}
  ...
/>
```


## Styling & Customization

You can customize the appearance of the conversation list and items using the `conversationStyles` prop. This allows you to override icons & default styles with your own CSS styles.

## Localization

The component supports localization of used chat-model through the `locale` prop. You can also provide translations for various UI elements using the `titles` prop.

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process


## Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).

## License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.
