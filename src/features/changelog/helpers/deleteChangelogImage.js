import { apiFetch } from '../../../apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL

export const deleteChangelogImage = async (url) => {
    const res = await apiFetch(`${API_URL}/api/admin/changelog/delete-image`, {
        method: 'POST',
        body: JSON.stringify({ url }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar imagen')
    }
    return res.json()
}
