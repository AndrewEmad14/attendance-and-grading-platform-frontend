import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { Submission, CourseDeliverable } from '@/modules/grading/types'

/**
 * useLatePenalty — client-side late-penalty math (ENG-1 / ENG-2).
 *
 * The SERVER is the source of truth: a graded Submission already carries
 * `effective_raw_score` and `normalized_score`. This composable is display-only:
 *   1. Breakdown of an existing submission (days late, %, points lost) with no
 *      round-trip — pass the submission + its deliverable.
 *   2. Live "submit now" preview before a submission exists — use
 *      `previewLatePenalty(deliverable)` instead, which compares the deadline
 *      against the current time.
 *
 * Rule (from the spec):
 *   daysLate   = ceil( max(0, submittedAt - deadline) in whole days )
 *   penaltyPct = min(daysLate * 25, 100)
 *   adjusted   = round( rawScore * (1 - penaltyPct / 100), 1 )
 *
 * Any lateness within the first 24h counts as 1 full day. Compare both
 * timestamps as absolute instants (store/serve UTC to keep this correct).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24
const PENALTY_PER_DAY = 25 // percent

export interface LatePenaltyResult {
  /** Whole days late, 0 if on time. */
  daysLate: number
  /** Penalty as a percentage 0–100. */
  penaltyPct: number
  /** True once any lateness exists. */
  isLate: boolean
  /** rawScore after penalty, rounded to 1 dp. null if rawScore is null. */
  adjustedScore: number | null
  /** Points lost to the penalty, rounded to 1 dp. null if rawScore is null. */
  pointsLost: number | null
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Core math. Kept pure (no Vue, no domain objects) so it's trivially testable
 * against the spec's worked examples. The object-shaped APIs below delegate here.
 */
export function computeLatePenalty(
  deadline: string | Date | null | undefined,
  submittedAt: string | Date | null | undefined,
  rawScore: number | null | undefined,
  now: Date = new Date(),
): LatePenaltyResult {
  const due = toDate(deadline)
  // No submission timestamp → preview against `now` ("if you submit now…").
  const submitted = toDate(submittedAt) ?? now
  const raw = rawScore ?? null

  if (!due) {
    return {
      daysLate: 0,
      penaltyPct: 0,
      isLate: false,
      adjustedScore: raw,
      pointsLost: raw === null ? null : 0,
    }
  }

  const diffMs = submitted.getTime() - due.getTime()
  const daysLate = diffMs > 0 ? Math.ceil(diffMs / MS_PER_DAY) : 0
  const penaltyPct = Math.min(daysLate * PENALTY_PER_DAY, 100)
  const isLate = daysLate > 0

  if (raw === null) {
    return { daysLate, penaltyPct, isLate, adjustedScore: null, pointsLost: null }
  }

  const adjustedScore = round1(raw * (1 - penaltyPct / 100))
  const pointsLost = round1(raw - adjustedScore)

  return { daysLate, penaltyPct, isLate, adjustedScore, pointsLost }
}

function label(r: LatePenaltyResult): string {
  if (!r.isLate) return 'On time'
  const dayWord = r.daysLate === 1 ? 'day' : 'days'
  return `${r.daysLate} ${dayWord} late (${r.penaltyPct}% off)`
}

/**
 * Pure preview for a deliverable with no submission yet — compares its
 * `due_date` against `now`. Use this on the submit screen before the student
 * has a submission row. rawScore is unknown pre-grading, so the score fields
 * come back null; daysLate / penaltyPct still populate.
 */
export function previewLatePenalty(
  deliverable: Pick<CourseDeliverable, 'due_date'>,
  now: Date = new Date(),
): LatePenaltyResult {
  return computeLatePenalty(deliverable.due_date, null, null, now)
}

/**
 * Reactive composable. Takes the submission and its deliverable (refs, getters,
 * or plain objects) and derives the penalty breakdown from
 * `deliverable.due_date`, `submission.submitted_at`, and `submission.raw_score`.
 *
 * @example
 *   const { isLate, penaltyPct, pointsLost, label } = useLatePenalty(
 *     () => sub,
 *     () => deliverable,
 *   )
 */
export function useLatePenalty(
  submission: MaybeRefOrGetter<Submission | null | undefined>,
  deliverable: MaybeRefOrGetter<CourseDeliverable | null | undefined>,
  now?: MaybeRefOrGetter<Date | undefined>,
) {
  const result = computed<LatePenaltyResult>(() => {
    const sub = toValue(submission)
    const d = toValue(deliverable)
    return computeLatePenalty(
      d?.due_date,
      sub?.submitted_at,
      sub?.raw_score,
      toValue(now) ?? new Date(),
    )
  })

  return {
    result,
    daysLate: computed(() => result.value.daysLate),
    penaltyPct: computed(() => result.value.penaltyPct),
    isLate: computed(() => result.value.isLate),
    adjustedScore: computed(() => result.value.adjustedScore),
    pointsLost: computed(() => result.value.pointsLost),
    /** "On time" | "1 day late (25% off)" | "4 days late (100% off)" */
    label: computed(() => label(result.value)),
  }
}
