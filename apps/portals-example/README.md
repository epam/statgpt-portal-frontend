# StatGPT Portal Frontend Example

A React and Nx based web StatGPT application. 

It's a reference application demonstrating how to build custom portals using the shared libraries provided in this repository. It serves as an example for constructing your own portal solutions based on our architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/mit)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Nx](https://img.shields.io/badge/Nx-22+-61dafb.svg)](https://nx.dev/)

## Table of Contents

- [StatGPT Portal Frontend Example](#statgpt-portal-frontend-example)
  - [Table of Contents](#table-of-contents)
  - [✨ Main Features](#-main-features)
  - [🏗️ Architecture Overview](#️-architecture-overview)
  - [🚀 Quick Start](#-quick-start)
    - [Prerequisites](#prerequisites)
    - [Start](#start)
  - [💻 Development](#-development)
    - [Prerequisites](#prerequisites-1)
    - [Development Setup](#development-setup)
  - [🎨 Theming \& Customization](#-theming--customization)
  - [🧑‍💻 Environment Variables](#-environment-variables)
    - [Environment Variables for the Application](#environment-variables-for-the-application)
    - [Environment Variables for the Configuration of Auth Providers](#environment-variables-for-the-configuration-of-auth-providers)
    - [Content Configuration Environment Variables](#content-configuration-environment-variables)
    - [Feature Toggles Environment Variables](#feature-toggles-environment-variables)
  - [🤝 Contributing](#-contributing)
  - [🔒 Security](#-security)
  - [📄 License](#-license)
  - [🌟 Related Projects](#-related-projects)

## ✨ Main Features

- **Chat interface & history**: based on DIAL Api
- **Effortless SDMX data exploration**: powered by the SDMX API
- **Advanced view**: filtering across datasets
- **Charting**: view data in chart format
- **Sharing**: share conversations via link or QR-code

## 🏗️ Architecture Overview

This project uses:
- **Next.js** with App Router for the frontend framework
- **TypeScript**  for type safety
- **Tailwind CSS**  for styling
- **React** for building UI components
- **NextAuth.js** for authentication (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.19.0
- npm >= 11.0.0

### Start

```bash
npm install 
npm run start
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
   
    # SDMX API Configuration (optional — if not set, SDMX requests are proxied through DIAL_API_URL)
    SDMX_API_URL=https://your-sdmx-api-endpoint.com
    ```

4. **Start Development Environment**
   ```bash
   # Start Vite dev server
   npm run start
   ```

   Once the server is up and running, open http://localhost:4001 in your browser to view the application.


## 🎨 Theming & Customization

The application uses Tailwind for comprehensive theming. Override variables in tailwind.config.js to match your styles:

Full list of variables is available [here](https://tailwindcss.com/docs/configuration)


## 🧑‍💻 Environment Variables

### Environment Variables for the Application

Portals Example uses environment variables for configuration. All environment variables that can be used to configure settings and behavior of the application are included in the `.env` file.

> Selected variables were predefined for the development purposes in the `.env.development` file.

| Variable                            | Required | Description                                                                                                                                                                                                                                                   | Available Values | Default values                                                                                                                     |
| ----------------------------------- |:--------:|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------| ---------------------------------------------------------------------------------------------------------------------------------- |
| `DIAL_API_URL`                     |   Yes    | AI DIAL Core API Url.<br />Refer to [AI DIAL Core](https://github.com/epam/ai-dial-core?tab=readme-ov-file#dynamic-settings).                                                                                                                                 | URL              |                                                                                                                                    |
| `DIAL_API_KEY`                      | No | AI DIAL Core API Key.<br />Used as a fallback only when no auth provider is configured. If an auth provider is configured, requests authenticate via JWT and this key is ignored.<br />Refer to [AI DIAL Core](https://github.com/epam/ai-dial-core?tab=readme-ov-file#dynamic-settings) to learn how to set up AI DIAL Core and define API keys. | Any string       |                                                                                                                                    |
| `DIAL_API_VERSION`                  |    No    | AI DIAL API Version                                                                                                                                                                                                                                           | Any string       | `2024-02-01`                                                                                                                       |
| `DEFAULT_MODEL`                     |    No    | A model that will be used for the new conversation. `Reference` or `ID` of the agent.                                                                                                                                                                         | Any string       | First available model from [AI DIAL Core](https://github.com/epam/ai-dial-core?tab=readme-ov-file#dynamic-settings) config listing |
| `SDMX_API_URL`                     |    No    | SDMX+ api url. If not set, SDMX requests will be proxied through `DIAL_API_URL`.                                                                                                                                                                              | URL              |  |
| `CONSTRAINS_SDMX_API_URL`          |    No    | SDMX+ Constrains api url                                                                                                                                                                                                                                      | URL              |  |
| `SDMX_PROXY_URL`          |    No    | SDMX 3.0 constrains api url                                                                                                                                                                                                                                   | URL              |  |

### Environment Variables for the Configuration of Auth Providers

General auth variables:

| Variable                          |                         Required                         | Description                                                                                                                                                                                                                                        | Available Values                                                                                                                | Default values                                  |
|-----------------------------------| :------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `NEXTAUTH_URL`                    | Optional.<br /> Required for **production** deployments. | NextAuth URL                                                                                                                                                                                                                                       | Any string                                                                                                                      |                                                 |
| `NEXTAUTH_SECRET`                 |                           Optional                            | NextAuth Secret (generate by `openssl rand -base64 32` for example)                                                                                                                                                                                | Any string                                                                                                                      |                                                 |


The table below presents a list of environment variables you can use to configure a specific IDP provider.

| Variable                          |                         Required                         | Description                                                                                                                                                                                                                                        | Available Values                                                                                                                | Default values                                  |
|-----------------------------------| :------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `AUTH_AUTH0_AUDIENCE`             |                            No                            | Auth0 Audience                                                                                                                                                                                                                                     | Any string                                                                                                                      |                                                 |
| `AUTH_AUTH0_CLIENT_ID`            |                            No                            | Auth0 Client ID                                                                                                                                                                                                                                    | Any string                                                                                                                      |                                                 |
| `AUTH_AUTH0_HOST`                 |                            No                            | Auth0 Host                                                                                                                                                                                                                                         | Any string                                                                                                                      |                                                 |
| `AUTH_AUTH0_NAME`                 |                            No                            | Auth0 Name                                                                                                                                                                                                                                         | Any string                                                                                                                      |                                                 |
| `AUTH_AUTH0_SECRET`               |                            No                            | Auth0 Secret                                                                                                                                                                                                                                       | Any string                                                                                                                      |                                                 |
| `AUTH_AUTH0_SCOPE`                |                            No                            | Auth0 Scope                                                                                                                                                                                                                                        | Any string                                                                                                                      | `openid email profile offline_access`           |
| `AUTH_AUTH0_ADMIN_ROLE_NAMES`     |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_AUTH0_DIAL_ROLES_FIELD`     |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_AZURE_B2C_ISSUER`           |                            No                            | Azure AD B2C Issuer, used to create well-known as `${issuer}/.well-known/openid-configuration` or pass `tenantId` and `primaryUserFlow` instead of `issuer` to be used as `https://${tenantId}.b2clogin.com/${tenantId}.onmicrosoft.com/${primaryUserFlow}/v2.0` | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_TENANT_ID`        |                            No                            | Azure AD B2C Tenant ID. A globally unique identifier (GUID) representing your Azure AD B2C tenant. Used to identify and authenticate the tenant for the client application.                                 | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_CLIENT_ID`        |                            No                            | Azure AD B2C Client ID. The unique identifier for the client application registered in Azure AD B2C. Used to authenticate the client application when accessing B2C resources.                              | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_CLIENT_SECRET`    |                            No                            | Azure AD B2C Client Secret. A confidential string that authenticates and authorizes the client application to access Azure AD B2C resources. Serves as a password for the client application.              | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_USER_FLOW`        |                            No                            | Azure AD B2C User Flow. The name of the user flow (policy) configured in Azure AD B2C for authentication (e.g., `B2C_1_signupsignin`).                                                                    | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_NAME`             |                            No                            | Azure AD B2C Name. A display name for the Azure AD B2C provider configuration.                                                                                                                             | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_SCOPE`            |                            No                            | Azure AD B2C Scope. Specifies the permissions and resources the client application requests when authenticating with Azure AD B2C.                                                                         | Any string                                                                                                                      | `openid profile email offline_access`           |
| `AUTH_AZURE_B2C_AUD`              |                            No                            | Azure AD B2C Audience. The expected audience claim value in the issued tokens.                                                                                                                             | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_B2C_ADMIN_ROLE_NAMES` |                            No                            | Defines the administrator role names for Azure AD B2C. Values must be separated by a comma.                                                                                                                | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_AZURE_B2C_DIAL_ROLES_FIELD` |                            No                            | Defines the path of the roles field in JWT token for Azure AD B2C. Refer to `DIAL_ROLES_FIELD` for details.                                                         | Any string. Value can be dot-separated.                                                                                         |                                                 |
| `AUTH_AZURE_AD_CLIENT_ID`         |                            No                            | A unique identifier for the client application registered in Azure Active Directory (AD). It is used to authenticate the client application when accessing Azure AD resources.                                                                     | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_AD_NAME`              |                            No                            | A name of the Azure AD tenant. It is used to specify the specific Azure AD instance to authenticate against.                                                                                                                                       | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_AD_SECRET`            |                            No                            | Also known as the client secret or application secret, this parameter is a confidential string that authenticates and authorizes the client application to access Azure AD resources. It serves as a password for the client application.          | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_AD_TENANT_ID`         |                            No                            | Tenant ID refers to a globally unique identifier (GUID) that represents a specific Azure AD tenant. It is used to identify and authenticate the Azure AD tenant that the client application belongs to.                                            | Any string                                                                                                                      |                                                 |
| `AUTH_AZURE_AD_SCOPE`             |                            No                            | This parameter specifies the level of access and permissions that the client application requests when making a request to Azure AD resources. It defines the resources and actions that the application can access on behalf of a user or itself. | Any string                                                                                                                      | `openid profile user.Read email offline_access` |
| `AUTH_AZURE_AD_ADMIN_ROLE_NAMES`  |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_AZURE_AD_DIAL_ROLES_FIELD`  |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_GITLAB_CLIENT_ID`           |                            No                            | GitLab Client ID                                                                                                                                                                                                                                   | Any string                                                                                                                      |                                                 |
| `AUTH_GITLAB_HOST`                |                            No                            | GitLab Host                                                                                                                                                                                                                                        | Any string                                                                                                                      |                                                 |
| `AUTH_GITLAB_NAME`                |                            No                            | GitLab Name                                                                                                                                                                                                                                        | Any string                                                                                                                      |                                                 |
| `AUTH_GITLAB_SECRET`              |                            No                            | GitLab Secret                                                                                                                                                                                                                                      | Any string                                                                                                                      |                                                 |
| `AUTH_GITLAB_SCOPE`               |                            No                            | GitLab Scope                                                                                                                                                                                                                                       | Any string                                                                                                                      | `read_user`                                     |
| `AUTH_GITLAB_ADMIN_ROLE_NAMES`    |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_GITLAB_DIAL_ROLES_FIELD`    |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_GOOGLE_CLIENT_ID`           |                            No                            | Google Client ID                                                                                                                                                                                                                                   | Any string                                                                                                                      |                                                 |
| `AUTH_GOOGLE_NAME`                |                            No                            | Google Name                                                                                                                                                                                                                                        | Any string                                                                                                                      |                                                 |
| `AUTH_GOOGLE_SECRET`              |                            No                            | Google Secret                                                                                                                                                                                                                                      | Any string                                                                                                                      |                                                 |
| `AUTH_GOOGLE_SCOPE`               |                            No                            | Google Scope                                                                                                                                                                                                                                       | Any string                                                                                                                      | `openid email profile offline_access`           |
| `AUTH_KEYCLOAK_CLIENT_ID`         |                            No                            | Keycloak Client ID                                                                                                                                                                                                                                 | Any string                                                                                                                      |                                                 |
| `AUTH_KEYCLOAK_HOST`              |                            No                            | Keycloak Host                                                                                                                                                                                                                                      | Any string                                                                                                                      |                                                 |
| `AUTH_KEYCLOAK_NAME`              |                            No                            | Keycloak Name                                                                                                                                                                                                                                      | Any string                                                                                                                      |                                                 |
| `AUTH_KEYCLOAK_SECRET`            |                            No                            | Keycloak Secret                                                                                                                                                                                                                                    | Any string                                                                                                                      |                                                 |
| `AUTH_KEYCLOAK_SCOPE`             |                            No                            | Keycloak Scope                                                                                                                                                                                                                                     | Any string                                                                                                                      | `openid email profile offline_access`           |
| `AUTH_KEYCLOAK_ADMIN_ROLE_NAMES`  |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_KEYCLOAK_DIAL_ROLES_FIELD`  |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_PING_ID_CLIENT_ID`          |                            No                            | PingID Client ID                                                                                                                                                                                                                                   | Any string                                                                                                                      |                                                 |
| `AUTH_PING_ID_HOST`               |                            No                            | PingID Host                                                                                                                                                                                                                                        | Any string                                                                                                                      |                                                 |
| `AUTH_PING_ID_NAME`               |                            No                            | PingID Name                                                                                                                                                                                                                                        | Any string                                                                                                                      |                                                 |
| `AUTH_PING_ID_SECRET`             |                            No                            | PingID Secret                                                                                                                                                                                                                                      | Any string                                                                                                                      |                                                 |
| `AUTH_PING_ID_SCOPE`              |                            No                            | PingID Scope                                                                                                                                                                                                                                       | Any string                                                                                                                      | `offline_access`                                |
| `AUTH_PING_ID_ADMIN_ROLE_NAMES`   |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_PING_ID_DIAL_ROLES_FIELD`   |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_COGNITO_CLIENT_ID`          |                            No                            | Cognito Client ID                                                                                                                                                                                                                                  | Any string                                                                                                                      |                                                 |
| `AUTH_COGNITO_HOST`               |                            No                            | Cognito Host                                                                                                                                                                                                                                       | Any string                                                                                                                      |                                                 |
| `AUTH_COGNITO_NAME`               |                            No                            | Cognito Name                                                                                                                                                                                                                                       | Any string                                                                                                                      |                                                 |
| `AUTH_COGNITO_SECRET`             |                            No                            | Cognito Secret                                                                                                                                                                                                                                     | Any string                                                                                                                      |                                                 |
| `AUTH_COGNITO_SCOPE`              |                            No                            | Cognito Scope                                                                                                                                                                                                                                      | Any string                                                                                                                      | `openid email profile`                          |
| `AUTH_COGNITO_ADMIN_ROLE_NAMES`   |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_COGNITO_DIAL_ROLES_FIELD`   |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `AUTH_OKTA_CLIENT_ID`             |                            No                            | Okta Client ID                                                                                                                                                                                                                                     | Any string                                                                                                                      |                                                 |
| `AUTH_OKTA_CLIENT_SECRET`         |                            No                            | Okta Client Secret                                                                                                                                                                                                                                 | Any string                                                                                                                      |                                                 |
| `AUTH_OKTA_ISSUER`                |                            No                            | Okta domain issuer                                                                                                                                                                                                                                 | Any string                                                                                                                      |                                                 |
| `AUTH_OKTA_SCOPE`                 |                            No                            | Okta Scope                                                                                                                                                                                                                                         | Any string                                                                                                                      | `openid email profile`                          |
| `AUTH_OKTA_ADMIN_ROLE_NAMES`      |                            No                            | Defines the administrator names                                                                                                                                                                                                                    | Any string. Values must be separated by a comma.                                                                                |                                                 |
| `AUTH_OKTA_DIAL_ROLES_FIELD`      |                            No                            | Defines the path of the roles field in JWT token                                                                                                                                                                                                   | refer to `DIAL_ROLES_FIELD` for details                                                                                         |                                                 |
| `FEDERATED_LOGOUT_PROVIDERS`      |                            No                            | Comma-separated list of authentication provider IDs (e.g., keycloak, azure-ad) that require federated logout when the user signs out.                                                                                                                                                                                                                |                                                                                          |                                                 |


### Content Configuration Environment Variables

The table below lists environment variables that control configurable content displayed within the application (e.g., footer disclaimers, support links).

| Variable                          |                         Required                         | Description                                                                                                                                                                                                                                                      | Available Values                                                                                                                | Default values                                  |
|-----------------------------------| :------------------------------------------------------: |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `CLIENT_CONTACT_SUPPORT_URL`    |   No    | URL of the contact support page displayed to users within the application.                                                                                                                                                                                                                                                                                          | URL                                                                                       |  |
| `INFO_BANNER_MESSAGE`    |   No    | Plain text message displayed in the informational banner below the footer (e.g., maintenance notice or system alert). If not set, the banner is hidden.                                                                                                                                                                                                                                                                                           | Any string                                                                                       |  |
| `CONTENT_MANAGEMENT_POLICY_URL` | No | URL of the page describing the content management policy. Displayed in a warning message when a user's prompt triggers the content filtering policy. | URL |

### Feature Toggles Environment Variables

The table below lists boolean environment variables that enable or disable specific application features.

| Variable               | Required | Description                                                                                                                                                                          | Available Values  | Default values |
|------------------------|:--------:|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------| -------------- |
| `CROSS_DATASET_MODE`   |    No    | Enables cross-dataset mode, which allows filtering and exploring data across multiple SDMX datasets simultaneously. When enabled, also activates metadata display in the side panel and table settings controls. | `true` \| `false` | `false`        |

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
