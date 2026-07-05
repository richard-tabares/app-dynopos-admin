import { apiFetch } from '../../../apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL

export const deleteChangelog = async (id) => {
    const res = await apiFetch(`${API_URL}/api/admin/changelog/${id}`, {
        method: 'DELETE',
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar novedad')
    }
    return res.json()
}
