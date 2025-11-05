<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
  title: 'nav_login',
})

const user = useSupabaseUser()
const redirectInfo = useSupabaseCookieRedirect()
const supabase = useSupabaseClient()
const loading = ref(false)

const fields = ref([
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
    required: true,
  },
])

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, { error: 'Must be at least 8 characters' }),
})

type Schema = z.output<typeof schema>

const errMsg = ref<string | undefined>(undefined)
const confirmMsg = ref<string | undefined>(undefined)

// auth based on email and password
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const state = payload.data
  try {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithPassword({
      email: state.email || '',
      password: state.password || '',
    })
    if (error) throw error
    if (data?.user?.confirmed_at) {
      navigateTo('/confirm')
    }
    else {
      confirmMsg.value = 'You need to confirm your email address'
    }
  }
  catch (error: any) {
    errMsg.value = error.error_description || error.message

    // if (error.message === 'Email not confirmed') {
    //   await supabase.auth.resend({
    //     type: 'signup',
    //     email: state.email || '',
    //     options: {
    //       emailRedirectTo: `${config.public.siteUrl}${localePath('/confirm')}`,
    //     },
    //   })
    // }
    console.error(error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (user.value) {
    // Get redirect path, and clear it from the cookie
    const path = redirectInfo.pluck()
    // Redirect to the saved path, or fallback to the app
    navigateTo(path || '/')
  }
})
</script>

<template>
  <UAuthForm
    ref="auth"
    :fields="fields"
    :schema="schema"
    title="Welcome back!"
    icon="i-lucide-lock"
    :submit="{
      label: `Login`,
      color: 'primary',
      variant: 'subtle',
      loading: loading,
    }"
    class="min-w-xs"
    @submit="onSubmit"
  >
    <template #footer>
      By signing in, you agree to our
      <NuxtLink
        to="/terms"
        class="text-primary-500 font-medium"
      >
        Terms of Service
      </NuxtLink>.
      <UAlert
        v-if="errMsg"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="subtle"
        :title="errMsg"
      />
      <UAlert
        v-if="confirmMsg"
        variant="soft"
        color="success"
        icon="i-heroicons-shield-check-solid"
        :title="confirmMsg"
        class="mt-4"
      />
    </template>
  </UAuthForm>
</template>
