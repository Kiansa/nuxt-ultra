#!/usr/bin/env node

import { execSync } from 'child_process'
import { cpSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { resolve } from 'pathe'
import { createConsola } from 'consola'

const consola = createConsola()

// Feature configurations
const FEATURES = {
  '@nuxtjs/supabase': {
    name: 'Supabase',
    package: '@nuxtjs/supabase',
  },
  '@nuxtjs/i18n': {
    name: 'Nuxt i18n',
    package: '@nuxtjs/i18n',
    subChoices: [
      { name: 'Use locale files (en.json, de.json, ...)', value: 'files' },
      { name: 'Fetch translations from Supabase (experimental)', value: 'supabase' },
    ],
    devDependency: true,
  },
  '@nuxtjs/seo': {
    name: 'Nuxt SEO Module',
    package: '@nuxtjs/seo',
    devDependency: true,
  },
  'dashboard': {
    name: 'Dashboard & Auth Layout (supabase required)',
  },
  'ai': {
    name: 'AI Integration',
    package: 'openai', // Single OpenAI SDK for all providers
    subChoices: [
      { name: 'OpenAI', value: 'openai' },
      { name: 'xAI (Grok)', value: 'xai' },
      { name: 'Google Gemini', value: 'gemini' },
      { name: 'Anthropic Claude', value: 'claude' },
    ],
  },
  'cloudflare-r2': {
    name: 'Cloudflare R2 Storage',
    package: 'aws4fetch',
  },
  'zod': {
    name: 'Zod',
    package: 'zod',
  },
}

const DEPLOYMENT_OPTIONS = [
  { name: 'Cloudflare Workers', value: 'cloudflare' },
  { name: 'Node.js Server', value: 'node' },
]

const IGNORE_TRANSFER_FILES = []

consola.info('🚀 Welcome to Nuxt Ultra Setup!')
consola.info('This interactive setup will help you configure your project with the features you need.\n')

async function promptMultiSelect(message, choices) {
  const selectedIndexes = await consola.prompt(message, {
    type: 'multiselect',
    required: false,
    options: choices.map(choice => ({
      label: choice.name,
      value: choice.value,
    })),
  })

  return selectedIndexes || []
}

async function promptSelect(message, choices) {
  const selectedValue = await consola.prompt(message, {
    type: 'select',
    options: choices.map(choice => ({
      label: choice.name,
      value: choice.value,
    })),
  })

  return selectedValue
}

async function getProjectInfo() {
  const siteUrl = await consola.prompt('🌐 What is the site URL?', {
    placeholder: 'https://example.com',
    initial: 'https://example.com',
  })

  const siteName = await consola.prompt('📝 What is the site name?', {
    placeholder: 'My Nuxt Site',
    initial: 'My Nuxt Site',
  })

  const siteDescription = await consola.prompt('📝 What is the site description? (SEO meta description)', {
    placeholder: 'A brief description of my Nuxt site',
    initial: 'A brief description of my Nuxt site',
  })

  const defaultLocale = await consola.prompt('🌍 What is the default locale/language code?', {
    initial: 'en',
    placeholder: 'en',
  })

  const repoName = await consola.prompt('📦 What is the repository name for your project?', {
    initial: siteUrl ? siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '',
    placeholder: 'example.com',
  })

  const devPort = await consola.prompt('💻 What port do you want to use for development server?', {
    initial: '3000',
    placeholder: '3000',
  })

  if (!siteUrl || !siteName || !defaultLocale || !repoName || !devPort) {
    consola.error('❌ All fields are required. Please try again.')
    return process.exit(1)
  }

  return { siteUrl, siteName, defaultLocale, siteDescription, repoName, devPort }
}

async function main() {
  try {
    const selections = {}

    // init (grab essential information)
    const projectInfo = await getProjectInfo()
    selections.info = projectInfo

    // Step 1: Select features
    consola.start('Step 1: Selecting features...')
    const featureChoices = Object.entries(FEATURES).map(([key, config]) => ({
      ...config,
      value: key,
    }))

    const selectedFeatures = await promptMultiSelect(
      '📦 Which modules would you like to use?',
      featureChoices,
    )

    selections.features = selectedFeatures

    // Step 2: Handle sub-choices
    for (const feature of selectedFeatures) {
      const config = FEATURES[feature]
      if (config.subChoices) {
        if (feature === 'ai') {
          // AI allows multiple provider selection
          const aiProviders = await promptMultiSelect(
            `🔧 Select AI providers for ${config.name}:`,
            config.subChoices,
          )
          selections[`${feature}_method`] = aiProviders
        }
        else {
          // Other features use single selection
          const subChoice = await promptSelect(
            `🔧 Configure ${config.name}:`,
            config.subChoices,
          )
          selections[`${feature}_method`] = subChoice
        }
      }
    }

    // Step 3: Deployment choice
    const deployment = await promptSelect(
      '🌐 Where do you want to deploy? (PR Welcome)',
      DEPLOYMENT_OPTIONS,
    )
    selections.deployment = deployment

    if (deployment === 'cloudflare') {
      const cloudflare = await consola.prompt('☁️ Give your Worker a name:', {
        placeholder: 'my-nuxt-site',
      })
      selections.cloudflare = cloudflare
    }

    consola.success('Configuration complete! Setting up your project...\n')

    // Step 5: Modify files based on selections
    await modifyFiles(selections)

    // Step 6: Update configuration files
    consola.start('⚙️ Updating configuration...')

    // Update nuxt.config.ts
    await updateNuxtConfig(selections)

    consola.success('Configuration updated!')

    // Step 7: Generate environment files
    await generateEnvFiles(selections)

    // Step 4: Install packages
    await installPackages(selections)

    // prompt to delete template folder
    const deleteTemplates = await consola.prompt('🧹 Do you want to delete `./.nuxt_ultra` and `./setup.js` to clean up?', {
      type: 'confirm',
    })

    if (deleteTemplates) {
      consola.start('Removing nuxt_ultra folder...')
      const templateDir = resolve('./.nuxt_ultra')
      const setupScript = resolve('./setup.js')

      try {
        if (existsSync(templateDir))
          rmSync(templateDir, { recursive: true, force: true })
        consola.success('nuxt_ultra folder deleted!')
      }
      catch (error) {
        consola.warn(`Could not delete nuxt_ultra folder automatically: ${error.message}`)
      }

      try {
        if (existsSync(setupScript))
          rmSync(setupScript, { force: true })
      }
      catch (error) {
        consola.warn(`Could not delete setup.js automatically: ${error.message}`)
      }
    }

    consola.success('🎉 Setup complete!')
    consola.info('Run `npm run dev` to start your development server')
  }
  catch (error) {
    consola.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function modifyFiles(selections) {
  consola.start('📁 Copying template files...')

  if (selections.features.includes('ai')) {
    let aiFile = readFileSync(resolve('./.nuxt_ultra/server/utils/ai.ts'), 'utf8')
    // replace place holders in .nuxt_ultra/server/utils/ai.ts
    for (const provider of selections['ai_method']) {
      if (provider === 'openai') {
        aiFile = aiFile.replace('// %%OpenAIClient%%', `export const gpt = new OpenAI({
  apiKey: openaiApiKey,
  baseURL: 'https://api.openai.com/v1',
})`)
        aiFile = aiFile.replace('// %%openAIKey%%', `openaiApiKey,`)
      }

      if (provider === 'xai') {
        aiFile = aiFile.replace('// %%xAIClient%%', `export const grok = new OpenAI({
          apiKey: xaiApiKey,
          baseURL: 'https://api.x.ai/v1',
          })`)
        aiFile = aiFile.replace('// %%xAIKey%%', `xaiApiKey,`)
      }

      if (provider === 'claude') {
        aiFile = aiFile.replace('// %%ClaudeClient%%', `export const claude = new OpenAI({
            apiKey: claudeApiKey,
            baseURL: 'https://api.anthropic.com/v1',
            })`)
        aiFile = aiFile.replace('// %%claudeKey%%', `claudeApiKey,`)
      }

      if (provider === 'gemini') {
        aiFile = aiFile.replace('// %%GeminiClient%%', `export const gemini = new OpenAI({
              apiKey: geminiApiKey,
              baseURL: 'https://generativelanguage.googleapis.com/v1beta',
              })`)
        aiFile = aiFile.replace('// %%geminiKey%%', `geminiApiKey,`)
      }
    }
    aiFile = aiFile.replace(
      /\/\/ %%.*?%%/g,
      '',
    )
  }
  else {
    // add .nuxt_ultra/server/utils/ai.ts if exists
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/server/utils/ai.ts')
  }

  if (selections.features.includes('@nuxtjs/i18n')) {
    if (selections['@nuxtjs/i18n_method'] === 'files') {
      let i18nConfig = readFileSync(resolve('./.nuxt_ultra/i18n/i18n-local/i18n.config.ts'), 'utf8')
      i18nConfig = i18nConfig.replace('%%defaultLocale%%', selections.info.defaultLocale)
      i18nConfig = i18nConfig.replace('%%siteUrl%%', selections.info.siteUrl)
      if (!existsSync(resolve('./', 'i18n'))) {
        mkdirSync(resolve('./', 'i18n/locales'), { recursive: true })
      }
      writeFileSync(resolve('./', 'i18n/i18n.config.ts'), i18nConfig)
      // copy locale files
      cpSync(
        resolve('./.nuxt_ultra/i18n/i18n-local/locales'),
        resolve('./', 'i18n/locales'),
        { recursive: true },
      )
    }

    if (selections['@nuxtjs/i18n_method'] === 'supabase') {
      let i18nConfig = readFileSync(resolve('./.nuxt_ultra/i18n/i18n-supabase/i18n.config.ts'), 'utf8')
      i18nConfig = i18nConfig.replace('%%defaultLocale%%', selections.info.defaultLocale)
      i18nConfig = i18nConfig.replace('%%siteUrl%%', selections.info.siteUrl)
      if (!existsSync(resolve('./', 'i18n'))) {
        mkdirSync(resolve('./', 'i18n/locales'), { recursive: true })
      }
      writeFileSync(resolve('./', 'i18n/i18n.config.ts'), i18nConfig)
      cpSync(
        resolve('./.nuxt_ultra/i18n/i18n-remote/locales'),
        resolve('./', 'i18n/locales'),
        { recursive: true },
      )
      cpSync(
        resolve('./.nuxt_ultra/server/api/v1/locales'),
        resolve('./server/api/v1/locales'),
        { recursive: true },
      )
    }

    cpSync(
      resolve('./.nuxt_ultra/app/components/LocaleSwitch.vue'),
      resolve('./app/components/LocaleSwitch.vue'),
      { recursive: true },
    )
    cpSync(
      resolve('./.nuxt_ultra/shared/utils/index.ts'),
      resolve('./shared/utils/index.ts'),
      { recursive: true },
    )
  }
  else {
    // add .nuxt_ultra/i18n to ignore list
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/i18n')
  }

  if (selections.features.includes('@nuxtjs/supabase')) {
    cpSync(
      resolve('./.nuxt_ultra/app/components/StarsBg.vue'),
      resolve('./app/components/StarsBg.vue'),
      { recursive: true },
    )
    if (selections.features.includes('dashboard')) {
      cpSync(
        resolve('./.nuxt_ultra/app/layouts/dashboard.vue'),
        resolve('./app/layouts/dashboard.vue'),
        { recursive: true },
      )
      cpSync(
        resolve('./.nuxt_ultra/app/layouts/auth.vue'),
        resolve('./app/layouts/auth.vue'),
        { recursive: true },
      )
      cpSync(
        resolve('./.nuxt_ultra/app/pages'),
        resolve('./app/pages'),
        { recursive: true },
      )
      cpSync(
        resolve('./.nuxt_ultra/shared/types/database.types.ts'),
        resolve('./shared/types/database.types.ts'),
        { recursive: true },
      )
    }
  }
  else {
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/app/components/StarsBg.vue')
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/app/layouts')
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/app/pages')
  }

  if (selections.features.includes('cloudflare-r2')) {
    cpSync(
      resolve('./.nuxt_ultra/server/api/upload.put.ts'),
      resolve('./server/api/upload.put.ts'),
      { recursive: true },
    )
  }
  else {
    IGNORE_TRANSFER_FILES.push('./.nuxt_ultra/server/api/upload.put.ts')
  }
}

async function updateNuxtConfig(selections) {
  const nuxtConfigPath = resolve('./.nuxt_ultra', 'nuxt.config.ts')
  let nuxtConfig = readFileSync(nuxtConfigPath, 'utf8')

  // Add modules based on selections

  if (selections.features.includes('@nuxtjs/i18n')) {
    // Add i18n import and config
    nuxtConfig = nuxtConfig.replace(
      /%%i18nModule%%/,
      '\'@nuxtjs/i18n\',',
    )
    nuxtConfig = nuxtConfig.replace(
      /\/\/ %%i18nImport%%/,
      'import i18nConfig from \'./i18n/i18n.config\'\n\n',
    )
    nuxtConfig = nuxtConfig.replace(
      /%%i18nConfig%%/,
      'i18n: i18nConfig,',
    )
  }

  if (selections.features.includes('@nuxtjs/seo')) {
    nuxtConfig = nuxtConfig.replace(
      /%%seoModule%%/,
      '\'@nuxtjs/seo\',',
    )
    nuxtConfig = nuxtConfig.replace(
      /%%ogImage%%/,
      `ogImage: {
    zeroRuntime: true,
  },`,
    )
    nuxtConfig = nuxtConfig.replace(
      /%%siteUrl%%/,
      selections.info.siteUrl,
    )
    nuxtConfig = nuxtConfig.replace(
      /%%siteName%%/,
      selections.info.siteName,
    )
  }

  if (selections.features.includes('@nuxtjs/supabase')) {
    nuxtConfig = nuxtConfig.replace(
      /%%supabaseModule%%/,
      '\'@nuxtjs/supabase\',',
    )
    nuxtConfig = nuxtConfig.replace(
      /%%supabaseConfig%%/,
      `supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/dashboard(/*)?'],
      saveRedirectToCookie: true,
    },
    cookiePrefix: 'sb',
    types: '#shared/types/database.types.ts',
  },`,
    )
  }

  if (selections.features.includes('cloudflare-r2')) {
    nuxtConfig = nuxtConfig.replace(
      /%%R2%%/,
      `s3Api: '',
    r2SecretAccessKey: '',
    r2AccessKeyId: '',`,
    )
    nuxtConfig = nuxtConfig.replace(
      /%%storageConfig%%/,
      `storage: {
      r2: {
        driver: 's3',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        endpoint: process.env.S3_API || '',
        bucket: process.env.R2_BUCKET || '',
        region: 'auto',
      },
    },`,
    )
  }

  // Add deployment-specific config
  if (selections.deployment === 'cloudflare') {
    nuxtConfig = nuxtConfig.replace(
      /%%cloudflareConfig%%/,
      `preset: 'cloudflare-module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: ${selections.cloudflare},
        main: './.output/server/index.mjs',
        compatibility_date: '2025-09-28',
        assets: {
          binding: 'ASSETS',
          directory: './.output/public/',
          html_handling: 'drop-trailing-slash',
        },
        observability: {
          enabled: true,
        },
      },
    },`,
    )
  }

  writeFileSync(resolve('./nuxt.config.ts'), nuxtConfig)
}

async function generateEnvFiles(selections) {
  consola.start('🔧 Generating environment files...')

  const envVars = {}

  if (selections.features.includes('@nuxtjs/i18n')) {
    envVars['NUXT_PUBLIC_I18N_BASE_URL'] = selections.info.siteUrl
  }

  if (selections.features.includes('@nuxtjs/seo')) {
    envVars['NUXT_SITE_URL'] = selections.info.siteUrl
    envVars['NUXT_SITE_NAME'] = selections.info.siteName
    envVars['NUXT_SITE_DESCRIPTION'] = selections.info.siteDescription
  }

  // Add feature-specific env vars
  if (selections.features.includes('@nuxtjs/supabase')) {
    envVars['SUPABASE_URL'] = 'your_supabase_url'
    envVars['SUPABASE_KEY'] = 'your_supabase_anon_key'
    envVars['SUPABASE_SECRET_KEY'] = 'your_supabase_secret_key'
    envVars['SUPABASE_TOKEN'] = 'your_supabase_token'
    envVars['SUPABASE_PROJECT_ID'] = 'your_supabase_project_id'
  }

  if (selections.features.includes('ai')) {
    const aiProviders = selections['ai_method'] || []
    const providers = Array.isArray(aiProviders) ? aiProviders : [aiProviders]

    for (const provider of providers) {
      if (provider === 'openai') {
        envVars['NUXT_OPENAI_API_KEY'] = 'your_openai_api_key'
      }
      else if (provider === 'xai') {
        envVars['NUXT_XAI_API_KEY'] = 'your_xai_api_key'
      }
      else if (provider === 'claude') {
        envVars['NUXT_CLAUDE_API_KEY'] = 'your_claude_api_key'
      }
      else if (provider === 'gemini') {
        envVars['NUXT_GEMINI_API_KEY'] = 'your_gemini_api_key'
      }
    }
  }

  if (selections.features.includes('cloudflare-r2')) {
    envVars['NUXT_S3_API'] = 'your_s3_api_endpoint'
    envVars['NUXT_R2_ACCESS_KEY_ID'] = 'your_r2_access_key'
    envVars['NUXT_R2_SECRET_ACCESS_KEY'] = 'your_r2_secret_key'
    envVars['NUXT_R2_BUCKET'] = 'your_r2_bucket_name'
    envVars['NUXT_R2_DOMAIN'] = 'your_r2_domain'
  }

  // Generate .env.local with additional PORT variable
  const envLocalVars = { ...envVars, PORT: selections.info.devPort }
  const envLocal = Object.entries(envLocalVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  writeFileSync(resolve('./', '.env.local'), envLocal + '\n')

  // Generate .env.production template
  const envProduction = Object.entries(envVars)
    .map(([key, value]) => `${key}=${key.includes('localhost') ? 'https://your-domain.com' : value}`)
    .join('\n')

  writeFileSync(resolve('./', '.env.production'), envProduction + '\n')

  consola.success('Environment files generated!')
}

async function installPackages(selections) {
  consola.start('📦 Installing packages...')
  const packageJsonPath = resolve('./', 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  // Add Supabase db script if Supabase is selected
  if (selections.features.includes('@nuxtjs/supabase')) {
    packageJson.scripts.db = 'npx dotenv -e .env.local -- powershell -Command "npx supabase login --token $env:SUPABASE_TOKEN ; npx supabase gen types --lang=typescript --project-id $env:SUPABASE_PROJECT_ID > ./shared/types/database.types.ts"'
  }

  if (selections.deployment === 'cloudflare') {
    packageJson.scripts.deploy = 'wrangler deploy'
    packageJson.scripts.secrets = 'grep -v \'^#\' .env.production | while IFS=\'=\' read -r k v; do [[ -n "$k" ]] && wrangler secret put "$k" --env production <<< "$v"; done'
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

  const packagesToInstall = []

  for (const feature of selections.features) {
    const config = FEATURES[feature]
    if (config.package) {
      packagesToInstall.push(config.package)
    }

    // AI providers use single OpenAI package - already handled above via config.package
  }

  if (packagesToInstall.length > 0) {
    consola.info(`Installing: ${packagesToInstall.join(', ')}`)
    execSync(`npm install ${packagesToInstall.join(' ')}`, {
      cwd: './',
      stdio: 'inherit',
    })
  }

  if (selections.deployment === 'cloudflare') {
    consola.info('Installing Cloudflare Wrangler for deployment...')
    execSync(`npm install -D wrangler`, {
      cwd: './',
      stdio: 'inherit',
    })
  }

  consola.success('Packages installed!')
}
// Run the setup
main().catch(consola.error)
