# Auth Feature: nuxt-auth-utils

## Condition
Apply when Auth is `nuxt-auth-utils`. Requires a DB (`@nuxtjs/supabase` or `nuxt-postgrest`), UI `@nuxt/ui` and Validation `zod` (added automatically).

Design (mirrors the production pattern):
- Sessions are sealed cookies managed by the module. Route protection is a **global middleware** keyed on Nuxt route groups: pages under `app/pages/(protected)/` require a session, pages under `app/pages/(guest)/` redirect away when logged in. Nuxt 4 exposes the group names as `to.meta.groups`.
- A `users` row can have several `credentials` rows (`email` password, `github`, `google`), so the same person can log in with any of them.
- Email + password registration sends a 6-digit OTP; login is refused until the email is confirmed. Forgot/reset password works through a one-hour token link. Both need the email helper below. If `emailProvider` is `none`, registration auto-confirms and the forgot/reset pages are skipped.
- "Remember me" extends the cookie to 400 days (the browser cap). Sessions without it hard-expire after one day.
- Error messages for login and register are deliberately vague to prevent user enumeration.

## File Updates

### Path: nuxt.config.ts
Add to `modules`:
```ts
'nuxt-auth-utils',
```

Add to `runtimeConfig` (private). Include only selected OAuth providers; omit `oauth` if none. Include the email keys only when `emailProvider` is `resend`.
```ts
oauth: {
  github: { clientId: '', clientSecret: '' },
  google: { clientId: '', clientSecret: '' },
},
// `nuxt dev --host` serves plain http on a LAN IP; a Secure cookie would never be set there.
session: {
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
},
resendApiKey: '',
emailFrom: '',
```

### Path: shared/types/auth.d.ts
```ts
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string
  }

  interface UserSession {
    loggedInAt: number
    /** "Remember me" was checked: cookie is long-lived and the 1-day hard expiry is skipped. */
    remember?: boolean
    /** Only when DB is nuxt-postgrest: user-scoped JWT for RLS queries. */
    postgrestToken?: string
  }
}

export {}
```

### Path: shared/utils/auth-schemas.ts
```ts
import { z } from 'zod'

export const emailSchema = z.email('Enter a valid email address')
export const passwordSchema = z.string().min(8, 'Must be at least 8 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const otpSchema = z.object({
  credentialId: z.uuid(),
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({
  credentialId: z.uuid(),
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginInput = z.output<typeof loginSchema>
export type RegisterInput = z.output<typeof registerSchema>
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>
```

### Path: SQL (tell the user to run it)
```sql
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.credentials (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  provider         text not null,          -- 'email' | 'github' | 'google'
  provider_id      text not null,          -- the email address, or the OAuth subject id
  password_hash    text,
  email_confirmed  boolean not null default false,
  otp              text,
  otp_expires_at   timestamptz,
  reset_token      text,
  reset_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (provider, provider_id)
);
```
Then run `npm run db:types`. With `nuxt-postgrest`, also run `NOTIFY pgrst, 'reload schema';` and make sure the service role can read/write both tables.

### Path: server/utils/db.ts
Admin database handle used by the auth routes. Pick the variant for the selected DB.

**DB is `@nuxtjs/supabase`:**
```ts
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database.types'

/** Service-role client (bypasses RLS). Server only. */
export function useDb(event: H3Event) {
  return serverSupabaseServiceRole<Database>(event)
}
```

**DB is `nuxt-postgrest`:**
```ts
import type { H3Event } from 'h3'

/** Service-role client (bypasses RLS). Server only. */
export function useDb(_event?: H3Event) {
  return usePostgrestAdmin()
}
```

### Path: server/utils/email.ts
Only when `emailProvider` is `resend`. Resend is a plain HTTPS API, so it runs on Cloudflare Workers too.
```ts
export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(input: SendEmailInput) {
  const { resendApiKey, emailFrom } = useRuntimeConfig()

  if (!resendApiKey) {
    // Dev fallback so the flow is testable before the key exists.
    console.warn(`[email] RESEND key missing. To: ${input.to} | ${input.subject}\n${input.text}`)
    return
  }

  await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}` },
    body: { from: emailFrom, to: input.to, subject: input.subject, text: input.text, html: input.html },
  })
}

export function otpEmail(otp: string, minutes: number) {
  return {
    subject: 'Your verification code',
    text: `Your verification code is ${otp}. It expires in ${minutes} minutes. If you didn't request this, ignore this email.`,
    html: `<p>Your verification code is</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${otp}</p><p>It expires in ${minutes} minutes.</p>`,
  }
}

export function resetPasswordEmail(link: string) {
  return {
    subject: 'Reset your password',
    text: `We received a request to reset your password. Open this link to choose a new one:\n\n${link}\n\nIt expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${link}">Choose a new password</a></p><p>The link expires in 1 hour.</p>`,
  }
}
```

### Path: server/utils/auth.ts
Shared helpers for every auth route.
```ts
import type { H3Event } from 'h3'
import type { Database } from '#shared/types/database.types'

type UserRow = Database['public']['Tables']['users']['Row']
type CredentialRow = Database['public']['Tables']['credentials']['Row']

/** Browsers cap cookie Max-Age at 400 days; this is the closest thing to "never expires". */
export const REMEMBER_ME_MAX_AGE = 400 * 24 * 60 * 60
export const OTP_MINUTES = 10
export const RESET_MINUTES = 60

/** Deliberately vague so responses do not reveal whether an email exists. */
export const invalidCredentials = () => createError({ statusCode: 422, message: 'Invalid credentials' })

export function genOtp(length = 6) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), n => String(n % 10)).join('')
}

export function genToken() {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export async function findCredential(event: H3Event, provider: string, providerId: string) {
  const { data } = await useDb(event)
    .from('credentials')
    .select('*')
    .eq('provider', provider)
    .eq('provider_id', providerId)
    .maybeSingle()
  return data
}

export async function getUser(event: H3Event, id: string) {
  const { data } = await useDb(event).from('users').select('*').eq('id', id).maybeSingle()
  return data
}

/** Creates the users row if the email is new, then the credential. Returns null on duplicate credential. */
export async function createUserWithCredential(event: H3Event, input: {
  name: string
  email: string
  avatar?: string
  provider: string
  providerId: string
  passwordHash?: string
  emailConfirmed: boolean
  otp?: string
}) {
  const db = useDb(event)

  let { data: user } = await db.from('users').select('*').eq('email', input.email).maybeSingle()
  if (!user) {
    const { data, error } = await db
      .from('users')
      .insert({ name: input.name, email: input.email, avatar_url: input.avatar })
      .select('*')
      .single()
    if (error) throw createError({ statusCode: 500, message: error.message })
    user = data
  }

  const { data: credential, error } = await db
    .from('credentials')
    .insert({
      user_id: user.id,
      provider: input.provider,
      provider_id: input.providerId,
      password_hash: input.passwordHash,
      email_confirmed: input.emailConfirmed,
      otp: input.otp,
      otp_expires_at: input.otp ? minutesFromNow(OTP_MINUTES) : null,
    })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') return null // unique violation: credential already exists
    throw createError({ statusCode: 500, message: error.message })
  }

  return { user, credential }
}

/** Builds the session payload and writes the cookie. The only place that calls setUserSession. */
export async function signIn(event: H3Event, user: UserRow, options: { remember?: boolean } = {}) {
  const session = {
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar_url ?? undefined },
    loggedInAt: Date.now(),
    ...(options.remember ? { remember: true } : {}),
    // DB is nuxt-postgrest: uncomment so usePostgrest()/usePostgrestUser() run as this user under RLS.
    // postgrestToken: await mintPostgrestToken({ sub: user.id }, options.remember ? REMEMBER_ME_MAX_AGE : 24 * 60 * 60),
  }
  await setUserSession(event, session, options.remember ? { maxAge: REMEMBER_ME_MAX_AGE } : undefined)
}

export type { CredentialRow, UserRow }
```

### Path: server/api/auth/register.post.ts
```ts
export default defineEventHandler(async (event) => {
  const { name, email, password } = await readValidatedBody(event, registerSchema.parse)

  const hasEmail = !!useRuntimeConfig().resendApiKey || process.env.NODE_ENV !== 'production'
  const otp = hasEmail ? genOtp() : undefined

  const created = await createUserWithCredential(event, {
    name,
    email,
    provider: 'email',
    providerId: email,
    passwordHash: await hashPassword(password),
    emailConfirmed: !hasEmail,
    otp,
  })
  if (!created) throw invalidCredentials()

  if (!hasEmail) {
    await signIn(event, created.user)
    return { confirmed: true }
  }

  await sendEmail({ to: email, ...otpEmail(otp!, OTP_MINUTES) })
  return { confirmed: false, credentialId: created.credential.id }
})
```
If `emailProvider` is `none`, replace the body with: create the credential with `emailConfirmed: true`, call `signIn`, return `{ confirmed: true }`, and drop the `hasEmail` branch.

### Path: server/api/auth/confirm-otp.post.ts
Only when `emailProvider` is `resend`.
```ts
export default defineEventHandler(async (event) => {
  const { credentialId, otp } = await readValidatedBody(event, otpSchema.parse)
  const db = useDb(event)

  const { data: credential } = await db.from('credentials').select('*').eq('id', credentialId).maybeSingle()
  if (!credential || !credential.otp || credential.otp !== otp || !credential.otp_expires_at) {
    throw createError({ statusCode: 422, message: 'Invalid code' })
  }

  if (new Date(credential.otp_expires_at) <= new Date()) {
    const fresh = genOtp()
    await db.from('credentials').update({ otp: fresh, otp_expires_at: minutesFromNow(OTP_MINUTES) }).eq('id', credential.id)
    await sendEmail({ to: credential.provider_id, ...otpEmail(fresh, OTP_MINUTES) })
    throw createError({ statusCode: 422, message: 'Code expired. We sent you a new one.' })
  }

  await db.from('credentials').update({ email_confirmed: true, otp: null, otp_expires_at: null }).eq('id', credential.id)

  const user = await getUser(event, credential.user_id)
  if (!user) throw createError({ statusCode: 500, message: 'User not found' })

  await signIn(event, user)
  return { ok: true }
})
```

### Path: server/api/auth/login.post.ts
```ts
export default defineEventHandler(async (event) => {
  const { email, password, remember } = await readValidatedBody(event, loginSchema.parse)

  const credential = await findCredential(event, 'email', email)
  if (!credential?.password_hash) throw invalidCredentials()

  if (!credential.email_confirmed) {
    // Client switches to the OTP view. A fresh code is sent so an abandoned signup can resume.
    const otp = genOtp()
    await useDb(event).from('credentials').update({ otp, otp_expires_at: minutesFromNow(OTP_MINUTES) }).eq('id', credential.id)
    await sendEmail({ to: email, ...otpEmail(otp, OTP_MINUTES) })
    return { confirmed: false, credentialId: credential.id }
  }

  if (!(await verifyPassword(credential.password_hash, password))) throw invalidCredentials()

  const user = await getUser(event, credential.user_id)
  if (!user) throw createError({ statusCode: 500, message: 'User not found' })

  await signIn(event, user, { remember })
  return { confirmed: true }
})
```
If `emailProvider` is `none`, delete the `email_confirmed` block.

### Path: server/api/auth/forgot-password.post.ts
Only when `emailProvider` is `resend`.
```ts
export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, forgotPasswordSchema.parse)

  // Same response whether or not the email exists.
  const credential = await findCredential(event, 'email', email)
  if (credential) {
    const token = genToken()
    await useDb(event)
      .from('credentials')
      .update({ reset_token: token, reset_expires_at: minutesFromNow(RESET_MINUTES) })
      .eq('id', credential.id)

    const link = `${getRequestURL(event).origin}/reset-password?c=${credential.id}&t=${token}`
    await sendEmail({ to: email, ...resetPasswordEmail(link) })
  }

  return { ok: true }
})
```

### Path: server/api/auth/reset-password.post.ts
Only when `emailProvider` is `resend`.
```ts
export default defineEventHandler(async (event) => {
  const { credentialId, token, password } = await readValidatedBody(event, resetPasswordSchema.parse)
  const db = useDb(event)

  const { data: credential } = await db.from('credentials').select('*').eq('id', credentialId).maybeSingle()
  if (!credential || !credential.reset_token || credential.reset_token !== token || !credential.reset_expires_at
    || new Date(credential.reset_expires_at) <= new Date()) {
    throw createError({ statusCode: 422, message: 'Invalid or expired reset link' })
  }

  await db.from('credentials').update({
    password_hash: await hashPassword(password),
    email_confirmed: true,
    reset_token: null,
    reset_expires_at: null,
  }).eq('id', credential.id)

  const user = await getUser(event, credential.user_id)
  if (!user) throw createError({ statusCode: 500, message: 'User not found' })

  await signIn(event, user)
  return { ok: true }
})
```

### Path: server/routes/auth/github.get.ts
Only if `github` was selected. Callback URL to register at GitHub: `<origin>/auth/github`.
```ts
export default defineOAuthGitHubEventHandler({
  config: { emailRequired: true },
  async onSuccess(event, { user: gh }) {
    const providerId = String(gh.id)
    let credential = await findCredential(event, 'github', providerId)

    if (!credential) {
      const created = await createUserWithCredential(event, {
        name: gh.name || gh.login,
        email: gh.email,
        avatar: gh.avatar_url,
        provider: 'github',
        providerId,
        emailConfirmed: true,
      })
      credential = created?.credential ?? null
    }
    if (!credential) return sendRedirect(event, '/login?error=oauth')

    const user = await getUser(event, credential.user_id)
    if (!user) return sendRedirect(event, '/login?error=oauth')

    await signIn(event, user, { remember: true })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('[auth] GitHub OAuth failed', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
```

### Path: server/routes/auth/google.get.ts
Only if `google` was selected. Redirect URI to register at Google: `<origin>/auth/google`.
```ts
export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: g }) {
    let credential = await findCredential(event, 'google', g.sub)

    if (!credential) {
      const created = await createUserWithCredential(event, {
        name: g.name,
        email: g.email,
        avatar: g.picture,
        provider: 'google',
        providerId: g.sub,
        emailConfirmed: true,
      })
      credential = created?.credential ?? null
    }
    if (!credential) return sendRedirect(event, '/login?error=oauth')

    const user = await getUser(event, credential.user_id)
    if (!user) return sendRedirect(event, '/login?error=oauth')

    await signIn(event, user, { remember: true })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('[auth] Google OAuth failed', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
```

### Path: app/middleware/auth.global.ts
```ts
const ONE_DAY = 24 * 60 * 60 * 1000

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, session, clear } = useUserSession()
  const groups = to.meta.groups ?? []
  const isProtected = groups.includes('protected')
  const isGuestOnly = groups.includes('guest')

  if (isProtected && !loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Sessions without "remember me" hard-expire after a day.
  if (isProtected && loggedIn.value && !session.value?.remember
    && session.value?.loggedInAt && session.value.loggedInAt <= Date.now() - ONE_DAY) {
    await clear()
    return navigateTo('/login')
  }

  if (isGuestOnly && loggedIn.value) {
    return navigateTo('/')
  }
})
```

### Path: app/composables/useAuth.ts
Provider-agnostic surface used by the dashboard feature.
```ts
export function useAuth() {
  const { user, loggedIn, clear, fetch: refresh } = useUserSession()

  const displayName = computed(() => user.value?.name || user.value?.email || '')
  const avatar = computed(() => user.value?.avatar)

  async function logout() {
    await clear()
    await navigateTo('/login')
  }

  return { user, loggedIn, displayName, avatar, refresh, logout }
}
```

### Path: app/layouts/auth.vue
```vue
<template>
  <div class="relative flex min-h-screen items-center justify-center p-4">
    <div class="absolute left-1/2 top-0 size-40 -translate-x-1/2 rounded-full blur-[120px] sm:size-64 dark:bg-primary/40" />

    <CommonLogo class="absolute top-6 left-6" />
    <CommonColorModeButton class="absolute top-6 right-6" />

    <UPageCard
      variant="subtle"
      class="w-full max-w-sm"
    >
      <slot />
    </UPageCard>
  </div>
</template>
```

### Path: app/components/auth/Otp.vue
Only when `emailProvider` is `resend`.
```vue
<script setup lang="ts">
const props = defineProps<{ credentialId: string }>()

const { refresh } = useAuth()
const route = useRoute()
const otp = ref<string[]>([])
const loading = ref(false)
const errorMessage = ref('')

async function confirm() {
  const code = otp.value.join('')
  if (code.length !== 6) return
  loading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/confirm-otp', { method: 'POST', body: { credentialId: props.credentialId, otp: code } })
    await refresh()
    await navigateTo((route.query.redirect as string) || '/')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Invalid code'
    otp.value = []
  }
  finally {
    loading.value = false
  }
}

watch(otp, v => v.join('').length === 6 && confirm())
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center">
    <div>
      <h2 class="text-lg font-semibold">
        Check your email
      </h2>
      <p class="text-muted text-sm">
        Enter the 6-digit code we sent you.
      </p>
    </div>

    <UPinInput
      v-model="otp"
      :length="6"
      otp
      autofocus
      dir="ltr"
    />

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="errorMessage"
    />

    <UButton
      label="Confirm"
      block
      :loading="loading"
      @click="confirm"
    />
  </div>
</template>
```

### Path: app/pages/(guest)/login.vue
Generate `providers` only for selected OAuth providers; drop the array and prop if none. Drop the OTP view and the forgot link when `emailProvider` is `none`.
```vue
<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { LoginInput } from '#shared/utils/auth-schemas'

definePageMeta({
  layout: 'auth',
  title: 'Sign in',
})

const route = useRoute()
const { refresh } = useAuth()
const loading = ref(false)
const credentialId = ref('')
const errorMessage = ref(route.query.error === 'oauth' ? 'Social sign-in failed. Try again.' : '')

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
  { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', required: true },
  { name: 'remember', type: 'checkbox', label: 'Remember me' },
]

const providers = [
  { label: 'Continue with Google', icon: 'i-simple-icons-google', to: '/auth/google', external: true },
  { label: 'Continue with GitHub', icon: 'i-simple-icons-github', to: '/auth/github', external: true },
]

async function onSubmit(payload: FormSubmitEvent<LoginInput>) {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch('/api/auth/login', { method: 'POST', body: payload.data })
    if (!res.confirmed) {
      credentialId.value = res.credentialId
      return
    }
    await refresh()
    await navigateTo((route.query.redirect as string) || '/')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Invalid credentials'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthOtp
    v-if="credentialId"
    :credential-id="credentialId"
  />

  <UAuthForm
    v-else
    :fields="fields"
    :schema="loginSchema"
    :providers="providers"
    title="Welcome back"
    icon="i-lucide-lock"
    :submit="{ label: 'Sign in', color: 'primary', loading }"
    @submit="onSubmit"
  >
    <template #description>
      Don't have an account?
      <NuxtLink
        to="/register"
        class="text-primary font-medium"
      >Sign up</NuxtLink>.
    </template>

    <template #password-hint>
      <NuxtLink
        to="/forgot-password"
        class="text-primary text-sm font-medium"
      >Forgot password?</NuxtLink>
    </template>

    <template #footer>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorMessage"
      />
    </template>
  </UAuthForm>
</template>
```

### Path: app/pages/(guest)/register.vue
```vue
<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { RegisterInput } from '#shared/utils/auth-schemas'

definePageMeta({
  layout: 'auth',
  title: 'Create an account',
})

const { refresh } = useAuth()
const loading = ref(false)
const credentialId = ref('')
const errorMessage = ref('')

const fields: AuthFormField[] = [
  { name: 'name', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true, autocomplete: 'email' },
  { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', required: true, autocomplete: 'new-password' },
  { name: 'confirmPassword', type: 'password', label: 'Confirm password', placeholder: '••••••••', required: true, autocomplete: 'new-password' },
]

async function onSubmit(payload: FormSubmitEvent<RegisterInput>) {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch('/api/auth/register', { method: 'POST', body: payload.data })
    if (!res.confirmed) {
      credentialId.value = res.credentialId
      return
    }
    await refresh()
    await navigateTo('/')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Could not create your account'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthOtp
    v-if="credentialId"
    :credential-id="credentialId"
  />

  <UAuthForm
    v-else
    :fields="fields"
    :schema="registerSchema"
    title="Create an account"
    icon="i-lucide-user-plus"
    :submit="{ label: 'Sign up', color: 'primary', loading }"
    @submit="onSubmit"
  >
    <template #description>
      Already have an account?
      <NuxtLink
        to="/login"
        class="text-primary font-medium"
      >Sign in</NuxtLink>.
    </template>

    <template #footer>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorMessage"
        class="mb-2"
      />
      <span class="text-muted text-sm">
        By continuing you agree to our
        <NuxtLink
          to="/terms"
          class="text-primary font-medium"
        >Terms of Service</NuxtLink>.
      </span>
    </template>
  </UAuthForm>
</template>
```

### Path: app/pages/(guest)/forgot-password.vue
Only when `emailProvider` is `resend`.
```vue
<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  title: 'Forgot password',
})

const loading = ref(false)
const sent = ref(false)

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
]

async function onSubmit(payload: FormSubmitEvent<{ email: string }>) {
  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: payload.data })
    sent.value = true
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="sent"
    class="text-center"
  >
    <h2 class="text-lg font-semibold">
      Check your email
    </h2>
    <p class="text-muted text-sm mb-4">
      If an account exists for that address, we sent a reset link.
    </p>
    <NuxtLink
      to="/login"
      class="text-primary font-medium"
    >Back to sign in</NuxtLink>
  </div>

  <UAuthForm
    v-else
    :fields="fields"
    :schema="forgotPasswordSchema"
    title="Forgot password"
    description="We'll email you a link to reset it."
    icon="i-lucide-key-round"
    :submit="{ label: 'Send reset link', color: 'primary', loading }"
    @submit="onSubmit"
  >
    <template #footer>
      <NuxtLink
        to="/login"
        class="text-primary text-sm font-medium"
      >Back to sign in</NuxtLink>
    </template>
  </UAuthForm>
</template>
```

### Path: app/pages/(guest)/reset-password.vue
Only when `emailProvider` is `resend`.
```vue
<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { ResetPasswordInput } from '#shared/utils/auth-schemas'

definePageMeta({
  layout: 'auth',
  title: 'Reset password',
})

const route = useRoute()
const { refresh } = useAuth()
const loading = ref(false)
const errorMessage = ref('')

const credentialId = String(route.query.c ?? '')
const token = String(route.query.t ?? '')
if (!credentialId || !token) await navigateTo('/login')

const fields: AuthFormField[] = [
  { name: 'password', type: 'password', label: 'New password', placeholder: '••••••••', required: true, autocomplete: 'new-password' },
  { name: 'confirmPassword', type: 'password', label: 'Confirm password', placeholder: '••••••••', required: true, autocomplete: 'new-password' },
]

async function onSubmit(payload: FormSubmitEvent<Pick<ResetPasswordInput, 'password' | 'confirmPassword'>>) {
  loading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { ...payload.data, credentialId, token } })
    await refresh()
    await navigateTo('/')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || 'Could not reset your password'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="resetPasswordSchema.innerType().pick({ password: true, confirmPassword: true })"
    title="Choose a new password"
    icon="i-lucide-key-round"
    :submit="{ label: 'Reset password', color: 'primary', loading }"
    @submit="onSubmit"
  >
    <template #footer>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="errorMessage"
      />
    </template>
  </UAuthForm>
</template>
```

### Path: .env.local
Include only selected providers and, for `resend`, the email keys.
```dotenv
# Auth (nuxt-auth-utils) — at least 32 characters
NUXT_SESSION_PASSWORD="change-me-to-a-random-string-of-32-plus-chars"
NUXT_OAUTH_GITHUB_CLIENT_ID=""
NUXT_OAUTH_GITHUB_CLIENT_SECRET=""
NUXT_OAUTH_GOOGLE_CLIENT_ID=""
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=""

# Email (Resend)
NUXT_RESEND_API_KEY=""
NUXT_EMAIL_FROM="App <no-reply@example.com>"
```

### Path: .env.production
Same keys as `.env.local` with a different session password.

## Packages

### Path: terminal command
```bash
npm install nuxt-auth-utils
```

## Tell the user
- Generate a session password: `openssl rand -base64 32`.
- Run the SQL, then `npm run db:types`.
- OAuth callback URLs: `<origin>/auth/github`, `<origin>/auth/google`.
- Put pages that need a session under `app/pages/(protected)/`; the folder name never appears in the URL. Protect API routes with `await requireUserSession(event)`.
- Without a Resend key in dev, OTP codes and reset links are printed to the server console.

## i18n addendum
Apply only when `@nuxtjs/i18n` is also selected.

1. In `auth.global.ts` and `useAuth.ts`, wrap paths with `useLocalePath()`.
2. Replace `<NuxtLink>` with `<NuxtLinkLocale>` in the guest pages.
3. Replace user-facing strings with `t('auth.…')` and add these keys to every locale file:
   ```json
   {
     "auth": {
       "signIn": "Sign in",
       "signUp": "Sign up",
       "welcomeBack": "Welcome back",
       "createAccount": "Create an account",
       "noAccount": "Don't have an account?",
       "haveAccount": "Already have an account?",
       "name": "Name",
       "email": "Email",
       "password": "Password",
       "confirmPassword": "Confirm password",
       "rememberMe": "Remember me",
       "forgotPassword": "Forgot password?",
       "sendResetLink": "Send reset link",
       "backToSignIn": "Back to sign in",
       "checkEmail": "Check your email",
       "enterCode": "Enter the 6-digit code we sent you.",
       "confirm": "Confirm",
       "terms": "By continuing you agree to our Terms of Service."
     }
   }
   ```
4. Form fields with `type: 'email'` should get `dir: 'ltr'` in RTL locales.
