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

  const errors = state.errors as Record<string, string[] | undefined> | undefined;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm('Delete this flag permanently?')) {
          e.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={flagId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />

      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-nordic-red hover:text-nordic-red hover:text-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>

      {errors?._form && <p className="text-xs text-nordic-red mt-1.5">{errors._form.join(', ')}</p>}
    </form>
  );
}
