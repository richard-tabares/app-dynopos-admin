import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Sparkles, ArrowUp, Bug, Plus, X, ArrowLeft, Loader, Check } from 'lucide-react'
import { sileo } from 'sileo'
import { getChangelogById } from '../helpers/getChangelog.js'
import { createChangelog } from '../helpers/createChangelog.js'
import { updateChangelog } from '../helpers/updateChangelog.js'

const typeOptions = [
    { value: 'feature', label: 'Nueva Característica', icon: Sparkles, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    { value: 'improvement', label: 'Mejora', icon: ArrowUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { value: 'fix', label: 'Corrección', icon: Bug, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
]

export const ChangelogForm = () => {
    const { id } = useParams()
    const isEditing = Boolean(id)
    const navigate = useNavigate()

    const [type, setType] = useState('feature')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [bullets, setBullets] = useState([])
    const [bulletInput, setBulletInput] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(isEditing)

    useEffect(() => {
        if (!isEditing) return
        const load = async () => {
            try {
                const data = await getChangelogById(id)
                setType(data.type)
                setTitle(data.title)
                setDescription(data.description || '')
                setBullets(data.bullets || [])
                setMediaUrl(data.media_url || '')
                setIsActive(data.is_active !== false)
            } catch {
                sileo.error({ title: 'Error', description: 'Error al cargar la novedad' })
                navigate('/changelog')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id, isEditing, navigate])

    const handleAddBullet = () => {
        const trimmed = bulletInput.trim()
        if (!trimmed) return
        setBullets((prev) => [...prev, trimmed])
        setBulletInput('')
    }

    const handleRemoveBullet = (index) => {
        setBullets((prev) => prev.filter((_, i) => i !== index))
    }

    const handleBulletKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddBullet()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) {
            sileo.error({ title: 'Error', description: 'El título es obligatorio' })
            return
        }

        setSaving(true)
        try {
            const payload = {
                type,
                title: title.trim(),
                description: description.trim(),
                bullets,
                media_url: mediaUrl.trim() || null,
            }

            if (isEditing) {
                await updateChangelog(id, { ...payload, is_active: isActive })
                sileo.success({ title: 'Completado', description: 'Novedad actualizada correctamente' })
            } else {
                await createChangelog(payload)
                sileo.success({ title: 'Completado', description: 'Novedad publicada correctamente' })
            }
            navigate('/changelog')
        } catch (err) {
            sileo.error({ title: 'Error', description: err.message })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <section className='flex items-center justify-center py-20'>
                <Loader className='w-6 h-6 animate-spin text-accent' />
            </section>
        )
    }

    return (
        <section className='max-w-2xl mx-auto'>
            <button
                onClick={() => navigate('/changelog')}
                className='flex items-center gap-2 text-sm text-muted hover:text-on-body transition-colors mb-6 cursor-pointer'
            >
                <ArrowLeft className='w-4 h-4' />
                Volver a novedades
            </button>

            <section className='bg-surface rounded-xl border border-outline overflow-hidden'>
                <section className='px-6 py-4 border-b border-divider'>
                    <h2 className='text-lg font-semibold'>
                        {isEditing ? 'Editar Novedad' : 'Crear Nueva Novedad'}
                    </h2>
                    <p className='text-sm text-muted'>
                        {isEditing ? 'Modifica los campos que desees actualizar' : 'Registra una nueva actualización del sistema'}
                    </p>
                </section>

                <form onSubmit={handleSubmit} className='p-6 space-y-6'>
                    <section>
                        <label className='block text-sm font-medium mb-2'>Tipo</label>
                        <section className='flex flex-wrap gap-3'>
                            {typeOptions.map((opt) => {
                                const Icon = opt.icon
                                const selected = type === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        type='button'
                                        onClick={() => setType(opt.value)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer
                                            ${selected
                                                ? `${opt.bg} ${opt.color} ${opt.border}`
                                                : 'border-divider text-muted hover:border-outline hover:text-on-body bg-surface'
                                            }`}
                                    >
                                        <Icon className='w-4 h-4' />
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </section>
                    </section>

                    <section>
                        <label className='block text-sm font-medium mb-1'>Título</label>
                        <input
                            type='text'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='Ej: Nuevo módulo de inventario'
                            className='w-full px-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint'
                        />
                    </section>

                    <section>
                        <label className='block text-sm font-medium mb-1'>Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder='Resumen general de la actualización...'
                            rows={3}
                            className='w-full px-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint resize-none'
                        />
                    </section>

                    <section>
                        <label className='block text-sm font-medium mb-2'>Puntos Clave</label>
                        <section className='flex gap-2 mb-3'>
                            <input
                                type='text'
                                value={bulletInput}
                                onChange={(e) => setBulletInput(e.target.value)}
                                onKeyDown={handleBulletKeyDown}
                                placeholder='Escribe un punto clave...'
                                className='flex-1 px-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint'
                            />
                            <button
                                type='button'
                                onClick={handleAddBullet}
                                className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/85 transition-colors cursor-pointer whitespace-nowrap'
                            >
                                <Plus className='w-4 h-4' />
                                Agregar Punto
                            </button>
                        </section>
                        {bullets.length > 0 && (
                            <ul className='space-y-1.5'>
                                {bullets.map((bullet, index) => (
                                    <li key={index} className='flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-hover text-sm'>
                                        <span className='flex items-center gap-2'>
                                            <span className='w-1.5 h-1.5 rounded-full bg-accent shrink-0' />
                                            {bullet}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={() => handleRemoveBullet(index)}
                                            className='p-1 rounded-md text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0'
                                        >
                                            <X className='w-3.5 h-3.5' />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <label className='block text-sm font-medium mb-1'>Media URL <span className='text-muted font-normal'>(opcional)</span></label>
                        <input
                            type='text'
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder='https://ejemplo.com/video-demo.mp4'
                            className='w-full px-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint'
                        />
                    </section>

                    {isEditing && (
                        <section className='flex items-center gap-3'>
                            <label className='text-sm font-medium'>Estado</label>
                            <button
                                type='button'
                                onClick={() => setIsActive(!isActive)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer
                                    ${isActive
                                        ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                        : 'bg-red-500/10 text-red-500 border-red-500/30'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                {isActive ? 'Activo' : 'Inactivo'}
                            </button>
                        </section>
                    )}

                    <section className='flex items-center justify-end gap-3 pt-4 border-t border-divider'>
                        <button
                            type='button'
                            onClick={() => navigate('/changelog')}
                            className='px-4 py-2 rounded-lg border border-divider text-sm font-medium text-muted hover:text-on-body hover:border-outline transition-colors cursor-pointer'
                        >
                            Cancelar
                        </button>
                        <button
                            type='submit'
                            disabled={saving}
                            className='flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/85 transition-colors disabled:opacity-50 cursor-pointer'
                        >
                            {saving ? (
                                <Loader className='w-4 h-4 animate-spin' />
                            ) : (
                                <Check className='w-4 h-4' />
                            )}
                            {isEditing ? 'Guardar Cambios' : 'Publicar'}
                        </button>
                    </section>
                </form>
            </section>
        </section>
    )
}
