# Nuxt ESLint Feature

## Condition
Apply only when `@nuxt/eslint` is selected.

## File Updates

### Path: .vscode/settings.json
Add the following:
```json
{
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
}
```

### Path: nuxt.config.ts
Add to `modules`:
```ts
'@nuxt/eslint',
```

Add top-level config block:
```ts
eslint: {
  config: {
    stylistic: true,
  },
},
```

### Path: eslint.config.mjs
```js
// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/multi-word-component-names': 'off',
    },
    ignores: [
      '.agents',
      '.github',
      'README.md',
      'node_modules',
      'dist',
      '.nuxt',
      '.output',
    ],
  },
)
```

## Packages

### Path: terminal command
```bash
npm install -D @nuxt/eslint eslint typescript
```
