<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const selectedLocale = ref(siteLocales.find(item => item.value === locale.value))

async function changeLocale() {
  await navigateTo(switchLocalePath(selectedLocale.value!.value as typeof locale.value))
  window.location.reload() // temporary fix due to nuxt ui bug for navigationMenu and footerColumns not updating
}
</script>

<template>
  <div>
    <ClientOnly>
      <USelectMenu
        v-model="selectedLocale"
        :icon="selectedLocale?.icon"
        :items="siteLocales"
        :ui="{ content: 'w-max' }"
        :content="{
          align: 'end',
          side: 'bottom',
        }"
        @change="changeLocale"
      >
        <template #leading="{ ui }">
          <UIcon
            name="i-hugeicons-language-square"
            :class="ui.leadingIcon()"
          />
        </template>
        <template #default="{ modelValue }">
          <UIcon
            v-if="modelValue"
            :name="modelValue.icon"
            class="size-5"
          />
          <UIcon
            v-else
            name="i-twemoji-globe-showing-americas"
            class="size-5"
          />
        </template>
      </USelectMenu>
    </ClientOnly>
  </div>
</template>
