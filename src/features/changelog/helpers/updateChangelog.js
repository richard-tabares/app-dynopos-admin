import { apiFetch } from '../../../apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL

export const updateChangelog = async (id, data) => {
    const res = await apiFetch(`${API_URL}/api/admin/changelog/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar novedad')
    }
    return res.json()
}
