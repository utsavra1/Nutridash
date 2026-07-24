'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '../../../components/Card'
import { Button } from '../../../components/Button'
import { Input } from '../../../components/Input'
import { Badge } from '../../../components/Badge'
import { superAdminApi } from '../../../lib/api'
import { useAuthStore } from '../../../stores/auth-store'
import { Restaurant } from '../../../types'
import styles from './page.module.css'

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
    const objectUrl = URL.createObjectURL(file)
    setPreviewSrc(objectUrl)
    try {
      const url = await superAdminApi.uploadImage(file)
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
      <label className={styles.labelText} style={{ display: 'block', marginBottom: '0.5rem' }}>
        Restaurant Photo
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
          <div className={styles.uploadIcon}>🏪</div>
          <div className={styles.uploadText}>Click or drag & drop to upload photo</div>
          <div className={styles.uploadHint}>JPG, PNG, WebP or GIF · Max 5MB · Optional</div>
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

const CreateRestaurantModal = ({
  onClose,
  onSave,
  isSaving,
  saveError,
}: {
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  saveError: string
}) => {
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    address: '',
    imageUrl: '',
    adminEmail: '',
    adminPassword: '',
    adminName: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Create New Restaurant</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Restaurant Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Cuisine Type"
            value={formData.cuisine}
            onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <ImageUploadField
            imageUrl={formData.imageUrl}
            onImageUrl={(url) => setFormData({ ...formData, imageUrl: url })}
          />
          <h3 className={styles.subHeading}>Admin Account</h3>
          <Input
            label="Admin Email"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            required
          />
          <Input
            label="Admin Password"
            type="password"
            value={formData.adminPassword}
            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            required
          />
          <Input
            label="Admin Name"
            value={formData.adminName}
            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
            required
          />
          {saveError && <div className={styles.errorBanner}>{saveError}</div>}
          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={styles.spinner} /> Creating…
                </span>
              ) : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SuperAdminRestaurantsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [mutationError, setMutationError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'SUPER_ADMIN') {
      router.push('/')
    }
  }, [user, router])

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['superAdmin', 'restaurants'],
    queryFn: superAdminApi.getRestaurants,
    enabled: !!user && user.role === 'SUPER_ADMIN'
  })

  const createMutation = useMutation({
    mutationFn: superAdminApi.createRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'restaurants'] })
      setShowModal(false)
      setMutationError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create restaurant'
      setMutationError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => superAdminApi.updateRestaurant(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superAdmin', 'restaurants'] })
  })

  if (!user) return null
  if (isLoading) return <div className={styles.container}>Loading…</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/super-admin" className={styles.backLink}>← Back to Dashboard</Link>
        <h1>Manage Restaurants</h1>
        <Button onClick={() => { setMutationError(''); setShowModal(true) }}>+ Create Restaurant</Button>
      </div>
      <div className={styles.grid}>
        {restaurants?.map((restaurant) => (
          <Card key={restaurant.id} className={styles.itemCard}>
            {restaurant.imageUrl && (
              <img src={restaurant.imageUrl} alt={restaurant.name} className={styles.restaurantImage} />
            )}
            <div className={styles.itemHeader}>
              <h2>{restaurant.name}</h2>
              <Badge variant={restaurant.isActive ? 'success' : 'danger'}>
                {restaurant.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p>Cuisine: {restaurant.cuisine}</p>
            <p>Address: {restaurant.address}</p>
            <div className={styles.itemActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateMutation.mutate({
                  id: restaurant.id,
                  data: { isActive: !restaurant.isActive }
                })}
              >
                {restaurant.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {showModal && (
        <CreateRestaurantModal
          onClose={() => { setShowModal(false); setMutationError('') }}
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          saveError={mutationError}
        />
      )}
    </div>
  )
}