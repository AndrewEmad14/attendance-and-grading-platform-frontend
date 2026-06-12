<template>
  <div
    class="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-surface-200 shadow-xs max-w-xl mx-auto my-12"
  >
    <div
      class="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center text-2xl mb-4 animate-pulse"
    >
      <i class="pi pi-shield"></i>
    </div>
    <h2 class="text-2xl font-bold text-surface-900 tracking-tight mb-2">Access Restricted</h2>
    <p class="text-surface-500 text-sm max-w-sm mb-6">
      Your current user role profile does not possess clear permissions to inspect this operational
      module matrix.
    </p>
    <RouterLink to="/" class="btn btn-primary btn-sm px-6 text-white">
      Return to Safety
    </RouterLink>
  </div>
</template>
