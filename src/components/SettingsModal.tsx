import { useEffect, useState, useRef } from "react";
import { getSettings, saveSettings } from "../lib/db";
import type { AppSettings } from "../lib/types";

const PRESETS: { label: string; base_url: string; icon: React.ReactNode }[] = [
  {
    label: "OpenAI",
    base_url: "https://api.openai.com/v1",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    ),
  },
  {
    label: "OpenRouter",
    base_url: "https://openrouter.ai/api/v1",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: "Groq",
    base_url: "https://api.groq.com/openai/v1",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      </svg>
    ),
  },
  {
    label: "Together AI",
    base_url: "https://api.together.xyz/v1",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function SettingsModal({
  onClose,
  onSettingsChange,
}: {
  onClose: () => void;
  onSettingsChange?: () => Promise<void>;
}) {
  const [settings, setSettings] = useState<AppSettings>({
    base_url: "https://api.openai.com/v1",
    api_key: "",
    model: "gpt-4o-mini",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const baseUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      if (onSettingsChange) {
        await onSettingsChange();
      }
    } finally {
      setSaving(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="modal-content w-full max-w-[520px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 id="settings-title" className="text-headline text-ink">تنظیمات دستیار PRIOR</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-line/50 transition-all duration-fast"
            aria-label="بستن"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="border-b border-line pb-6">
            <p className="text-body-sm text-muted mb-4">
              هر آدرس پایه سازگار با OpenAI قابل استفاده است. پیش‌تنظیم‌های رایج:
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="پیش‌تنظیم‌های API">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, base_url: p.base_url }))}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium text-caption transition-all duration-fast
                    ${settings.base_url === p.base_url
                      ? "border-signal bg-signal/10 text-signal"
                      : "border-line/50 text-muted hover:border-muted hover:text-ink"}
                  `}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-paper" style={{ backgroundColor: "#FF5A36" }}>
                    {p.icon}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="base_url" className="label">آدرس پایه API</label>
            <input
              ref={baseUrlRef}
              id="base_url"
              value={settings.base_url}
              onChange={(e) => setSettings((s) => ({ ...s, base_url: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              dir="ltr"
              className="input-base font-mono text-body-sm"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="api_key" className="label">کلید API</label>
            <div className="relative">
              <input
                id="api_key"
                value={settings.api_key}
                onChange={(e) => setSettings((s) => ({ ...s, api_key: e.target.value }))}
                placeholder="sk-…"
                type={showKey ? "text" : "password"}
                dir="ltr"
                className="input-base font-mono text-body-sm pr-24"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-caption font-medium text-muted hover:text-ink transition-colors duration-fast px-2 py-1"
              >
                {showKey ? "پنهان" : "نمایش"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="model" className="label">مدل</label>
            <input
              id="model"
              value={settings.model}
              onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
              placeholder="gpt-4o-mini"
              dir="ltr"
              className="input-base font-mono text-body-sm"
              disabled={saving}
            />
            <p className="helper-text mt-1.5">مدل باید از فراخوانی ابزار (tool calling) پشتیبانی کند.</p>
          </div>

          <div className="p-4 rounded-lg border border-line/50 bg-white">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0 mt-0.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-ink font-medium">حریم خصوصی</p>
                <p className="text-caption text-muted mt-1">
                  کلید API فقط در پایگاه‌داده محلی همین دستگاه ذخیره می‌شود و به هیچ 서ور ثالثی ارسال نمی‌شود.
                  ارتباطات مستقیماً بین این اپ و آدرس APIِ مشخص‌شده انجام می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-line flex items-center justify-end gap-3 bg-[#FAF6F0] rounded-b-xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="btn-secondary"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ذخیره شد
              </>
            ) : saving ? (
              <>
                <svg className="animate-spin mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" strokeLinecap="round" />
                </svg>
                در حال ذخیره…
              </>
            ) : (
              "ذخیره تغییرات"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}