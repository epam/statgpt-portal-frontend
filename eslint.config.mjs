import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nx from '@nx/eslint-plugin';
import globals from 'globals';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tailwindPlugin from 'eslint-plugin-tailwindcss';

export default [
  {
    ignores: [
      '**/node_modules',
      '**/next',
      '**/.next',
      '**/next-env.d.ts',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/jest.config.ts',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/test-setup.js',
    ],
  },

  // ── Core TypeScript / React rules ────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        globalThis: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      '@nx': nx,
      react: reactPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      ...eslintConfigPrettier.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-empty': 'error',
      'no-constant-condition': 'error',
      'no-multiple-empty-lines': [
        'warn',
        {
          max: 1,
          maxBOF: 0,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
    },
  },

  // ── Import plugin (TypeScript-aware) ─────────────────────────────────────
  {
    ...importPlugin.flatConfigs.recommended,
    files: ['**/*.{ts,tsx,js,jsx}'],
  },
  {
    ...importPlugin.flatConfigs.typescript,
    files: ['**/*.{ts,tsx,js,jsx}'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    settings: {
      // Use eslint-import-resolver-typescript to resolve Nx path aliases
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // TypeScript already enforces these; no need to duplicate
      'import/no-unresolved': 'off',
      'import/default': 'off',
      'import/namespace': 'off',
      // Keep the valuable ones
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'warn',
      'import/no-named-as-default-member': 'off',
    },
  },

  // ── Tailwind CSS ─────────────────────────────────────────────────────────
  ...tailwindPlugin.configs['flat/recommended'],
];
