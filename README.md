<div align='center'>
<h1>Nuxt Ultra - Starter Template</h1>
<img src='https://nuxt.com/assets/design-kit/icon-green.svg' alt='Nuxt3 Ultra - Opinionated Nuxt 3 Starter Template' width='344'/>
</div>

<p align='center'>
Develop your next full stack web app with <b>Nuxt Ultra</b><br>
</p>

## Modules

### This template comes with the following modules:

- @nuxt/ui - [Documentation](https://ui.nuxt.com/) 
- @nuxt/eslint - [Documentation](https://eslint.nuxt.com/)
- @nuxtjs/seo - [Documentation](https://nuxtseo.com/nuxt-seo/getting-started/installation)
- @nuxtjs/supabase - [Documentation](https://supabase.nuxtjs.org/)
- @nuxtjs/i18n - [Documentation](https://i18n.nuxtjs.org/)

### Core Features

- @nuxt/ui - Modern UI components
- @nuxt/eslint - Code linting
- @nuxtjs/seo - SEO optimization  
- @nuxtjs/supabase - DB and Auth
- @nuxtjs/i18n - Internationalization

### Optional modules with pre configuration (via `npm run setup`)

Choose from these optional integrations:
- **Internationalization** - Multi-language support
- **Supabase** - Backend-as-a-Service with authentication
- **Zod** - Schema validation
- **Dashboard** - Admin interface with authentication
- **AI Integration** - OpenAI, xAI, Gemini, or Claude
- **Cloudflare R2** - Object storage
- **Cloudflare Workers Deployment** - Easy deployment to Cloudflare Workers

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more about Nuxt.

## Setup

1. **Install dependencies:**

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

2. **Interactive Setup:**

Run the interactive setup to configure your project with the features you need:

```bash
# npm
npm run setup

# pnpm
pnpm run setup

# yarn
yarn setup
```

This will guide you through selecting optional features like:
- 🌍 Internationalization (i18n)  
- 📝 Nuxt SEO
- 🗄️ Supabase Backend
- 📝 Zod Schema Validation
- 📊 Dashboard & Authentication
- 🤖 AI Integration (OpenAI, xAI, Gemini, Claude)
- 📁 Cloudflare R2 Storage
- ☁️ Cloudflare Workers Deployment

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

## Build for Production 

Nitro config is already setup to handle most common cases by using hybrid rendering. for example:
- if you use server folder it will build a server app and prerender the rest of the pages. (SSR + SSG).
- if you don't use server folder it will build a static app by prerendering all the pages (SSG). the build command will be same as running `nuxt generate`.

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build
```

## Deployment

### Cloudflare Workers (Default)

Make sure you have configured your Cloudflare wrangler config in `nuxt.config.ts` file.
To deploy your Nuxt application to Cloudflare Workers, you can use the following command:

```bash
# npm
npm run deploy

# pnpm
pnpm run deploy

# yarn
yarn deploy
```

### How to deploy on modern hosting (Vercel, Netlify, etc.)

Nuxt and Nitro support many modern hosting providers with zero configuration. 
Look at the [Nuxt documentation](https://nuxt.com/deploy) to learn more about presets.

### How to deploy on traditional hosting (Plesk, cPanel, etc.)

1. Remove `nitro.preset : cloudflare-module` and `nitro.cloudflare` specific settings from `nuxt.config.ts` file.
2. Uninstall `wrangler` package from your project by running `npm uninstall wrangler` or `yarn remove wrangler` or `pnpm remove wrangler`.
3. follow the instructions below based on your rendering mode:

#### SPA or SSG (Static Site Generation)

After you run the `build` command, you will have a `.output` folder that contains `public`, `server` and a `nitro.json`. All you need is to copy the folders and files inside the `.output/public` and paste it in your domain directory to deploy your application.

#### SSR (Server Side Rendering)

After you run the `build` command, you will have a `.output` folder that contains `public`, `server` and a `nitro.json`. To deploy and run your application: 

1. You need to enable node extension on your hosting and domain.
2. Transfer `.output/**` folder to your domain directory.
3. create a startup `index.js` or `main.js` or `entry.js` file in your domain directory along side with `public` and `server` directory with the following content:

```js
import('./.output/server/index.mjs');
```

4. configure node extension settings: 
- set Application startup file to the file you created in step 3 e.g. `index.js` 
- set `Document Root` to `./public` folder. (usually it's `/httpdocs/public` for top level domain)
- set Application mode to `production`
- set Application Root to your domain directory e.g. `/httpdocs`
- Enable Node.js
You don't need to `npm install` or `Run script` because all the dependencies are already bundled in the `.output/server` folder.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
