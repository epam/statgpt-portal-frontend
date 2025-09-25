# StatGPT Portal Frontend Example

A React and Nx based web StatGPT application. 

It's a reference application demonstrating how to build custom portals using the shared libraries provided in this repository. It serves as an example for constructing your own portal solutions based on our architecture.

[![npm version](https://badge.fury.io/js/@epam%2Fstatgpt-portal-frontend.svg)](https://badge.fury.io/js/@epam%2Fstatgpt-portal-frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Nx](https://img.shields.io/badge/Nx-21+-61dafb.svg)](https://nx.dev/)

## Table of Contents

- [✨ Main Features](#-main-features)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Start](#start)
- [💻 Development](#-development)
  - [Prerequisites](#prerequisites-1)
  - [Development Setup](#development-setup)
- [🎨 Theming & Customization](#-theming--customization)
- [🤝 Contributing](#-contributing)
- [🔒 Security](#-security)
- [📄 License](#-license)
- [🌟 Related Projects](#-related-projects)

## ✨ Main Features

- **Chat interface & history**: based on DIAL Api
- **Effortless SDMX data exploration**: powered by the SDMX API
- **Advanced view**: filtering across datasets
- **Charting**: view data in chart format
- **Sharing**: share conversations via link or QH-code

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.19.0
- npm >= 11.0.0

### Start

```bash
npm install 
mpn run start
```

## 💻 Development

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


## 🎨 Theming & Customization

The application uses Tailwind for comprehensive theming. Override variables in tailwind.config.js to match your styles:


Full list of variables is available [here](https://v2.tailwindcss.com/docs/configuration)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/epam/statgpt-portal-frontend/blob/development/CONTRIBUTING.md) for details on:

- Code style guidelines
- Testing requirements
- Pull request process


## 🔒 Security

If you discover a security vulnerability, please refer to our [Security Policy](https://github.com/epam/statgpt-portal-frontend/blob/development/SECURITY.md).

## 📄 License

[MIT](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) - see the [LICENSE](https://github.com/epam/statgpt-portal-frontend/blob/development/LICENSE) file for details.

## 🌟 Related Projects

- [AI-DIAL](https://github.com/epam/ai-dial) - Entrypoint for all AI Dial projects

---

<p align="center">
  Made by <a href="https://www.epam.com">EPAM Systems</a>
</p>
