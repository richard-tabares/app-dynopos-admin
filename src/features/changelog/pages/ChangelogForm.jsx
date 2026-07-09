import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Sparkles, ArrowUp, Bug, Plus, X, ArrowLeft, Loader, Check, Image, Eye, Edit3, Trash2, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { sileo } from 'sileo'
import { getChangelogById } from '../helpers/getChangelog.js'
import { createChangelog } from '../helpers/createChangelog.js'
import { updateChangelog } from '../helpers/updateChangelog.js'
import { uploadChangelogImage } from '../helpers/uploadChangelogImage.js'
import { deleteChangelogImage } from '../helpers/deleteChangelogImage.js'

const typeOptions = [
    { value: 'feature', label: 'Nueva Característica', icon: Sparkles, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    { value: 'improvement', label: 'Mejora', icon: ArrowUp, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { value: 'fix', label: 'Corrección', icon: Bug, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
]

const isVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url)

export const ChangelogForm = () => {
    const { id } = useParams()
    const isEditing = Boolean(id)
    const navigate = useNavigate()

    const [type, setType] = useState('feature')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [bullets, setBullets] = useState([])
    const [bulletInput, setBulletInput] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(isEditing)
    const [preview, setPreview] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showImages, setShowImages] = useState(true)
    const [deletingImage, setDeletingImage] = useState(null)

    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!isEditing) return
        const load = async () => {
            try {
                const data = await getChangelogById(id)
                setType(data.type)
                setTitle(data.title)
                setDescription(data.description || '')
                setBullets(data.bullets || [])
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

    const insertAtCursor = (text) => {
        const textarea = textareaRef.current
        if (!textarea) {
            setDescription((prev) => prev + text)
            return
        }
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newVal = description.slice(0, start) + text + description.slice(end)
        setDescription(newVal)
        requestAnimationFrame(() => {
            const pos = start + text.length
            textarea.focus()
            textarea.setSelectionRange(pos, pos)
        })
    }

    const handleUploadImage = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const result = await uploadChangelogImage(file)
            const md = `![${file.name}](${result.url})`
            insertAtCursor(md)
            sileo.success({ title: 'Imagen subida', description: 'La imagen se insertó en la descripción' })
        } catch (err) {
            sileo.error({ title: 'Error', description: err.message })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const extractChangelogUrls = () => {
        const matches = [...description.matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)]
        const urls = matches.map(m => m[1])
        return [...new Set(urls)].filter(u => u.includes('/changelog/'))
    }

    const handleDeleteImage = async (url) => {
        setDeletingImage(url)
        try {
            await deleteChangelogImage(url)
            const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(`!\\[.*?\\]\\(${escaped}\\)`, 'g')
            setDescription((prev) => prev.replace(regex, ''))
            sileo.success({ title: 'Imagen eliminada', description: 'La imagen se eliminó del almacenamiento y la descripción' })
        } catch (err) {
            sileo.error({ title: 'Error', description: err.message })
        } finally {
            setDeletingImage(null)
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
        <section className='max-w-4xl mx-auto'>
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
                        <section className='flex items-center justify-between mb-1'>
                            <label className='text-sm font-medium'>Descripción</label>
                            <section className='flex items-center gap-1 bg-body rounded-lg p-0.5 border border-divider'>
                                <button
                                    type='button'
                                    onClick={() => setPreview(false)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${!preview ? 'bg-surface text-on-body shadow-xs' : 'text-muted hover:text-on-body'}`}
                                >
                                    <Edit3 className='w-3.5 h-3.5' />
                                    Editar
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setPreview(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${preview ? 'bg-surface text-on-body shadow-xs' : 'text-muted hover:text-on-body'}`}
                                >
                                    <Eye className='w-3.5 h-3.5' />
                                    Vista Previa
                                </button>
                            </section>
                        </section>

                        {preview ? (
                            <section className='min-h-[160px] px-3 py-2 rounded-lg bg-body border border-divider text-sm text-muted leading-relaxed'>
                                {description.trim() ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkBreaks]}
                                        components={{
                                            p: ({ children }) => <p className='my-3'>{children}</p>,
                                            h2: ({ children }) => <h2 className='text-base font-semibold text-on-body mt-4 mb-2'>{children}</h2>,
                                            h3: ({ children }) => <h3 className='text-sm font-semibold text-on-body mt-3 mb-1'>{children}</h3>,
                                            ul: ({ children }) => <ul className='list-disc pl-5 my-1 space-y-0.5'>{children}</ul>,
                                            ol: ({ children }) => <ol className='list-decimal pl-5 my-1 space-y-0.5'>{children}</ol>,
                                            li: ({ children }) => <li className='text-sm text-muted'>{children}</li>,
                                            blockquote: ({ children }) => <blockquote className='border-l-2 border-accent/30 pl-3 my-2 italic text-muted'>{children}</blockquote>,
                                            strong: ({ children }) => <strong className='font-semibold text-on-body'>{children}</strong>,
                                            code: ({ children }) => <code className='px-1 py-0.5 rounded bg-hover text-xs font-mono text-accent'>{children}</code>,
                                            img: ({ src, alt }) =>
                                                isVideo(src) ? (
                                                        <video
                                                            src={src}
                                                            loop
                                                            autoPlay
                                                            muted
                                                            playsInline
                                                            className='rounded-lg max-w-full max-h-80 object-contain bg-body my-3'
                                                    />
                                                ) : (
                                                    <img
                                                        src={src}
                                                        alt={alt}
                                                        className='rounded-lg max-w-full max-h-80 object-contain bg-body my-3'
                                                    />
                                                ),
                                        }}
                                    >
                                        {description}
                                    </ReactMarkdown>
                                ) : (
                                    <p className='text-faint italic'>Sin descripción</p>
                                )}
                            </section>
                        ) : (
                            <section className='space-y-2'>
                                <textarea
                                    ref={textareaRef}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder='Describe la actualización usando Markdown&#10;&#10;## Subtítulo&#10;Texto con **negrita**, _cursiva_, `código`&#10;&#10;![texto alternativo](url-de-la-imagen)'
                                    rows={16}
                                    className='w-full px-3 py-2 rounded-lg bg-surface text-on-body border border-divider focus:border-accent transition-colors placeholder:text-faint resize-none'
                                />
                                <section className='flex items-center gap-2'>
                                    <input
                                        ref={fileInputRef}
                                        type='file'
                                        accept='image/jpeg,image/png,image/webp,image/gif'
                                        onChange={handleUploadImage}
                                        className='hidden'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-divider text-xs font-medium text-muted hover:text-on-body hover:border-outline transition-colors disabled:opacity-50 cursor-pointer'
                                    >
                                        {uploading ? (
                                            <Loader className='w-3.5 h-3.5 animate-spin' />
                                        ) : (
                                            <Image className='w-3.5 h-3.5' />
                                        )}
                                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                                    </button>
                                    <span className='text-xs text-faint'>
                                        Soporta Markdown: **negrita**, `![alt](url)` para imágenes
                                    </span>
                                </section>
                            </section>
                        )}
                    </section>

                    {(() => {
                        const images = extractChangelogUrls()
                        if (images.length === 0) return null
                        return (
                            <section className='bg-body rounded-xl border border-divider overflow-hidden'>
                                <button
                                    type='button'
                                    onClick={() => setShowImages(!showImages)}
                                    className='w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-on-body hover:bg-hover/50 transition-colors cursor-pointer'
                                >
                                    <span>Imágenes utilizadas ({images.length})</span>
                                    <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${showImages ? '' : '-rotate-90'}`} />
                                </button>
                                {showImages && (
                                    <section className='px-4 pb-4 pt-2'>
                                        <section className='flex flex-wrap gap-3'>
                                            {images.map((url, i) => (
                                                <section key={i} className='relative group'>
                                                    <img
                                                        src={url}
                                                        alt=''
                                                        className='w-20 h-20 rounded-lg object-cover border border-divider bg-surface'
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => handleDeleteImage(url)}
                                                        disabled={deletingImage === url}
                                                        className='absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 cursor-pointer'
                                                        title='Eliminar imagen'
                                                    >
                                                        {deletingImage === url ? (
                                                            <Loader className='w-3 h-3 animate-spin' />
                                                        ) : (
                                                            <Trash2 className='w-3 h-3' />
                                                        )}
                                                    </button>
                                                </section>
                                            ))}
                                        </section>
                                    </section>
                                )}
                            </section>
                        )
                    })()}

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
                                className='flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-surface text-sm font-medium hover:bg-accent/85 transition-colors cursor-pointer whitespace-nowrap'
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
                            className='flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-surface text-sm font-medium hover:bg-accent/85 transition-colors disabled:opacity-50 cursor-pointer'
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
