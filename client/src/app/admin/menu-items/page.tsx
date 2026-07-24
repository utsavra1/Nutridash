'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card } from '../../../components/Card'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { Badge } from '../../../components/Badge'
import { adminApi } from '../../../lib/api'
import { useAuthStore } from '../../../stores/auth-store'
import { MenuItem } from '../../../types'
import styles from './page.module.css'

const NutritionStatusBadge = ({ status }: { status: string }) => {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    FETCHED: 'success',
    PENDING: 'warning',
    FAILED: 'danger'
  }
  return <Badge variant={variantMap[status] || 'default'}>{status}</Badge>
}

const ImageUploadField = ({
  imageUrl,
  onImageUrl,
}: {
  imageUrl: string
  onImageUrl: (url: string) => void
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [previewSrc, setPreviewSrc] = useState(imageUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploadError('')
    setUploading(true)
    // local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewSrc(objectUrl)
    try {
      const url = await adminApi.uploadImage(file)
      onImageUrl(url)
      setPreviewSrc(url)
    } catch {
      setUploadError('Upload failed. Please try again.')
      setPreviewSrc(imageUrl || '')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreviewSrc('')
    onImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <label className={styles.labelText} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        Item Photo
      </label>
      {previewSrc ? (
        <div className={styles.imagePreviewWrapper}>
          <img src={previewSrc} alt="Preview" className={styles.imagePreview} />
          <button type="button" className={styles.removeImageBtn} onClick={handleRemove} title="Remove image">
            ✕
          </button>
        </div>
      ) : (
        <div
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div className={styles.uploadIcon}>📷</div>
          <div className={styles.uploadText}>Click or drag & drop to upload photo</div>
          <div className={styles.uploadHint}>JPG, PNG, WebP or GIF · Max 5MB</div>
        </div>
      )}
      {uploading && (
        <div className={styles.uploadingText}>
          <span className={styles.spinner} />
          Uploading to Cloudinary…
        </div>
      )}
      {uploadError && <div className={styles.errorBanner}>{uploadError}</div>}
    </div>
  )
}

const CreateEditItemModal = ({
  item,
  onClose,
  onSave,
  isSaving,
  saveError,
}: {
  item?: MenuItem | null
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  saveError: string
}) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    priceRs: item?.priceRs || 0,
    category: item?.category || 'Main',
    imageUrl: item?.imageUrl || '',
    isAvailable: item?.isAvailable ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>{item ? 'Edit Menu Item' : 'Create Menu Item'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Item Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <label className={styles.textareaLabel}>
            <span className={styles.labelText}>Description</span>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={styles.textarea}
            />
          </label>
          <Input
            label="Price (Rs.)"
            type="number"
            step="0.01"
            value={formData.priceRs / 100}
            onChange={(e) => setFormData({ ...formData, priceRs: Math.round(parseFloat(e.target.value) * 100) })}
            required
          />
          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
          <ImageUploadField
            imageUrl={formData.imageUrl}
            onImageUrl={(url) => setFormData({ ...formData, imageUrl: url })}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            />
            <span>Item Available</span>
          </label>
          {saveError && <div className={styles.errorBanner}>{saveError}</div>}
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.spinner} /> Saving…
                </span>
              ) : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminMenuItemsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [mutationError, setMutationError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'RESTAURANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/')
    }
  }, [user, router])

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['admin', 'menuItems'],
    queryFn: adminApi.getMenuItems,
    enabled: !!user && (user.role === 'RESTAURANT_ADMIN' || user.role === 'SUPER_ADMIN')
  })

  const createMutation = useMutation({
    mutationFn: adminApi.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menuItems'] })
      setShowModal(false)
      setMutationError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create menu item'
      setMutationError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menuItems'] })
      setShowModal(false)
      setEditingItem(null)
      setMutationError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update menu item'
      setMutationError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMenuItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'menuItems'] })
  })

  const refetchMutation = useMutation({
    mutationFn: adminApi.refetchNutrition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'menuItems'] })
  })

  const handleSave = (data: any) => {
    setMutationError('')
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (!user) return null
  if (isLoading) return <div className={styles.container}>Loading…</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin" className={styles.backLink}>← Back to Dashboard</Link>
        <h1>Manage Menu Items</h1>
        <Button onClick={() => { setMutationError(''); setShowModal(true) }}>+ Add Item</Button>
      </div>
      <div className={styles.grid}>
        {menuItems?.map((item) => (
          <Card key={item.id} className={styles.itemCard}>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
            )}
            <div className={styles.itemHeader}>
              <h2>{item.name}</h2>
              <NutritionStatusBadge status={item.nutritionStatus} />
            </div>
            <p className={styles.price}>Rs. {(item.priceRs / 100).toFixed(2)}</p>
            <p className={styles.category}>Category: {item.category}</p>
            <div className={styles.itemActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setMutationError(''); setEditingItem(item); setShowModal(true) }}
              >
                Edit
              </Button>
              {item.nutritionStatus === 'FAILED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetchMutation.mutate(item.id)}
                  disabled={refetchMutation.isPending}
                >
                  Refetch Nutrition
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {showModal && (
        <CreateEditItemModal
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); setMutationError('') }}
          onSave={handleSave}
          isSaving={isSaving}
          saveError={mutationError}
        />
      )}
    </div>
  )
}