'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '../../../components/Card'
import { Button } from '../../../components/Button'
import { Badge } from '../../../components/Badge'
import { superAdminApi } from '../../../lib/api'
import { User } from '../../../types'
import styles from './page.module.css'

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['superAdmin', 'users'],
    queryFn: superAdminApi.getUsers
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: { isSuspended: boolean } }) => superAdminApi.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superAdmin', 'users'] })
  })

  if (isLoading) return <div className={styles.container}>Loading...</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/super-admin" className={styles.backLink}>← Back to Dashboard</Link>
        <h1>Manage Users</h1>
      </div>
      <div className={styles.grid}>
        {users?.map((user) => (
          <Card key={user.id} className={styles.itemCard}>
            <div className={styles.itemHeader}>
              <h2>{user.name}</h2>
              <Badge variant={user.isSuspended ? 'danger' : 'success'}>
                {user.isSuspended ? 'Suspended' : 'Active'}
              </Badge>
            </div>
            <p>Email: {user.email}</p>
            <p>Role: {user.role.replace('_', ' ')}</p>
            <div className={styles.itemActions}>
              <Button
                variant={user.isSuspended ? 'primary' : 'danger'}
                size="sm"
                onClick={() => updateMutation.mutate({
                  id: user.id,
                  data: { isSuspended: !user.isSuspended }
                })}
              >
                {user.isSuspended ? 'Reinstate' : 'Suspend'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}