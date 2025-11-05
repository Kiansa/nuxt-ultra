<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  title: 'nav.login',
})
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const redirectInfo = useSupabaseCookieRedirect()
const isInvite = ref(false)
const schema = z.object({
  email: z.email('Invalid email'),
  password: z
    .string({ error: 'You must provide a new password' })
    .min(8, 'Must be at least 8 characters'),
})

type Schema = z.output<typeof schema>

const state = ref<Schema>({
  email: user.value?.email || '',
  password: '',
})

const err = ref<{ title: string; code: string; description: string } | null>(null)

if (!user.value && route.hash) {
  const hash = route.hash.slice(1) // Remove '#'
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const errorTitle = params.get('error')
  const errorCode = params.get('error_code')
  const errorDescription = params.get('error_description')
  if (errorTitle) {
    err.value = {
      title: errorTitle.replaceAll('_', ' '),
      code: errorCode?.replaceAll('_', ' ') || '',
      description: errorDescription?.replaceAll('+', ' ') || '',
    }
  } else {
    isInvite.value = true
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken as string,
      refresh_token: refreshToken as string,
    })
    if (error) {
      console.error('Error setting session:', error.message)
    } else {
      console.log('Session set successfully:', data)
    }
  }
}

watch(
  user,
  () => {
    if (user.value && !isInvite.value) {
      // Get redirect path, and clear it from the cookie
      const path = redirectInfo.pluck()
      // Redirect to the saved path, or fallback to the app
      return navigateTo(path || '/')
    } else if (user.value && isInvite.value) {
      state.value.email = user.value.email || ''
    }
  },
  { immediate: true }
)

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  // update password
  const { data, error } = await supabase.auth.updateUser({
    email: payload.data.email,
    password: payload.data.password,
  })
  if (error) {
    console.error('Error updating password:', error.message)
    return
  }
  // Get redirect path, and clear it from the cookie
  const path = redirectInfo.pluck()
  // Redirect to the saved path, or fallback to the app
  await navigateTo(path || '/')
}
</script>

<template>
  <UPage>
    <UPageCard
      v-if="isInvite"
      variant="naked"
      class="w-full max-w-md"
      :title="`Welcome ${user?.user_metadata?.full_name || 'to the app'}!`"
      description="Set your password to activate your account."
    >
      <UForm
        :schema="schema"
        :state="state"
        icon="i-lucide-user"
        @submit="onSubmit"
        class="space-y-4"
      >
        <UFormField label="Email" placeholder="enter email" name="email" required>
          <UInput v-model="state.email" class="w-full" :disabled="true" />
        </UFormField>
        <PasswordInput v-model="state.password" />
        <UButton
          label="Continue"
          color="primary"
          variant="solid"
          type="submit"
          block
          class="mt-4"
        />
      </UForm>
      <div class="text-muted text-center text-sm">
        By signing in, you agree to our
        <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
      </div>
    </UPageCard>
    <UAlert
      v-else-if="err"
      :title="`${err.title} (${err.code})`"
      :description="err.description"
      icon="i-hugeicons:alert-02"
      color="error"
      variant="subtle"
      :ui="{ title: 'capitalize' }"
    />
    <UPageSection v-else description="Signing in" icon="i-svg-spinners-gooey-balls-2" />
  </UPage>
</template>