# Conversation List

The Conversation List library provides reusable React components and utilities for displaying and managing lists of conversations in StatGPT Portals projects.

## Features

- UI components for rendering conversation lists and items
- Support for highlighting search queries within conversation names
- Action menus for conversation management (delete, share, etc.)
- Customizable styles and icons
- Smooth scrolling to selected conversation

## Installation

```bash
npm install @statgpt/conversation-list
```

## Usage

```tsx
import { ConversationList } from '@statgpt/conversation-list';

// Example usage
<ConversationList
  selectedConversationId={selectedId}
  locale="en"
  conversationStyles={conversationStyles}
  onConversationClick={(folderId, conversationId) => {
    // handle click
  }}
  actions={actions}
  ...
/>
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.
