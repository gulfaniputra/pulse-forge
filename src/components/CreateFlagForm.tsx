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

  // Controlled state for the JSON editor.
  const [targetingRules, setTargetingRules] = useState('{ "rules": [], "defaultVariant": false }');

  return (
    <form
      action={formAction}
      className="border border-slate-800 rounded-xl p-5 bg-slate-950/30 space-y-4"
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="slug" value={tenantSlug} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="key" className="block text-xs font-medium text-slate-400 mb-1">
            Flag Key *
          </label>
          <input
            id="key"
            name="key"
            type="text"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., new-checkout"
          />
          {state.errors && 'key' in state.errors && state.errors.key && (
            <p className="text-xs text-red-400 mt-1">{state.errors.key.join(', ')}</p>
          )}
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
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="New Checkout Flow"
          />
          {state.errors && 'name' in state.errors && state.errors.name && (
            <p className="text-xs text-red-400 mt-1">{state.errors.name.join(', ')}</p>
          )}
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
          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Describe the purpose of this flag"
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
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue="boolean"
          >
            <option value="boolean">Boolean</option>
            <option value="multivariate">Multivariate</option>
          </select>
        </div>

        <div>
          <label htmlFor="environment" className="block text-xs font-medium text-slate-400 mb-1">
            Environment
          </label>
          <select
            id="environment"
            name="environment"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <label htmlFor="targetingRules" className="block text-xs font-medium text-slate-400 mb-1">
          Targeting Rules (JSON)
        </label>

        {/* Quick Template Selector */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-slate-400 mb-1">Quick Template</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                setTargetingRules(e.target.value);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Syntax-Highlighted JSON Editor */}
        <Editor
          value={targetingRules}
          onValueChange={(code) => setTargetingRules(code)}
          highlight={(code) => highlight(code, languages.json, 'json')}
          padding={10}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 14,
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            borderRadius: '0.375rem',
            border: '1px solid #334155',
            minHeight: '120px',
          }}
          textareaId="targetingRules"
          name="targetingRules" // This ensures the Server Action receives the value.
        />

        {state.errors && 'targetingRules' in state.errors && state.errors.targetingRules && (
          <p className="text-xs text-red-400 mt-1">{state.errors.targetingRules.join(', ')}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isEnabled"
          name="isEnabled"
          type="checkbox"
          value="true"
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
        />
        <label htmlFor="isEnabled" className="text-sm text-slate-300">
          Enable flag immediately
        </label>
      </div>

      {state.errors && '_form' in state.errors && state.errors._form && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
          {state.errors._form.join(', ')}
        </div>
      )}

      {state.success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 text-sm text-emerald-400">
          Flag created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Flag'}
      </button>
    </form>
  );
}
