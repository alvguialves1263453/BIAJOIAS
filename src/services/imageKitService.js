const IMAGEKIT_PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY

export async function uploadImage(file, fileName) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName || `produto_${Date.now()}`)
  formData.append('useUniqueFileName', 'true')
  formData.append('folder', '/bia-semi-joias')

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(IMAGEKIT_PRIVATE_KEY + ':')
    },
    body: formData
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error('Falha ao enviar imagem: ' + err)
  }

  const result = await response.json()
  return result.url
}
