import { pool } from '../db'

export interface GrantEnrollmentParams {
  userId: string
  courseId: string
  orderId?: string | null
  source: 'payment' | 'admin' | 'free'
  grantedBy?: string | null
}

export interface EnrollmentRecord {
  id: string
  user_id: string
  course_id: string
  order_id: string | null
  status: 'active' | 'revoked'
  source: 'payment' | 'admin' | 'free'
  granted_at: string
  granted_by: string | null
}

/**
 * Helper function to grant or reactivate an individual course enrollment idempotently
 */
async function grantSingleCourseEnrollment({
  userId,
  courseId,
  orderId = null,
  source,
  grantedBy = null,
}: GrantEnrollmentParams): Promise<{ enrollment: EnrollmentRecord; wasAlreadyActive: boolean }> {
  // Check if an enrollment record already exists
  const existingRes = await pool.query<EnrollmentRecord>(
    'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1;',
    [userId, courseId]
  )

  if (existingRes.rows.length > 0) {
    const existing = existingRes.rows[0]

    // Already active -> no-op
    if (existing.status === 'active') {
      return {
        enrollment: existing,
        wasAlreadyActive: true,
      }
    }

    // Revoked -> reactivate
    const updateRes = await pool.query<EnrollmentRecord>(
      `UPDATE enrollments 
       SET status = 'active',
           source = $1,
           order_id = COALESCE($2, order_id),
           granted_by = $3,
           granted_at = timezone('utc'::text, now())
       WHERE id = $4
       RETURNING *;`,
      [source, orderId, grantedBy, existing.id]
    )

    return {
      enrollment: updateRes.rows[0],
      wasAlreadyActive: false,
    }
  }

  // Insert brand new enrollment
  const insertRes = await pool.query<EnrollmentRecord>(
    `INSERT INTO enrollments (user_id, course_id, order_id, status, source, granted_at, granted_by)
     VALUES ($1, $2, $3, 'active', $4, timezone('utc'::text, now()), $5)
     RETURNING *;`,
    [userId, courseId, orderId, source, grantedBy]
  )

  return {
    enrollment: insertRes.rows[0],
    wasAlreadyActive: false,
  }
}

/**
 * Reusable function to grant or reactivate a course enrollment.
 * Used by admin manual assignment, free enrollment, and Cashfree payment webhook.
 *
 * If the course is a bundle package (is_package = true), this also grants enrollments
 * for each individual course included in the package.
 */
export async function grantEnrollment(
  params: GrantEnrollmentParams
): Promise<{ enrollment: EnrollmentRecord; wasAlreadyActive: boolean }> {
  // 1. Grant enrollment for the primary course or package
  const result = await grantSingleCourseEnrollment(params)

  // 2. If it's a bundle package, grant enrollments for all bundle items
  try {
    const courseRes = await pool.query<{ is_package: boolean }>(
      'SELECT is_package FROM courses WHERE id = $1 LIMIT 1;',
      [params.courseId]
    )

    if (courseRes.rows[0]?.is_package) {
      const itemsRes = await pool.query<{ course_id: string }>(
        'SELECT course_id FROM course_bundle_items WHERE bundle_id = $1 ORDER BY position ASC;',
        [params.courseId]
      )

      for (const item of itemsRes.rows) {
        await grantSingleCourseEnrollment({
          userId: params.userId,
          courseId: item.course_id,
          orderId: params.orderId,
          source: params.source,
          grantedBy: params.grantedBy,
        })
      }
    }
  } catch (err) {
    console.error(`[EnrollmentService] Error processing bundle items for package ${params.courseId}:`, err)
  }

  return result
}

/**
 * Revokes an active enrollment (does NOT automatically revoke bundle items)
 */
export async function revokeEnrollment(
  enrollmentId: string
): Promise<EnrollmentRecord | null> {
  const res = await pool.query<EnrollmentRecord>(
    `UPDATE enrollments 
     SET status = 'revoked'
     WHERE id = $1
     RETURNING *;`,
    [enrollmentId]
  )

  return res.rows[0] || null
}

/**
 * Reactivates a revoked enrollment
 */
export async function reactivateEnrollment(
  enrollmentId: string,
  grantedBy?: string | null
): Promise<EnrollmentRecord | null> {
  const res = await pool.query<EnrollmentRecord>(
    `UPDATE enrollments 
     SET status = 'active',
         granted_at = timezone('utc'::text, now()),
         granted_by = COALESCE($2, granted_by)
     WHERE id = $1
     RETURNING *;`,
    [enrollmentId, grantedBy || null]
  )

  return res.rows[0] || null
}
