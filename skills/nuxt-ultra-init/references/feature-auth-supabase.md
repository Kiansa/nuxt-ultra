# Auth Feature: Supabase

## Condition
Apply when Auth is `@nuxtjs/supabase`. Requires DB `@nuxtjs/supabase`, UI `@nuxt/ui` and Validation `zod` (added automatically).

Route protection uses the module's own redirect middleware, so there is no custom global middleware. Protected prefixes are listed in `redirectOptions.include`; everything else stays public. Protected pages still live under `app/pages/(protected)/` for consistency with the rest of the template (the folder name is not part of the URL).

## File Updates

### Path: nuxt.config.ts
Replace the `supabase` block from the DB feature with:
```ts
supabase: {
  redirect: true,
  redirectOptions: {
    login: '/login',
    callback: '/confirm',
    // One pattern per protected prefix. With dashboardRoute = '/' use include: ['/(.*)?'] and
    // exclude: ['/login', '/confirm', '/terms'].
    include: ['/<dashboardRoute>(/*)?', '/admin(/*)?'],
    exclude: [],
    saveRedirectToCookie: true,
  },
  types: '~~/shared/types/database.types.ts',
},
```

### Path: app/composables/useAuth.ts
Provider-agnostic auth surface used by the dashboard feature.
```ts
export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const loggedIn = computed(() => !!user.value)
  const displayName = computed(() =>
    (user.value?.user_metadata?.full_name as string | undefined)
    || user.value?.email
    || '',
  )
  const avatar = computed(() => user.value?.user_metadata?.avatar_url as string | undefined)

  async function logout() {
    await supabase.auth.signOut()
    await navigateTo('/login')
  }

  return { user, loggedIn, displayName, avatar, logout }
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

### Path: app/pages/(guest)/login.vue
Generate the `providers` array only for the OAuth providers the user selected; remove the array and the `:providers` prop if none.
```vue
<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
  title: 'Sign in',
  // Already signed in: go home (the confirm page handles saved redirects).
  middleware: [
    () => {
      const user = useSupabaseUser()
      if (user.value) return navigateTo('/')
    },
  ],
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const origin = useRequestURL().origin

const isLogin = ref(route.query.mode !== 'register')
const loading = ref(false)
const errorMessage = ref<string>()
const infoMessage = ref<string>()

// After a successful password sign-in, `user` becomes set: leave the page.
watch(user, (value) => {
  if (value) navigateTo('/')
})

const fields = computed<AuthFormField[]>(() => [
  ...(isLogin.value
    ? []
    : [{ name: 'name', type: 'text' as const, label: 'Name', placeholder: 'Your name', required: true }]),
  { name: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
  { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', required: true },
])

const providers = [
  {
    label: 'Continue with Google',
    icon: 'i-simple-icons-google',
    onClick: () => signInWithOAuth('google'),
  },
  {
    label: 'Continue with GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => signInWithOAuth('github'),
  },
]

const schema = z.object({
  name: z.string().min(2, 'Name is too short').optional(),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Must be at least 8 characters'),
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { name, email, password } = payload.data
  errorMessage.value = undefined
  infoMessage.value = undefined
  loading.value = true

  try {
    if (isLogin.value) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // `user` watcher redirects.
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/confirm`,
        data: { full_name: name },
      },
    })
    if (error) throw error

    // Supabase returns an empty identities array when the email is already registered.
    if (data.user?.identities?.length === 0) {
      errorMessage.value = 'An account with this email already exists. Sign in instead.'
    }
    else {
      infoMessage.value = 'Check your inbox to confirm your email address.'
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong'
    errorMessage.value = message

    if (message === 'Email not confirmed') {
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${origin}/confirm` },
      })
      infoMessage.value = 'We sent you a new confirmation email.'
    }
  }
  finally {
    loading.value = false
  }
}

async function signInWithOAuth(provider: 'google' | 'github') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/confirm` },
  })
  if (error) errorMessage.value = error.message
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    :title="isLogin ? 'Welcome back' : 'Create an account'"
    :icon="isLogin ? 'i-lucide-lock' : 'i-lucide-user-plus'"
    :submit="{
      label: isLogin ? 'Sign in' : 'Sign up',
      color: 'primary',
      loading,
    }"
    @submit="onSubmit"
  >
    <template #description>
      {{ isLogin ? 'Don\'t have an account?' : 'Already have an account?' }}
      <ULink
        class="text-primary font-medium"
        @click="isLogin = !isLogin"
      >
        {{ isLogin ? 'Sign up' : 'Sign in' }}
      </ULink>.
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
      <UAlert
        v-if="infoMessage"
        color="success"
        variant="subtle"
        icon="i-lucide-mail-check"
        :title="infoMessage"
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

### Path: app/pages/(guest)/confirm.vue
OAuth and email-confirmation callback. The module stores the originally requested path in a cookie (`saveRedirectToCookie`); this page pops it and redirects.
```vue
<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  title: 'Signing in',
})

const user = useSupabaseUser()
const route = useRoute()
const redirectInfo = useSupabaseCookieRedirect()

const error = ref<{ title: string, description: string }>()

// Supabase appends errors to the URL hash, e.g. #error=access_denied&error_description=...
if (import.meta.client && route.hash) {
  const params = new URLSearchParams(route.hash.slice(1))
  const title = params.get('error')
  if (title) {
    error.value = {
      title: title.replaceAll('_', ' '),
      description: (params.get('error_description') ?? '').replaceAll('+', ' '),
    }
  }
}

watch(user, (value) => {
  if (!value) return
  const path = redirectInfo.pluck()
  navigateTo(path || '/')
}, { immediate: true })
</script>

<template>
  <UAlert
    v-if="error"
    color="error"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    :title="error.title"
    :description="error.description"
    :ui="{ title: 'capitalize' }"
    :actions="[{ label: 'Back to sign in', to: '/login', color: 'neutral', variant: 'subtle' }]"
  />
  <div
    v-else
    class="flex flex-col items-center gap-3 py-6 text-muted"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-6 animate-spin"
    />
    <span>Signing you in…</span>
  </div>
</template>
```

## Packages
None beyond the DB, UI and validation features.

## Tell the user
- In the Supabase dashboard set **Site URL** to the production origin and add `<origin>/confirm` (dev and prod) to **Redirect URLs**.
- Enable each selected OAuth provider under **Authentication → Providers**.
- Protected prefixes are `/<dashboardRoute>` and `/admin`; add more to `redirectOptions.include`.

## i18n addendum
Apply only when `@nuxtjs/i18n` is also selected.

1. In `nuxt.config.ts` extend `redirectOptions.include` with locale-prefixed patterns:
   ```ts
   include: ['/<dashboardRoute>(/*)?', '/*/<dashboardRoute>(/*)?', '/admin(/*)?', '/*/admin(/*)?'],
   ```
2. In `login.vue` and `confirm.vue`, replace `navigateTo('/')` with `navigateTo(useLocalePath()('/'))` and `<NuxtLink to="/terms">` with `<NuxtLinkLocale to="/terms">`.
3. In `useAuth.ts`, redirect with `useLocalePath()('/login')`.
4. Replace the user-facing strings with `t('auth.…')` calls and add these keys to every locale file:
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
       "terms": "By continuing you agree to our Terms of Service.",
       "checkInbox": "Check your inbox to confirm your email address.",
       "alreadyRegistered": "An account with this email already exists. Sign in instead.",
       "signingIn": "Signing you in…",
       "backToSignIn": "Back to sign in"
     }
   }
   ```
