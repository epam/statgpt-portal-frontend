# StatGPT Portal Frontend

Frontend codebase for StatGPT portals.
StatGPT is an SDMX-driven platform for statistical organizations allowing to query,
transform, analyze, visualize, and interpret statistical data using natural language interface.
This repository provides reusable libraries and an example application for building StatGPT Portals.
The application features a conversational interface powered by the DIAL API, optimized for working with SDMX data.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Typescript](https://img.shields.io/badge/Typescript-5+-61dafb.svg)](https://www.typescriptlang.org/)
[![Next](https://img.shields.io/badge/Next-15+-purple.svg)](https://nextjs.org/)
[![Nx](https://img.shields.io/badge/Nx-21+-5881D8.svg)](https://nx.dev/)


## 📋 Table of Contents

- [✨ Main Features](#-main-features)
- [📐 Architecture Overview](#-architecture-overview)
- [🚀 Getting Started](#-getting-started)
  - [🔧 Prerequisites](#-prerequisites)
  - [📦 Installation](#-installation)
  - [🏃 Running Applications](#-running-applications)
  - [📦 Building Libraries](#-building-libraries)
- [📁 Project Structure](#-project-structure)
- [🧑‍💻 Development](#-development)
  - [🔧 Prerequisites](#prerequisites)
  - [🧩 Development Setup](#development-setup)
- [🎨 Styling](#-styling)
- [📚 Libraries](#-libraries)
- [🧪 Testing](#-testing)
- [🔗 Related Resources](#-related-resources)
- [🤝 Contributing](#-contributing)
- [🔒 Security](#-security)
- [📄 License](#-license)
- [🔗 Related Projects](#-related-projects)

## ✨ Main Features

- **Modular Nx workspace** with reusable libraries
- **Example application** for rapid prototyping
- **Integration with APIs**: SDMX and DIAL APIs
- **Advanced UI components** for data exploration and sharing
- **Conversation Management**: Create, read, update, and delete conversations
- **Real-time Messaging**: Stream responses from LLM models using Server-Sent Events
- **Monorepo Architecture**: Organized with Nx for scalable development
- **Authentication Support**: NextAuth.js integration for secure user authentication


## 📐 Architecture Overview

This project uses:
- **Next.js** with App Router for the frontend framework
- **Nx Monorepo** for project organization and tooling
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **DIAL API** for LLM backend integration
- **React** for building UI components
- **NextAuth.js** for authentication (optional)

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js >= 24.14.0
- npm >= 11.11.0
- DIAL API access (for backend integration)

### 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/epam/statgpt-portal-frontend.git
cd statgpt-portal-frontend
npm install
```

### 🏃 Running Applications

To start the Next.js development server for `portals-example`:

```bash
npm run start
```

Once the server is up and running, open http://localhost:4001 in your browser.

To start the Storybook development server for `ui-components`:

```bash
npm run storybook
```

Storybook runs on http://localhost:6006.

### 📦 Building Libraries

To build all publishable libraries:

```bash
npm run build:publishable
```

To build a single library:

```bash
npx nx build <library-name>
```

To publish libraries to npm:

```bash
npm run publish:npm        # publish
npm run publish:dry        # dry run
```

## 📁 Project Structure

```
apps/
  portals-example/           # Example portal application (Next.js)
  storybook/                 # Storybook app for ui-components
libs/
  # Published as @epam/statgpt-* packages
  conversation-list/         # Sidebar conversation history components
  conversation-view/         # Main chat UI — messages, streaming, input
  dial-toolkit/              # DIAL API client
  sdmx-toolkit/              # SDMX API client and data utilities
  shared-toolkit/            # Shared TypeScript interfaces and utilities
  ui-components/             # Reusable design-system components
  # Internal only (monorepo use)
  download-panel/            # SDMX data download UI
  share-conversation/        # Share conversation via link or QR code
  user-info/                 # User info display component
specs/
  system/                    # Reference documentation for subsystems
  changes/                   # Design specs for in-progress features
```


## 🧑‍💻 Development

### Prerequisites

- Node.js >= 24.14.0
- npm >= 11.11.0
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/epam/statgpt-portal-frontend.git
   cd statgpt-portal-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp apps/portals-example/.env.local.example apps/portals-example/.env.local
   ```

   Both `.env` and `.env.local` are supported. See `apps/portals-example/.env.local.example` for all available variables including DIAL API, SDMX API, authentication providers, and logging options.

4. **Start Development Environment**

   ```bash
   npm run start
   ```

   Open http://localhost:4001 in your browser.

## 🎨 Styling

The project uses Tailwind CSS with a custom CSS-variable-based color system:

- **Primary colors**: Blue palette (CSS variables)
- **Secondary colors**: Slate/gray palette
- **Custom animations**: fade-in, slide-up, pulse-slow
- **Custom spacing**: Extended spacing scale
- **Font families**: Inter (sans), JetBrains Mono (mono)

See `tailwind.config.js` for the complete configuration. The compiled stylesheet is output to `dist/libs/ui-components/index.css` via `npm run build:styles`.

## 📚 Libraries

Libraries with detailed documentation are in the `libs/` directory.

### Published packages (`@epam/statgpt-*`)

#### @epam/statgpt-conversation-list
React components for managing conversation history.

#### @epam/statgpt-conversation-view
React components for the chat interface — message rendering, streaming, and input.

#### @epam/statgpt-dial-toolkit
DIAL API client library.

#### @epam/statgpt-sdmx-toolkit
SDMX API client and data transformation utilities.

#### @epam/statgpt-shared-toolkit
Shared TypeScript interfaces and utilities used across libraries and apps.

#### @epam/statgpt-ui-components
Reusable design-system components (Button, Input, Modal, etc.).

### Internal libraries (monorepo only)

#### download-panel
React components for downloading SDMX data.

#### share-conversation
Utilities for sharing conversations via link or QR code.

#### user-info
User info display component.

## 🧪 Testing

The project uses Jest for testing:

```bash
# Run all tests
npm run test

# Run tests for a specific project
npx nx test <project-name>

# Run a single test file
npx nx test <project-name> --testFile=<path>

# Filter by test name
npx nx test <project-name> -- --testNamePattern="test name"
```

Project names: `portals-example`, `ui-components`, `conversation-view`, `conversation-list`, `dial-toolkit`, `sdmx-toolkit`, `shared-toolkit`, `download-panel`, `share-conversation`, `user-info`.

## 🔗 Related Resources

- [DIAL API Documentation](https://dialx.ai/dial_api)
- [Next.js Documentation](https://nextjs.org/docs)
- [NX Documentation](https://nx.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/epam/statgpt-portal-frontend/blob/development/CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process

## 🔒 Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).

## 📄 License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.

## 🔗 Related Projects

- [AI-DIAL](https://github.com/epam/ai-dial) - Entrypoint for all AI Dial projects

---

<p align="center">
  Made by <a href="https://www.epam.com">EPAM Systems</a>
</p>
