export default defineEventHandler(async (event) => {
  try {
    const { r2Domain } = useRuntimeConfig(event)
    const storage = useStorage('r2')
    const form = await readFormData(event)
    const file = form.get('file') as File

    if (!file || !file.size) {
      throw createError({ statusCode: 400, message: 'No file provided' })
    }

    // avoids overwriting files with the same name
    const key = `${crypto.randomUUID()}-${file.name}`
    const buffer = await file.arrayBuffer()

    // Use unstorage with proper options for binary files
    await storage.setItemRaw(key, new Uint8Array(buffer), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    const url = `${r2Domain}/${key}`
    return { url }
  }
  catch (error) {
    console.error('Upload error:', error)
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    throw createError({ statusCode: 500, message: 'File upload failed' })
  }
})
