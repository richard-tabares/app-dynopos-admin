import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Sparkles, ArrowUp, Bug, Trash2, Loader, Search, Megaphone } from 'lucide-react'
import { sileo } from 'sileo'
import { getChangelog } from '../helpers/getChangelog.js'
import { deleteChangelog } from '../helpers/deleteChangelog.js'
import { Modal } from '../../../components/Modal.jsx'

const typeMeta = {
    feature: { label: 'Característica', icon: Sparkles, class: 'bg-green-500/10 text-green-600' },
    improvement: { label: 'Mejora', icon: ArrowUp, class: 'bg-blue-500/10 text-blue-500' },
    fix: { label: 'Corrección', icon: Bug, class: 'bg-amber-500/10 text-amber-500' },
}

export const ChangelogList = () => {
    const navigate = useNavigate()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showDelete, setShowDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                const data = await getChangelog()
                if (!cancelled) setEntries(data)
            } catch {
                if (!cancelled) sileo.error({ title: 'Error', description: 'Error al cargar novedades' })
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    const handleDelete = async () => {
        if (!showDelete) return
        setDeleting(true)
        try {
            await deleteChangelog(showDelete.id)
            sileo.success({ title: 'Completado', description: 'Novedad eliminada correctamente' })
            setShowDelete(null)
            const data = await getChangelog()
            setEntries(data)
        } catch (err) {
            sileo.error({ title: 'Error', description: err.message })
        } finally {
            setDeleting(false)
        }
    }

    const filtered = entries.filter((e) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
    })

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    if (loading) {
        return (
            <section className='bg-surface rounded-xl border border-outline overflow-hidden'>
                <section className='p-6 space-y-4'>
                    {[1, 2, 3].map((i) => (
                        <section key={i} className='h-12 bg-hover rounded-lg animate-pulse' />
                    ))}
                </section>
            </section>
        )
    }

    return (
        <section>
            <section className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
                <section className='relative flex-1 max-w-xs'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Buscar novedad...'
                        className='w-full pl-9 pr-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint text-sm'
                    />
                </section>
                <button
                    onClick={() => navigate('/changelog/new')}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/85 transition-colors cursor-pointer'
                >
                    <Plus className='w-4 h-4' />
                    Nueva Novedad
                </button>
            </section>

            {filtered.length === 0 ? (
                <section className='bg-surface rounded-xl border border-outline p-12 text-center'>
                    <Megaphone className='w-12 h-12 text-faint mx-auto mb-3' />
                    <p className='text-muted font-medium'>No hay novedades registradas</p>
                    <p className='text-sm text-faint mt-1'>
                        {search ? 'Intenta con otro término de búsqueda' : 'Crea la primera novedad del sistema'}
                    </p>
                </section>
            ) : (
                <section className='bg-surface rounded-xl border border-outline overflow-hidden'>
                    <section className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-divider bg-body/50'>
                                    <th className='text-left px-4 py-3 text-muted font-medium'>ID</th>
                                    <th className='text-left px-4 py-3 text-muted font-medium'>Título</th>
                                    <th className='text-left px-4 py-3 text-muted font-medium'>Tipo</th>
                                    <th className='text-left px-4 py-3 text-muted font-medium'>Fecha</th>
                                    <th className='text-left px-4 py-3 text-muted font-medium'>Estado</th>
                                    <th className='text-right px-4 py-3 text-muted font-medium'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((entry, idx) => {
                                    const typeInfo = typeMeta[entry.type] || typeMeta.feature
                                    const TypeIcon = typeInfo.icon
                                    return (
                                        <tr
                                            key={entry.id}
                                            onClick={() => navigate(`/changelog/${entry.id}/edit`)}
                                            className={`border-b border-divider transition-colors hover:bg-hover/50 cursor-pointer ${idx % 2 === 0 ? '' : 'bg-hover/30'}`}
                                        >
                                            <td className='px-4 py-3 text-muted font-mono text-xs'>#{entry.id}</td>
                                            <td className='px-4 py-3 font-medium max-w-xs truncate'>{entry.title}</td>
                                            <td className='px-4 py-3'>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.class}`}>
                                                    <TypeIcon className='w-3 h-3' />
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-muted text-xs'>{formatDate(entry.created_at)}</td>
                                            <td className='px-4 py-3'>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.is_active !== false ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${entry.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {entry.is_active !== false ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className='px-4 py-3 text-right'>
                                                <section className='flex items-center justify-end gap-1'>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowDelete(entry) }}
                                                        className='p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer'
                                                        title='Eliminar'
                                                    >
                                                        <Trash2 className='w-4 h-4' />
                                                    </button>
                                                </section>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </section>
                </section>
            )}

            {showDelete && (
                <Modal isOpen={true} onClose={() => setShowDelete(null)} title='Eliminar Novedad' icon={Trash2} iconColor='text-red-500' size='sm'>
                    <section className='p-6'>
                        <p className='text-sm text-muted mb-1'>¿Estás seguro de eliminar esta novedad?</p>
                        <p className='text-sm font-medium mb-6'>{showDelete.title}</p>
                        <section className='flex justify-end gap-3'>
                            <button
                                onClick={() => setShowDelete(null)}
                                className='px-4 py-2 rounded-lg border border-divider text-sm font-medium text-muted hover:text-on-body transition-colors cursor-pointer'
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className='flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer'
                            >
                                {deleting && <Loader className='w-4 h-4 animate-spin' />}
                                Eliminar
                            </button>
                        </section>
                    </section>
                </Modal>
            )}
        </section>
    )
}
