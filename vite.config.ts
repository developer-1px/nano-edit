import { defineConfig } from 'vite'

function normalizedModuleId(id: string): string {
  return id.replaceAll('\\', '/')
}

function isProseMirrorModule(id: string): boolean {
  const moduleId = normalizedModuleId(id)
  return (
    moduleId.includes('/node_modules/prosemirror-') ||
    moduleId.includes('/node_modules/.pnpm/prosemirror-')
  )
}

function isSchemaModule(id: string): boolean {
  const moduleId = normalizedModuleId(id)
  return (
    moduleId.includes('/node_modules/zod') ||
    moduleId.includes('/node_modules/.pnpm/zod') ||
    moduleId.includes('zod-crud')
  )
}

function isIconModule(id: string): boolean {
  const moduleId = normalizedModuleId(id)
  return moduleId.includes('/node_modules/lucide') || moduleId.includes('/node_modules/.pnpm/lucide')
}

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-prosemirror',
              test: isProseMirrorModule,
              priority: 3,
            },
            {
              name: 'vendor-schema',
              test: isSchemaModule,
              priority: 2,
            },
            {
              name: 'vendor-icons',
              test: isIconModule,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
