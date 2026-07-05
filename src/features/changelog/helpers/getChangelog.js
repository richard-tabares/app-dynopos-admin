import { apiFetch } from '../../../apiFetch.js'

const API_URL = import.meta.env.VITE_API_URL

export const getChangelog = async () => {
    const res = await apiFetch(`${API_URL}/api/admin/changelog`)
    if (!res.ok) throw new Error('Error al obtener novedades')
    const data = await res.json()
    return Array.isArray(data) ? data : []
}

export const getChangelogById = async (id) => {
    const res = await apiFetch(`${API_URL}/api/admin/changelog/${id}`)
    if (!res.ok) throw new Error('Novedad no encontrada')
    return res.json()
}
