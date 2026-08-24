'use client';

import { updateFlag } from '@/app/actions/flags';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { useActionState, useState } from 'react';
import Editor from 'react-simple-code-editor';

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

  const [targetingRules, setTargetingRules] = useState(initialData.targetingRules);
  const errors = state.errors as Record<string, string[] | undefined> | undefined;

  return (
    <form action={formAction} className="nordic-card space-y-5">
      <input type="hidden" name="id" value={initialData.id} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="nordic-label">Flag Key</label>
          <input
            type="text"
            value={initialData.key}
            disabled
            className="w-full bg-nordic-navy bg-opacity-60 border border-nordic-polar rounded-xl px-5 py-3.5 text-sm text-nordic-polar cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="name" className="nordic-label">
            Display Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initialData.name}
            className="nordic-input"
          />
          {errors?.name && (
            <p className="text-xs text-nordic-red mt-1.5">{errors.name.join(', ')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="nordic-label">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initialData.description || ''}
          className="nordic-input resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label htmlFor="type" className="nordic-label">
            Type
          </label>
          <select id="type" name="type" defaultValue={initialData.type} className="nordic-input">
            <option value="boolean">Boolean</option>
            <option value="multivariate">Multivariate</option>
          </select>
        </div>

        <div>
          <label className="nordic-label">Environment</label>
          <input
            type="text"
            value={initialData.environment}
            disabled
            className="w-full bg-nordic-navy bg-opacity-60 border border-nordic-polar rounded-xl px-5 py-3.5 text-sm text-nordic-polar cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label htmlFor="targetingRules" className="nordic-label">
          Targeting Rules (JSON)
        </label>

        <div className="mb-2.5">
          <label className="nordic-label text-[9px]">Quick Template</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                setTargetingRules(e.target.value);
              }
            }}
            className="nordic-input"
            defaultValue=""
          >
            <option value="">-- Select a template --</option>
            <option value='{"rules":[{"id":"rule1","name":"100% Rollout","conditions":[{"attribute":"email","operator":"contains","value":"@company.com"}],"variant":true}],"defaultVariant":false}'>
              Boolean: Email Contains
            </option>
            <option value='{"variants":[{"key":"small","value":"small"},{"key":"large","value":"large"}],"rules":[{"id":"rule1","name":"Region US","conditions":[{"attribute":"country","operator":"equals","value":"US"}],"variant":"large"}],"defaultVariant":"small"}'>
              Multivariate: Region Split
            </option>
          </select>
        </div>

        <div className="rounded-xl overflow-hidden border border-nordic-polar bg-nordic-navy">
          <Editor
            value={targetingRules}
            onValueChange={(code) => setTargetingRules(code)}
            highlight={(code) => highlight(code, languages.json, 'json')}
            padding={12}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: '#2E3440',
              color: '#D8DEE9',
              minHeight: '120px',
            }}
            textareaId="targetingRules"
            name="targetingRules"
          />
        </div>

        {errors?.targetingRules && (
          <p className="text-xs text-nordic-red mt-1.5">{errors.targetingRules.join(', ')}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isEnabled"
          name="isEnabled"
          type="checkbox"
          value="true"
          defaultChecked={initialData.isEnabled}
          className="h-4 w-4 rounded border-nordic-polar bg-nordic-navy text-nordic-cyan focus:ring-nordic-cyan focus:ring-offset-nordic-dark"
        />
        <label htmlFor="isEnabled" className="text-sm text-nordic-frost">
          Enable flag
        </label>
      </div>

      {errors?._form && (
        <div className="bg-nordic-red bg-opacity-10 border border-nordic-red border-opacity-20 rounded-xl p-3 text-sm text-nordic-red">
          {errors._form.join(', ')}
        </div>
      )}

      {state.success && (
        <div className="bg-nordic-green bg-opacity-10 border border-nordic-green border-opacity-20 rounded-xl p-3 text-sm text-nordic-green">
          Flag updated successfully!
        </div>
      )}

      <button type="submit" disabled={isPending} className="nordic-button-primary w-full sm:w-auto">
        {isPending ? 'Updating...' : 'Update Flag'}
      </button>
    </form>
  );
}
