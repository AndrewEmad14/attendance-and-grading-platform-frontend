import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommendedTypeChecked,

  // Wire up the TypeScript project so type-aware rules can resolve types.
  // projectService auto-discovers tsconfig.json + its referenced tsconfig.*.json
  // (tsconfig.app.json / tsconfig.node.json in a create-vue setup).
  {
    name: 'app/type-checked-options',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Turn off type-aware rules for plain JS config files (vite.config, etc.)
  // — they live outside the TS project and would otherwise throw.
  {
    name: 'app/disable-type-checked-on-js',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [vueTsConfigs.disableTypeChecked],
  },

  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Allow `any`
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow using any-typed values (often needed alongside the above)
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Allow un-awaited promises
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    },
  },

  skipFormatting,
)
