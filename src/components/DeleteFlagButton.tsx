'use client';

import { deleteFlag } from '@/app/actions/flags';
import { useActionState } from 'react';

interface DeleteFlagButtonProps {
  flagId: string;
  tenantId: string;
  tenantSlug: string;
}

export function DeleteFlagButton({ flagId, tenantId, tenantSlug }: DeleteFlagButtonProps) {
  const [state, formAction, isPending] = useActionState(deleteFlag, {
    success: false,
    errors: {},
  });

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm('Delete this flag permanently?')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={flagId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
      {state.errors && '_form' in state.errors && (
        <p className="text-xs text-red-400 mt-1">{state.errors._form.join(', ')}</p>
      )}
    </form>
  );
}
