// src/pages/shared/CreateProductPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Btn, Icon } from '../../components/ui'
import { uploadToCloudinary } from '../../utils/cloudinary'
import type { Category } from '../../types/category'

// ── Composants locaux ────────────────────────────────────────────
const Field = ({
    label,
    required,
    children,
    hint,
    error,
}: {
    label: string
    required?: boolean
    children: React.ReactNode
    hint?: string
    error?: string
}) => (
    <div style={{ marginBottom: 20 }}>
        <label
            style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
            }}
        >
            {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        {children}
        {hint && (
            <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>
                {hint}
            </p>
        )}
        {error && (
            <p style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, marginBottom: 0 }}>
                {error}
            </p>
        )}
    </div>
)

const Input = ({
    value,
    onChange,
    type = 'text',
    placeholder,
    min,
    step,
    disabled,
}: {
    value: string
    onChange: (v: string) => void
    type?: string
    placeholder?: string
    min?: string
    step?: string
    disabled?: boolean
}) => (
    <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: 9,
            fontSize: 13.5,
            color: '#374151',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            background: disabled ? '#F8FAFC' : '#fff',
        }}
        onFocus={e => (e.target.style.borderColor = '#3B82F6')}
        onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
    />
)

const Select = ({
    value,
    onChange,
    children,
}: {
    value: string
    onChange: (v: string) => void
    children: React.ReactNode
}) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: 9,
            fontSize: 13.5,
            color: '#374151',
            outline: 'none',
            fontFamily: 'inherit',
            background: '#fff',
            cursor: 'pointer',
        }}
        onFocus={e => (e.target.style.borderColor = '#3B82F6')}
        onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
    >
        {children}
    </select>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div
        style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 16,
            marginTop: 8,
            paddingBottom: 8,
            borderBottom: '1px solid #F1F5F9',
        }}
    >
        {children}
    </div>
)

// ── Page ─────────────────────────────────────────────────────────
export default function CreateProductPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const basePath = user?.role === 'SUPER_ADMIN' ? '/admin' : '/manager'

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Images Cloudinary
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [uploadingImages, setUploadingImages] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Modale nouvelle catégorie
    const [showCatModal, setShowCatModal] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [creatingCat, setCreatingCat] = useState(false)

    const [form, setForm] = useState({
        name: '',
        sku: '',
        category: '',
        unit: 'piece',
        selling_price: '',
        minimum_stock: '5',
        reorder_level: '10',
        description: '',
        barcode: '',
    })

    const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

    useEffect(() => {
        categoryService.getAll().then(res => {
            setCategories(res.results ?? res)
        })
    }, [])

    const handleCreateCategory = async () => {
        if (!newCatName.trim()) return
        setCreatingCat(true)
        try {
            const cat = await categoryService.create({ name: newCatName.trim() })
            setCategories(prev => [...prev, cat])
            setForm(f => ({ ...f, category: String(cat.id) }))
            setNewCatName('')
            setShowCatModal(false)
        } finally {
            setCreatingCat(false)
        }
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return
        setUploadError(null)
        setUploadingImages(true)
        try {
            const results = await Promise.all(files.map(f => uploadToCloudinary(f, 'products')))
            setImageUrls(prev => [...prev, ...results.map(r => r.url)])
        } catch (err: any) {
            setUploadError(err?.message ?? "Erreur lors de l'upload des images.")
        } finally {
            setUploadingImages(false)
            e.target.value = ''
        }
    }

    const removeImage = (idx: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== idx))
    }

    const generateSku = (name: string): string => {
        const prefix = name
            .split(' ')
            .slice(0, 3)
            .map(w => w[0]?.toUpperCase() ?? '')
            .join('')
        const unique = Math.random().toString(36).substring(2, 8).toUpperCase()
        return `${prefix || 'PRD'}-${unique}`
    }

    const handleSubmit = async () => {
        setError(null)
        if (!form.name || !form.selling_price) {
            setError("Le nom et le prix de vente sont obligatoires.")
            return
        }
        setLoading(true)
        try {
            // Générer SKU si vide
            const sku = form.sku.trim() || generateSku(form.name)

            await productService.create({
                name: form.name,
                sku,
                category: form.category ? Number(form.category) : undefined,
                unit: form.unit as any,
                selling_price: parseFloat(form.selling_price),
                minimum_stock: parseInt(form.minimum_stock) || 5,
                reorder_level: parseInt(form.reorder_level) || 10,
                description: form.description || undefined,
                barcode: form.barcode || undefined,
                image_urls: imageUrls,
            } as any)
            navigate(`${basePath}/products`)
        } catch (e: any) {
            const data = e?.response?.data
            if (data?.name) setError(data.name[0])
            else if (data?.sku) setError(`SKU: ${data.sku[0]}`)
            else if (data?.detail) setError(data.detail)
            else setError('Erreur lors de la création du produit.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <PageHeader
                title="Nouveau produit"
                subtitle="Ajouter un produit au catalogue"
                action={
                    <Btn variant="secondary" onClick={() => navigate(`${basePath}/products`)}>
                        ← Retour
                    </Btn>
                }
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 340px',
                    gap: 20,
                    alignItems: 'start',
                }}
            >
                {/* ── Formulaire principal ─────────────────────────── */}
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 14,
                        padding: 28,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                >
                    {error && (
                        <div
                            style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                borderRadius: 9,
                                padding: '10px 14px',
                                fontSize: 13.5,
                                marginBottom: 20,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <SectionTitle>Informations générales</SectionTitle>

                    <Field label="Nom du produit" required>
                        <Input
                            value={form.name}
                            onChange={set('name')}
                            placeholder="Ex: Chaise ergonomique"
                        />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Field
                            label="SKU"
                            hint="Laissez vide pour génération automatique (ex: NAM-3F2B1C)"
                        >
                            <Input
                                value={form.sku}
                                onChange={set('sku')}
                                placeholder="Généré automatiquement"
                            />
                        </Field>
                        <Field label="Code-barres">
                            <Input
                                value={form.barcode}
                                onChange={set('barcode')}
                                placeholder="Ex: 3700123456789"
                            />
                        </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Field label="Catégorie">
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <Select value={form.category} onChange={set('category')}>
                                        <option value="">Sans catégorie</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <button
                                    onClick={() => setShowCatModal(true)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 9,
                                        border: '1px solid #E2E8F0',
                                        background: '#F8FAFC',
                                        cursor: 'pointer',
                                        fontSize: 16,
                                        flexShrink: 0,
                                        color: '#3B82F6',
                                    }}
                                    title="Nouvelle catégorie"
                                >
                                    +
                                </button>
                            </div>
                        </Field>
                        <Field label="Unité">
                            <Select value={form.unit} onChange={set('unit')}>
                                {[
                                    ['piece', 'Pièce'],
                                    ['kg', 'Kilogramme'],
                                    ['g', 'Gramme'],
                                    ['l', 'Litre'],
                                    ['ml', 'Millilitre'],
                                    ['m', 'Mètre'],
                                    ['cm', 'Centimètre'],
                                    ['box', 'Boîte'],
                                    ['pack', 'Pack'],
                                    ['other', 'Autre'],
                                ].map(([v, l]) => (
                                    <option key={v} value={v}>
                                        {l}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>

                    <Field label="Description">
                        <textarea
                            value={form.description}
                            onChange={e => set('description')(e.target.value)}
                            placeholder="Description du produit..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E2E8F0',
                                borderRadius: 9,
                                fontSize: 13.5,
                                color: '#374151',
                                outline: 'none',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                            onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                        />
                    </Field>

                    <SectionTitle>Photos du produit</SectionTitle>

                    {/* Zone d'upload images */}
                    <div style={{ marginBottom: 20 }}>
                        {/* Grille des images uploadées */}
                        {imageUrls.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                gap: 10,
                                marginBottom: 12,
                            }}>
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <img
                                            src={url}
                                            alt={`Photo ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                objectFit: 'cover',
                                                borderRadius: 10,
                                                border: idx === 0 ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                                            }}
                                        />
                                        {idx === 0 && (
                                            <span style={{
                                                position: 'absolute', bottom: 4, left: 4,
                                                background: '#1D4ED8', color: '#fff',
                                                fontSize: 9, fontWeight: 700, borderRadius: 4,
                                                padding: '1px 5px',
                                            }}>PRINCIPALE</span>
                                        )}
                                        <button
                                            onClick={() => removeImage(idx)}
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 20, height: 20, borderRadius: '50%',
                                                background: 'rgba(220,38,38,0.85)', color: '#fff',
                                                border: 'none', cursor: 'pointer', fontSize: 11,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bouton d'ajout */}
                        <label style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, padding: '14px 20px',
                            border: '2px dashed #BFDBFE', borderRadius: 12,
                            cursor: uploadingImages ? 'wait' : 'pointer',
                            background: '#F8FAFC',
                            color: '#3B82F6', fontSize: 13.5, fontWeight: 500,
                            transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { if (!uploadingImages) { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#93C5FD'; } }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploadingImages}
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                            {uploadingImages ? (
                                <>
                                    <Icon name="refresh" size={16} color="#3B82F6" />
                                    Upload en cours...
                                </>
                            ) : (
                                <>
                                    <Icon name="plus" size={16} color="#3B82F6" />
                                    {imageUrls.length === 0 ? 'Ajouter des photos' : 'Ajouter d\'autres photos'}
                                </>
                            )}
                        </label>

                        {uploadError && (
                            <p style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{uploadError}</p>
                        )}
                        <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
                            La 1ère photo sera l'image principale. Formats acceptés : JPG, PNG, WebP.
                        </p>
                    </div>

                    <SectionTitle>Tarification</SectionTitle>

                    <Field label="Prix de vente (F CFA)" required>
                        <Input
                            type="number"
                            min="0"
                            step="1"
                            value={form.selling_price}
                            onChange={set('selling_price')}
                            placeholder="0"
                        />
                    </Field>

                    <SectionTitle>Seuils de stock</SectionTitle>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Field
                            label="Stock minimum"
                            hint="Alerte stock critique en dessous de ce seuil"
                        >
                            <Input
                                type="number"
                                min="0"
                                value={form.minimum_stock}
                                onChange={set('minimum_stock')}
                            />
                        </Field>
                        <Field
                            label="Niveau de réapprovisionnement"
                            hint="Alerte stock bas en dessous de ce seuil"
                        >
                            <Input
                                type="number"
                                min="0"
                                value={form.reorder_level}
                                onChange={set('reorder_level')}
                            />
                        </Field>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'flex-end',
                            marginTop: 8,
                        }}
                    >
                        <Btn variant="secondary" onClick={() => navigate(`${basePath}/products`)}>
                            Annuler
                        </Btn>
                        <Btn onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Création...' : 'Créer le produit'}
                        </Btn>
                    </div>
                </div>

                {/* ── Panneau latéral ──────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Conseils */}
                    <div
                        style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: 14,
                            padding: 18,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#1D4ED8',
                                marginBottom: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Icon name="info" size={14} color="#3B82F6" /> Conseils
                            </span>
                        </div>
                        {[
                            'Le SKU sera généré automatiquement si vous le laissez vide.',
                            'Le stock minimum déclenche une alerte critique.',
                            'Le niveau de réapprovisionnement déclenche une alerte stock bas.',
                            'Une marge de 20%+ est généralement recommandée.',
                        ].map((tip, i) => (
                            <div
                                key={i}
                                style={{
                                    fontSize: 12.5,
                                    color: '#1E40AF',
                                    marginBottom: 6,
                                    display: 'flex',
                                    gap: 6,
                                }}
                            >
                                <span style={{ flexShrink: 0 }}>•</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Modal nouvelle catégorie ───────────────────────── */}
            {showCatModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 28,
                            width: 380,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        }}
                    >
                        <h3
                            style={{
                                margin: '0 0 20px',
                                fontSize: 17,
                                fontWeight: 700,
                                color: '#0F172A',
                            }}
                        >
                            Nouvelle catégorie
                        </h3>
                        <Field label="Nom de la catégorie" required>
                            <Input
                                value={newCatName}
                                onChange={setNewCatName}
                                placeholder="Ex: Mobilier, Électronique..."
                            />
                        </Field>
                        <div
                            style={{
                                display: 'flex',
                                gap: 10,
                                justifyContent: 'flex-end',
                                marginTop: 8,
                            }}
                        >
                            <Btn
                                variant="secondary"
                                onClick={() => {
                                    setShowCatModal(false)
                                    setNewCatName('')
                                }}
                            >
                                Annuler
                            </Btn>
                            <Btn
                                onClick={handleCreateCategory}
                                disabled={creatingCat || !newCatName.trim()}
                            >
                                {creatingCat ? 'Création...' : 'Créer'}
                            </Btn>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
