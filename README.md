# StatGPT Portal Frontend

Frontend codebase for StatGPT portals.
StatGPT is an SDMX-driven platform for statistical organizations allowing to query, 
transform, analyze, visualize, and interpret statistical data using natural language interface.
This repository providing reusable libraries and application example for building StatGPT Portals.
The application features a conversational interface powered by the DIAL API, optimized for working with SDMX data.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Typescript](https://img.shields.io/badge/Typescript-5+-61dafb.svg)](https://www.typescriptlang.org/)
[![Next](https://img.shields.io/badge/Next-15+-purple.svg)](https://nextjs.org/)
[![Nx](https://img.shields.io/badge/Nx-21+-5881D8.svg)](https://nx.dev/)


## 📋 Table of Contents

- [✨ Main Features](#-main-features)
- [🏗️ Architecture Overview](#-architecture-overview)
- [🚀 Getting Started](#-getting-started)
  - [🛠️ Prerequisites](#-prerequisites)
  - [📦 Installation](#-installation)
  - [▶️ Running Applications](#-running-applications)
  - [🏗️ Building Libraries](#-building-libraries)
- [🏗️ Project Structure](#-project-structure)
- [🧑‍💻 Development](#-development)
  - [🛠️ Prerequisites](#prerequisites)
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
- **Integration with Apis**: SDMX and DIAL APIs
- **Advanced UI components** for data exploration and sharing
- **Conversation Management**: Create, read, update, and delete conversations
- **Real-time Messaging**: Stream responses from LLM models using Server-Sent Events
- **Monorepo Architecture**: Organized with Nx for scalable development
- **Authentication Support**: NextAuth.js integration for secure user authentication


## 🏗️ Architecture Overview

This project uses:
- **Next.js** with App Router for the frontend framework
- **Nx Monorepo**  for project organization and tooling
- **TypeScript**  for type safety
- **Tailwind CSS**  for styling
- **DIAL API** for LLM backend integration
- **React** for building UI components
- **NextAuth.js** for authentication (optional)

## 🚀 Getting Started

### 🛠️ Prerequisites

- Node.js >= 22.19.0
- npm >= 11.0.0
- DIAL API access (for backend integration)

### 📦 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/epam/statgpt-portal-frontend.git
cd statgpt-portal-frontend
npm install
```

### ▶️ Running Applications

To start a development server for an application (e.g., `portals-example`):

```bash
nx serve portals-example
```

Replace `portals-example` with the desired app name.

### 🏗️ Building Libraries

To build a library:

```bash
nx build <library-name>
```

## 🏗️ Project Structure

```
apps/
  portals-example/           # Example portal application
  ...
libs/
  conversation-view/         # Advanced conversation view components
  share-conversation/        # Conversation sharing utilities
  dial-toolkit/              # DIAL API integration toolkit
  sdmx-toolkit/              # SDMX API integration toolkit
  ...
```


## 🧑‍💻 Development

### Prerequisites

- Node.js >= 22.19.0
- npm >= 11.0.0
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
   
3. **Set up environment variables**. 
    
   Create a `.env` file in the application directory:

    ```env
    # DIAL API Configuration
    DIAL_API_URL=https://your-dial-api-endpoint.com
    DIAL_API_VERSION=your-dial-api-version
    DIAL_API_KEY=your-api-key
    DEFAULT_MODEL="ADD_VALUE_HERE"
   
    # SDMX API Configuration
    SDMX_API_URL=https://your-sdmx-api-endpoint.com
    ```

4. **Start Development Environment**

   ```bash
   # Start Vite dev server
   npm run start
   ```

    Once the server is up and running, open http://localhost:4200 in your browser to view the application.

## 🎨 Styling

The project uses Tailwind CSS with a custom theme configuration:

- **Primary colors**: Blue palette (CSS variables)
- **Secondary colors**: Slate/gray palette
- **Custom animations**: fade-in, slide-up, pulse-slow
- **Custom spacing**: Extended spacing scale
- **Font families**: Inter (sans), JetBrains Mono (mono)

See `tailwind.config.js` for the complete configuration.

## 📚 Libraries

You can find libraries with detailed documentation in the `libs/` directory:

### @statgpt/conversation-list
React components for managing conversation history.

### @statgpt/conversation-view
React components for chat interface.

### @statgpt/dial-toolkit
DIAL Api client library.

### @statgpt/download-panel
React components for downloading SDMX data.

### @statgpt/sdmx-toolkit
SDMX Api client library.

### @statgpt/share-conversation
Utilities for sharing conversations via link or QR code.

### @statgpt/shared-toolkit
Shared TypeScript interfaces.

### @statgpt/ui-components
Reusable React components.

## 🧪 Testing

The project uses Jest for testing:

```bash
# Run all tests
yarn test

# Run tests for specific app/lib
yarn nx test portals-example
yarn nx test dial-toolkit
```

## 🔗 Related Resources

- [DIAL API Documentation](https://dialx.ai/dial_api)
- [Next.js Documentation](https://nextjs.org/docs)
- [NX Documentation](https://nx.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process

## 🔒 Security

If you discover a security vulnerability, please refer to our [Security Policy](./SECURITY.md).

## 📄 License

[MIT](./LICENSE) - see the [LICENSE](./LICENSE) file for details.

## 🔗 Related Projects

- [AI-DIAL](https://github.com/epam/ai-dial) - Entrypoint for all AI Dial projects

---

<p align="center">
  Made by <a href="https://www.epam.com">EPAM Systems</a>
</p>

`
