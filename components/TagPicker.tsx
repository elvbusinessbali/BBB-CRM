'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  createBusinessTag,
  getBusinessTags,
  getMyBusiness,
  type BusinessTag,
  type TagColor,
  TAG_COLORS,
} from '@/lib/supabase/queries';
import { useT } from '@/lib/i18n/LanguageProvider';

/**
 * Multi-select tag picker. Selected tags are stored as a string[] (tag names) so they
 * map directly to the existing customers.tags column. Users can create new tags on
 * the fly — those get persisted to business_tags so the next customer sees them too.
 */
export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useT();
  const [tags, setTags] = useState<BusinessTag[]>([]);
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState<TagColor>('pink');
  const [adding, setAdding] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const [biz, ts] = await Promise.all([
          getMyBusiness(supabase),
          getBusinessTags(supabase),
        ]);
        setBusinessId(biz.id);
        setTags(ts);
      } catch {
        /* ignore - tag picker is non-essential */
      }
    })();
  }, []);

  function toggle(name: string) {
    if (value.includes(name)) onChange(value.filter((n) => n !== name));
    else onChange([...value, name]);
  }

  async function addNew() {
    const name = draft.trim();
    if (!name || !businessId) return;
    setAdding(true);
    try {
      const supabase = createClient();
      const existing = tags.find((tg) => tg.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        if (!value.includes(existing.name)) onChange([...value, existing.name]);
      } else {
        const created = await createBusinessTag(supabase, businessId, name, draftColor);
        setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        onChange([...value, created.name]);
      }
      setDraft('');
    } catch {
      /* swallow */
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <p className="text-xs text-neutral-500">{t('noTagsYet')}</p>
        ) : (
          tags.map((tg) => (
            <button
              key={tg.id}
              type="button"
              onClick={() => toggle(tg.name)}
              className={`text-xs rounded-full px-2.5 py-1 border ${
                value.includes(tg.name)
                  ? `${colorClass(tg.color).bg} ${colorClass(tg.color).text} ${colorClass(tg.color).border}`
                  : 'bg-white text-neutral-700 border-neutral-200'
              }`}
            >
              {tg.name}
            </button>
          ))
        )}
        {/* Tags on the customer that aren't in the catalog (legacy / mistyped) */}
        {value
          .filter((v) => !tags.some((tg) => tg.name === v))
          .map((extra) => (
            <button
              key={extra}
              type="button"
              onClick={() => toggle(extra)}
              className="text-xs rounded-full px-2.5 py-1 border bg-neutral-100 text-neutral-700 border-neutral-200"
              title={t('removeTag')}
            >
              {extra} ✕
            </button>
          ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNew();
            }
          }}
          placeholder={t('newTagPlaceholder')}
          className="flex-1 border border-neutral-200 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <select
          value={draftColor}
          onChange={(e) => setDraftColor(e.target.value as TagColor)}
          className="border border-neutral-200 bg-white rounded-xl px-2 py-2 text-sm"
        >
          {TAG_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={addNew}
          disabled={!draft.trim() || adding}
          className="rounded-full bg-brand text-white text-sm px-3 py-2 font-medium disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

function colorClass(color: string) {
  switch (color) {
    case 'rose':    return { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300' };
    case 'sky':     return { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-300' };
    case 'emerald': return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };
    case 'amber':   return { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300' };
    case 'violet':  return { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300' };
    case 'pink':
    default:        return { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300' };
  }
}
