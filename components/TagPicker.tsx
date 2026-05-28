'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  createBusinessTag,
  deleteBusinessTag,
  getBusinessTags,
  getMyBusiness,
  renameBusinessTag,
  type BusinessTag,
  type TagColor,
  TAG_COLORS,
} from '@/lib/supabase/queries';
import { useT } from '@/lib/i18n/LanguageProvider';

/**
 * Multi-select tag picker. Selected tags are stored as a string[] (tag names) so they
 * map directly to the existing customers.tags column. Users can create new tags on
 * the fly — those get persisted to business_tags so the next customer sees them too.
 *
 * Tapping "Manage tags" opens a sheet where they can rename or delete tags from the
 * business-wide catalog.
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
  const [showManage, setShowManage] = useState(false);

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
      <div className="flex flex-wrap gap-1.5 items-center">
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

      {tags.length > 0 && (
        <button
          type="button"
          onClick={() => setShowManage(true)}
          className="text-xs text-neutral-600 underline self-start"
        >
          {t('manageTags')}
        </button>
      )}

      {showManage && (
        <TagManagerSheet
          tags={tags}
          onClose={() => setShowManage(false)}
          onRename={async (id, newName, newColor) => {
            try {
              const supabase = createClient();
              const updated = await renameBusinessTag(supabase, id, newName, newColor);
              const old = tags.find((tg) => tg.id === id);
              setTags((prev) =>
                prev
                  .map((tg) => (tg.id === id ? updated : tg))
                  .sort((a, b) => a.name.localeCompare(b.name))
              );
              // also propagate to selected tags on this customer if it was selected
              if (old && value.includes(old.name)) {
                onChange(value.map((n) => (n === old.name ? updated.name : n)));
              }
            } catch {
              /* swallow */
            }
          }}
          onDelete={async (id) => {
            try {
              const supabase = createClient();
              const old = tags.find((tg) => tg.id === id);
              await deleteBusinessTag(supabase, id);
              setTags((prev) => prev.filter((tg) => tg.id !== id));
              if (old && value.includes(old.name)) {
                onChange(value.filter((n) => n !== old.name));
              }
            } catch {
              /* swallow */
            }
          }}
        />
      )}
    </div>
  );
}

function TagManagerSheet({
  tags,
  onClose,
  onRename,
  onDelete,
}: {
  tags: BusinessTag[];
  onClose: () => void;
  onRename: (id: string, newName: string, newColor?: TagColor) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg">{t('manageTags')}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 text-xl px-2">✕</button>
        </div>
        {tags.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('noTagsYet')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tags.map((tg) => (
              <ManagedTagRow key={tg.id} tag={tg} onRename={onRename} onDelete={onDelete} />
            ))}
          </ul>
        )}
        <p className="text-xs text-neutral-500 mt-2">{t('manageTagsHint')}</p>
      </div>
    </div>
  );
}

function ManagedTagRow({
  tag,
  onRename,
  onDelete,
}: {
  tag: BusinessTag;
  onRename: (id: string, newName: string, newColor?: TagColor) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useT();
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState<TagColor>((tag.color as TagColor) ?? 'pink');
  const [busy, setBusy] = useState(false);
  const c = colorClass(color);
  const dirty = name.trim() !== tag.name || color !== tag.color;

  async function handleSave() {
    if (!name.trim() || !dirty) return;
    setBusy(true);
    await onRename(tag.id, name, color);
    setBusy(false);
  }
  async function handleDelete() {
    if (!confirm(t('confirmDeleteTag').replace('{name}', tag.name))) return;
    setBusy(true);
    await onDelete(tag.id);
  }

  return (
    <li className="flex items-center gap-2 border border-neutral-200 rounded-2xl px-3 py-2">
      <span className={`inline-block h-3 w-3 rounded-full ${c.bg} ${c.border} border`} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 border-none outline-none text-sm bg-transparent"
      />
      <select
        value={color}
        onChange={(e) => setColor(e.target.value as TagColor)}
        className="text-xs border border-neutral-200 rounded-lg px-1 py-1"
      >
        {TAG_COLORS.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || busy}
        className="text-xs px-2 py-1 rounded-full bg-brand text-white disabled:opacity-40"
      >
        {t('save')}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="text-xs px-2 py-1 rounded-full text-red-600"
        aria-label={t('delete')}
        title={t('delete')}
      >
        🗑
      </button>
    </li>
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
