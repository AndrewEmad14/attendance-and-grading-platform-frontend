import { useToast } from 'primevue/usetoast'

/**
 * Centralized toast helpers for the cohorts module (option B: presentation-only
 * error handling). The service layer wraps failures as `Error('Failed to... ' + msg)`;
 * we surface that message uniformly here rather than threading status/422 through
 * the API layer. If richer 422 field-level handling is needed later, this is the
 * single place to upgrade.
 */
export function useCohortToast() {
  const toast = useToast()

  function success(summary: string, detail?: string) {
    toast.add({ severity: 'success', summary, detail, life: 3000 })
  }

  /**
   * Surface a caught error as a toast. `context` is a short human label for what
   * failed (e.g. "Save failed"); the error's message provides the detail.
   */
  function failure(context: string, err: unknown) {
    const detail = err instanceof Error ? err.message : 'An unexpected error occurred.'
    // 5s for errors — users need longer to read a failure (esp. LC-1 conflicts).
    toast.add({ severity: 'error', summary: context, detail, life: 5000 })
  }

  return { success, failure }
}
