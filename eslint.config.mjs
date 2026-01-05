import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'

// Mimic CommonJS variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

const eslintConfig = [
  {
    ignores: ['**/node_modules/', '**/.next/', '**/dist/', '**/build/', '**/out/', '**/.git/']
  },
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    rules: {
      // Add custom rules here if needed
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off'
    }
  }
]

export default eslintConfig
