import { apiFetch } from '../../../apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL

export const uploadChangelogImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await apiFetch(`${API_URL}/api/admin/changelog/upload-image`, {
        method: 'POST',
        contentType: null,
        body: formData,
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al subir imagen')
    }
    return res.json()
}
