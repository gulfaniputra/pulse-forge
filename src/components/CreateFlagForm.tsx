'use client';

import { createFlag } from '@/app/actions/flags';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { useActionState, useState } from 'react';
import Editor from 'react-simple-code-editor';

interface CreateFlagFormProps {
  tenantId: string;
  tenantSlug: string;
}

export function CreateFlagForm({ tenantId, tenantSlug }: CreateFlagFormProps) {
  const [state, formAction, isPending] = useActionState(createFlag, {
    success: false,
    errors: {},
  });

  const [targetingRules, setTargetingRules] = useState('{ "rules": [], "defaultVariant": false }');

  const errors = state.errors as Record<string, string[] | undefined> | undefined;

  return (
    <form action={formAction} className="nordic-card space-y-5">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="key" className="nordic-label">
            Flag Key *
          </label>
          <input
            id="key"
            name="key"
            type="text"
            required
            className="nordic-input"
            placeholder="e.g., new-checkout"
          />
          {errors?.key && <p className="text-xs text-nordic-red mt-1.5">{errors.key.join(', ')}</p>}
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
            className="nordic-input"
            placeholder="New Checkout Flow"
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
          className="nordic-input resize-y"
          placeholder="Describe the purpose of this flag"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label htmlFor="type" className="nordic-label">
            Type
          </label>
          <select id="type" name="type" className="nordic-input" defaultValue="boolean">
            <option value="boolean">Boolean</option>
            <option value="multivariate">Multivariate</option>
          </select>
        </div>

        <div>
          <label htmlFor="environment" className="nordic-label">
            Environment
          </label>
          <select
            id="environment"
            name="environment"
            className="nordic-input"
            defaultValue="production"
          >
            <option value="production">Production</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="test">Test</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="targetingRules" className="nordic-label">
          Targeting Rules (JSON)
        </label>

        {/* Template selector */}
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

        {/* JSON editor */}
        <div className="rounded-xl overflow-hidden border border-nordic-polar bg-nordic-navy">
          <Editor
            value={targetingRules}
            onValueChange={(code) => setTargetingRules(code)}
            highlight={(code) => highlight(code, languages.json, 'json')}
            padding={12}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: '#2E3440', // nordic-navy
              color: '#D8DEE9', // nordic-frost
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
          className="h-4 w-4 rounded border-nordic-polar bg-nordic-navy text-nordic-cyan focus:ring-nordic-cyan focus:ring-offset-nordic-dark"
        />
        <label htmlFor="isEnabled" className="text-sm text-nordic-frost">
          Enable flag immediately
        </label>
      </div>

      {errors?._form && (
        <div className="bg-nordic-red bg-opacity-10 border border-nordic-red border-opacity-20 rounded-xl p-3 text-sm text-nordic-red">
          {errors._form.join(', ')}
        </div>
      )}

      {state.success && (
        <div className="bg-nordic-green bg-opacity-10 border border-nordic-green border-opacity-20 rounded-xl p-3 text-sm text-nordic-green">
          Flag created successfully!
        </div>
      )}

      <button type="submit" disabled={isPending} className="nordic-button-primary w-full sm:w-auto">
        {isPending ? 'Creating...' : 'Create Flag'}
      </button>
    </form>
  );
}
