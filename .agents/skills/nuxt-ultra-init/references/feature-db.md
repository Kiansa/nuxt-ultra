# DB Feature

## Case 1: `@nuxtjs/supabase` is selected for DB
Apply only when `@nuxtjs/supabase` is selected.

### File Updates

#### Path: nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  supabase: {
    types: '#shared/types/database.types.ts',
  },
})
```

#### Path: .env.local
```dotenv
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_anon_key"
SUPABASE_SECRET_KEY="your_supabase_secret_key"
SUPABASE_TOKEN="your_supabase_token"
SUPABASE_PROJECT_ID="your_supabase_project_id"
```

#### Path: .env.production
```dotenv
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_anon_key"
SUPABASE_SECRET_KEY="your_supabase_secret_key"
SUPABASE_TOKEN="your_supabase_token"
SUPABASE_PROJECT_ID="your_supabase_project_id"
```



#### Path: package.json
```json
{
  "scripts": {
    "db": "npx dotenv -e .env.local -- powershell -Command \"npx supabase login --token $env:SUPABASE_TOKEN ; npx supabase gen types --lang=typescript --project-id $env:SUPABASE_PROJECT_ID > ./shared/types/database.types.ts\""
  }
}
```

### Packages

#### Path: terminal command
respect package manager choice:
```bash
npm i @nuxtjs/supabase 
npm i -D supabase
```

## Case 2: `nuxt-postgrest` is selected for DB
Apply only when `nuxt-postgrest` is selected.

### File Updates

#### Path: modules/nuxt-postgrest/index.ts
```ts
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addImports, addServerImports, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { defu } from 'defu'

const logger = useLogger('nuxt-postgrest')

export type AuthProvider = 'nuxt-auth-utils' | 'better-auth' | 'custom'

export interface ModuleOptions {
  /**
   * PostgREST URL (can also be set via NUXT_PUBLIC_PGRST_URL)
   */
  url?: string
  /**
   * Auth provider for session extraction
   * Auto-detected if not specified
   */
  authProvider?: AuthProvider
  /**
   * Automatic type generation for database types
   * requires NUXT_PGRST_DB_URI to be set and Docker Desktop running
   * it uses the Supabase CLI under the hood
   */
  generateTypes?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-postgrest',
    configKey: 'postgrest',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    authProvider: undefined,
    generateTypes: false,
  },

  async setup(options, nuxt) {
    // Register dev:prepare hook for type generation
    nuxt.hook('prepare:types', async () => {
      if (!options.generateTypes) {
        logger.info('[nuxt-postgrest] Skipping type generation: generateTypes option is disabled')
        return
      }
      const dbUri = process.env.NUXT_PGRST_DB_URI
      if (!dbUri) {
        logger.info('[nuxt-postgrest] Skipping type generation: NUXT_PGRST_DB_URI not set')
        return
      }

      const typesDir = join(nuxt.options.rootDir, 'shared', 'types')
      const typesFile = join(typesDir, 'database.types.ts')

      logger.info('[nuxt-postgrest] Generating database types...')

      try {
        // Supabase CLI outputs UTF-16 when creating new files - capture and write as UTF-8
        const output = execSync(
          `npx supabase gen types typescript --db-url "${dbUri}" --schema public`,
          { encoding: 'utf-8', timeout: 120000 },
        )
        // Ensure directory exists
        if (!existsSync(typesDir)) {
          mkdirSync(typesDir, { recursive: true })
        }

        // Write with UTF-8 encoding
        writeFileSync(typesFile, output, 'utf-8')
        logger.success(`[nuxt-postgrest] Database types generated at ${typesFile}`)
      }
      catch (error) {
        logger.warn('[nuxt-postgrest] Failed to generate database types. Ensure Docker is running and NUXT_PGRST_DB_URI is valid.')
        logger.error(`[nuxt-postgrest] Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    })

    // ...existing setup logic for composables and config...
    const resolver = createResolver(import.meta.url)

    // Auto-detect auth provider if not specified
    let authProvider = options.authProvider
    if (!authProvider) {
      const modules = nuxt.options.modules || []
      const moduleNames = modules.map(m => typeof m === 'string' ? m : Array.isArray(m) ? m[0] : '').filter(Boolean)

      if (moduleNames.includes('nuxt-auth-utils')) {
        authProvider = 'nuxt-auth-utils'
        logger.info('[nuxt-postgrest] Detected nuxt-auth-utils for session extraction')
      }
      else if (moduleNames.includes('better-auth/nuxt') || moduleNames.includes('@better-auth/nuxt')) {
        authProvider = 'better-auth'
        logger.info('[nuxt-postgrest] Detected better-auth for session extraction')
      }
      else {
        authProvider = 'custom'
        logger.warn('[nuxt-postgrest] No auth provider detected. Defaulting to custom auth. you need to pass a token if using usePostgrest() for authenticated role.')
      }
    }

    // Expose module options to runtime config using defu for proper merging
    // Public config (client + server)
    nuxt.options.runtimeConfig.public.postgrestUrl = defu(
      nuxt.options.runtimeConfig.public.postgrestUrl as string || '',
      options.url || '',
    )
    nuxt.options.runtimeConfig.public.postgrestKey = defu(
      nuxt.options.runtimeConfig.public.postgrestKey as string || '',
      '', // Set via NUXT_PUBLIC_PGRST_KEY
    )
    nuxt.options.runtimeConfig.public.postgrestAuthProvider = defu(
      nuxt.options.runtimeConfig.public.postgrestAuthProvider as string || '',
      authProvider,
    )

    // Private config (server only)
    nuxt.options.runtimeConfig.postgrestSecretKey = defu(
      nuxt.options.runtimeConfig.postgrestSecretKey as string || '',
      '', // Set via NUXT_PGRST_SECRET_KEY
    )

    // Register app composables (work on both client and server)
    addImports([
      { name: 'usePostgrest', from: resolver.resolve('./runtime/app/composables/usePostgrest') },
      { name: 'createPostgrestClient', from: resolver.resolve('./runtime/app/composables/createPostgrestClient') },
    ])

    // Register server-only composables
    addServerImports([
      { name: 'usePostgrestAdmin', from: resolver.resolve('./runtime/server/utils/usePostgrestAdmin') },
      { name: 'createPostgrestAdminClient', from: resolver.resolve('./runtime/server/utils/createPostgrestAdminClient') },
    ])
  },
})
```

#### Path: modules/nuxt-postgrest/runtime/app/composables/createPostgrestClient.ts
```ts
import { PostgrestClient } from '@supabase/postgrest-js'

// Type will be augmented by user's database.types
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Database {}

export interface CreatePostgrestClientOptions {
  /**
   * PostgREST API URL
   */
  url: string
  /**
   * API key or JWT for authorization
   */
  key: string
  /**
   * Additional headers to include
   */
  headers?: Record<string, string>
}

/**
 * Create a PostgREST client with explicit connection parameters
 * For multi-tenant or db-per-tenant patterns
 *
 * @param options - Connection options (url, key, optional headers)
 */
export function createPostgrestClient(options: CreatePostgrestClientOptions): PostgrestClient<Database> {
  const { url, key, headers = {} } = options

  if (!url) {
    throw new Error('[nuxt-postgrest] URL is required for createPostgrestClient()')
  }

  if (!key) {
    throw new Error('[nuxt-postgrest] Key is required for createPostgrestClient()')
  }

  return new PostgrestClient<Database>(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      ...headers,
    },
  })
}

export default createPostgrestClient
```

#### Path: modules/nuxt-postgrest/runtime/app/composables/usePostgrest.ts
```ts
import { PostgrestClient } from '@supabase/postgrest-js'

/**
 * Universal PostgREST composable for user-context and public queries
 *
 * Client-side: Reads session from cookie automatically based on auth provider
 *
 * @param token - required if auth provider is set to false
 */
export function usePostgrest(token?: string): PostgrestClient<Database> {
  const config = useRuntimeConfig()
  const { pgrstUrl, pgrstKey, public: { pgrstAuthProvider } } = config

  if (!pgrstUrl) {
    throw new Error('[nuxt-postgrest] Missing NUXT_PUBLIC_PGRST_URL')
  }

  const postgrestToken = token || getClientAccessToken(pgrstAuthProvider as string)

  return new PostgrestClient<Database>(pgrstUrl as string, {
    headers: {
      Authorization: `Bearer ${postgrestToken || pgrstKey}`,
    },
  })
}

/**
 * Extract access token from session on client
 */
function getClientAccessToken(authProvider: string): string | undefined {
  try {
    // Client-side session access depends on the auth provider
    if (authProvider === 'nuxt-auth-utils') {
      const { session } = useUserSession()
      if (!session.value) return undefined
      return session.value?.postgrest_token
    }
    else if (authProvider === 'better-auth') {
      // reminder to be implemented
    }
    return undefined
  }
  catch {
    return undefined
  }
}
```

#### Path: modules/nuxt-postgrest/runtime/server/utils/usePostgrestAdmin.ts
```ts
import { PostgrestClient } from '@supabase/postgrest-js'
import { useRuntimeConfig } from '#imports'
// @ts-expect-error - Database type will be imported from generated types
import type { Database } from '#shared/types/database.types' // Todo - allow custom path via config?

let adminInstance: PostgrestClient<Database> | null = null

export function usePostgrestAdmin(): PostgrestClient<Database> {
  if (import.meta.client) throw new Error('[nuxt-postgrest] usePostgrestAdmin() is server-only')
  if (adminInstance) return adminInstance

  const { public: { pgrstUrl }, pgrstSecretKey } = useRuntimeConfig()
  if (!pgrstUrl) throw new Error('[nuxt-postgrest] Missing NUXT_PUBLIC_PGRST_URL')
  if (!pgrstSecretKey) throw new Error('[nuxt-postgrest] Missing NUXT_PGRST_SECRET_KEY for admin access')

  adminInstance = new PostgrestClient<Database>(pgrstUrl as string, {
    headers: { Authorization: `Bearer ${pgrstSecretKey}` },
  })
  return adminInstance
}

export default usePostgrestAdmin
```

#### Path: modules/nuxt-postgrest/runtime/server/utils/createPostgrestAdminClient.ts
```ts
import { PostgrestClient } from '@supabase/postgrest-js'

// Type will be augmented by user's database.types
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Database {}

export interface CreatePostgrestClientOptions {
  /**
   * PostgREST API URL
   */
  url: string
  /**
   * API key or JWT for authorization
   */
  key: string
  /**
   * Additional headers to include
   */
  headers?: Record<string, string>
}

/**
 * Create a PostgREST client with explicit connection parameters
 * For multi-tenant or db-per-tenant patterns
 *
 * @param options - Connection options (url, key, optional headers)
 */
export function createPostgrestAdminClient<T = Database>(options: CreatePostgrestClientOptions): PostgrestClient<T> {
  const { url, key, headers = {} } = options

  if (!url) {
    throw new Error('[nuxt-postgrest] URL is required for createPostgrestClient()')
  }

  if (!key) {
    throw new Error('[nuxt-postgrest] Key is required for createPostgrestClient()')
  }

  return new PostgrestClient<T>(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      ...headers,
    },
  })
}

export default createPostgrestAdminClient
```

#### Path: .env.local
```dotenv
# nuxt-postgrest
NUXT_PUBLIC_PGRST_URL=""
NUXT_PUBLIC_PGRST_KEY=""
NUXT_PUBLIC_PGRST_AUTH_PROVIDER="nuxt-auth-utils"
NUXT_PGRST_SECRET_KEY=""
NUXT_PGRST_DB_URI=""
NUXT_PGRST_DB_JWT=""
```

#### Path: .env.production
```dotenv
# nuxt-postgrest
NUXT_PUBLIC_PGRST_URL=""
NUXT_PUBLIC_PGRST_KEY=""
NUXT_PUBLIC_PGRST_AUTH_PROVIDER="nuxt-auth-utils"
NUXT_PGRST_SECRET_KEY=""
NUXT_PGRST_DB_URI=""
NUXT_PGRST_DB_JWT=""
```