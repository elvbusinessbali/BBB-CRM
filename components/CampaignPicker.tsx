'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdCampaigns, type AdCampaign } from '@/lib/supabase/queries';
import { useT } from '@/lib/i18n/LanguageProvider';

/**
 * Dropdown to attribute a customer to an ad campaign. Empty selection means "none".
 */
export function CampaignPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { t } = useT();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const list = await getAdCampaigns(supabase);
        setCampaigns(list);
      } catch {
        /* ignore - campaign picker is non-essential */
      }
    })();
  }, []);

  if (campaigns.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        {t('noCampaignsHintForCustomer')}
      </p>
    );
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand"
    >
      <option value="">— {t('campaignNone')} —</option>
      {campaigns.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.source ? ` (${c.source})` : ''}
        </option>
      ))}
    </select>
  );
}
