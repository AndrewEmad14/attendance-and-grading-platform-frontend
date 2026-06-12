import type { Submission } from '@/modules/grading/types'
import { api } from '@/utils/api'
import type { CreateSubmissionPayload, MissingStudent } from '../types'

/* ─────────────────────────────────────────────────────────────
 * Reads
 * ──────────────────────────────────────────────────────────── */

/** List all submissions for a deliverable (Track Admin: all; Instructor: own group). */
export async function getDeliverableSubmissions(deliverableId: number): Promise<Submission[]> {
  const res = await api.get<{ data: Submission[] }>(`/deliverables/${deliverableId}/submissions`)
  return res.data
}

/** The students in the roster who have not submitted for a deliverable. */
export async function getMissingStudents(deliverableId: number): Promise<MissingStudent[]> {
  const res = await api.get<{ data: MissingStudent[] }>(`/deliverables/${deliverableId}/missing`)
  return res.data
}

/** A single student's submissions across deliverables (student sees own; ACC-4). */
export async function getStudentSubmissions(studentId: number): Promise<Submission[]> {
  const res = await api.get<{ data: Submission[] }>(`/students/${studentId}/submissions`)
  return res.data
}

/** A single submission by id. */
export async function getSubmission(submissionId: number): Promise<Submission> {
  const res = await api.get<{ data: Submission }>(`/submissions/${submissionId}`)
  return res.data
}

/* ─────────────────────────────────────────────────────────────
 * Writes
 * ──────────────────────────────────────────────────────────── */

/**
 * Submit a deliverable as a URL or a file (POR-4).
 *
 * URL  → application/x-www-form-urlencoded (matches the schema)
 * File → multipart/form-data (required for binary; not yet in the schema)
 *
 * The server derives status (completed | late), days_late and penalty —
 * never send those from the client.
 */
export async function submitDeliverable(
  deliverableId: number,
  payload: CreateSubmissionPayload,
): Promise<Submission> {
  const endpoint = `/deliverables/${deliverableId}/submissions`

  if (payload.type === 'file') {
    const form = new FormData()
    form.append('submission_type', 'file')
    form.append('file', payload.file)
    // Let the browser set the multipart boundary — do not set Content-Type.
    const res = await api.post<{ data: Submission }>(endpoint, form)
    return res.data
  }

  const body = new URLSearchParams()
  body.append('submission_type', 'url')
  body.append('url', payload.url)
  const res = await api.post<{ data: Submission }>(endpoint, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data
}

/**
 * Grade a submission — sets the raw score (GRD-4).
 * Body is { raw_score } per the schema. Instructor on own group;
 * server normalizes raw_score onto the component weight.
 */
export async function gradeSubmission(submissionId: number, rawScore: number): Promise<Submission> {
  const res = await api.patch<{ data: Submission }>(`/submissions/${submissionId}`, {
    raw_score: rawScore,
  })
  return res.data
}

/**
 * Track Admin override of a grade (GRD-6).
 * Requires a justification note (≥10 chars, enforced in the UI).
 * Original value is retained server-side for audit.
 */
export async function overrideSubmission(
  submissionId: number,
  overrideScore: number,
  note: string,
): Promise<Submission> {
  const res = await api.post<{ data: Submission }>(`/submissions/${submissionId}/override`, {
    override_score: overrideScore,
    override_note: note,
  })
  return res.data
}

/** Delete a submission (Track Admin). */
export async function deleteSubmission(submissionId: number): Promise<void> {
  await api.delete(`/submissions/${submissionId}`)
}
