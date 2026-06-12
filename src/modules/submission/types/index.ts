/**
 * A student in the roster who has NOT submitted for a deliverable.
 * Returned by GET /deliverables/{id}/missing. "Missing" is the
 * absence of a submission row, computed server-side at read time.
 */
export interface MissingStudent {
  id: number
  name: string
  lab_group?: { id: number; name: string } | null
}

/**
 * Payload for creating a submission (POR-4: URL or file).
 * NOTE: the OpenAPI schema declares create as
 * application/x-www-form-urlencoded with an empty body, which can
 * only carry the URL case. File upload requires multipart/form-data.
 * This service sends multipart when `file` is present, urlencoded
 * otherwise. Field names (`submission_type`, `url`, `file`) are the
 * working contract — confirm with the backend dev before relying on them.
 */
export type CreateSubmissionPayload = { type: 'url'; url: string } | { type: 'file'; file: File }
