import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale')
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase.from('translations').select(`id, ${locale}`)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const messages = data.reduce((acc, item) => {
    acc[item.id] = item[locale]
    return acc
  }, {} as Record<string, any>)

  console.log('messages', messages)
  return messages
})
