'use client';

import { updateFlag } from '@/app/actions/flags';
import { useActionState } from 'react';

interface EditFlagFormProps {
  tenantId: string;
  tenantSlug: string;
  initialData: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    type: 'boolean' | 'multivariate';
    isEnabled: boolean;
    environment: string;
    targetingRules: string;
  };
}

export function EditFlagForm({ tenantId, tenantSlug, initialData }: EditFlagFormProps) {
  const [state, formAction, isPending] = useActionState(updateFlag, {
    success: false,
    errors: {},
  });

  // Cast errors to a `Record` so it can safely access any string key.
  const errors = state.errors as Record<string, string[] | undefined> | undefined;

  return (
    <form
      action={formAction}
      className="border border-slate-800 rounded-xl p-5 bg-slate-950/30 space-y-4"
    >
      <input type="hidden" name="id" value={initialData.id} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Flag Key</label>
          <input
            type="text"
            value={initialData.key}
            disabled
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-slate-400 mb-1">
            Display Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initialData.name}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors?.name && <p className="text-xs text-red-400 mt-1">{errors.name.join(', ')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-400 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initialData.description || ''}
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-slate-400 mb-1">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initialData.type}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="boolean">Boolean</option>
            <option value="multivariate">Multivariate</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Environment</label>
          <input
            type="text"
            value={initialData.environment}
            disabled
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label htmlFor="targetingRules" className="block text-xs font-medium text-slate-400 mb-1">
          Targeting Rules (JSON)
        </label>
        <textarea
          id="targetingRules"
          name="targetingRules"
          rows={4}
          defaultValue={initialData.targetingRules}
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        />
        {errors?.targetingRules && (
          <p className="text-xs text-red-400 mt-1">{errors.targetingRules.join(', ')}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isEnabled"
          name="isEnabled"
          type="checkbox"
          value="true"
          defaultChecked={initialData.isEnabled}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
        />
        <label htmlFor="isEnabled" className="text-sm text-slate-300">
          Enable flag
        </label>
      </div>

      {errors?._form && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
          {errors._form.join(', ')}
        </div>
      )}
      {state.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-sm text-emerald-400">
          Flag updated successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Updating...' : 'Update Flag'}
      </button>
    </form>
  );
}
