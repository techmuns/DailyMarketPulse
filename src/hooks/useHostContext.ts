// src/hooks/useHostContext.ts
import { useEffect, useState } from "react";
import { sdk, sdkAvailable, inIframe, sdkNudges, type SessionContext } from "../lib/sdk";

const EMPTY_SESSION: SessionContext = {
  token: null, userName: null, email: null, orgId: null, orgName: null,
};

export function useHostContext() {
  const [session, setSession] = useState<SessionContext>(EMPTY_SESSION);
  const [ticker, setTicker] = useState<string | null>(null);
  const [tickerCompany, setTickerCompany] = useState<string | null>(null);
  const [tickerCountry, setTickerCountry] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  // Handshake diagnostics: channelId is set once host:init arrives; messages
  // counts every host->dashboard envelope received.
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<number>(0);

  useEffect(() => {
    const sync = () => {
      setChannelId(sdk.getChannelId());
      const ctx = sdk.getContext();
      if (!ctx) return;
      if (ctx.session) setSession({ ...EMPTY_SESSION, ...ctx.session });
      if (ctx.market) {
        setTicker(ctx.market.selectedTicker ?? null);
        setTickerCompany(ctx.market.selectedTickerCompany ?? null);
        setTickerCountry(ctx.market.selectedTickerCountry ?? null);
        setSelectedSymbol(ctx.market.selectedSymbol ?? null);
      }
    };

    sync();                    // apply already-cached context (host:init may
                               // have arrived before this component mounted)
    const unsub = sdk.onMessage(() => {
      setMessages((n) => n + 1); // count every host message
      sync();
    });                        // re-sync on every host message

    // Poll briefly so the diagnostic reflects nudge attempts and any late
    // channel/token, even if no host message ever triggers a re-render.
    let ticks = 0;
    const iv = window.setInterval(() => {
      sync();
      if (++ticks >= 16 || sdk.getChannelId()) window.clearInterval(iv);
    }, 700);

    return () => {
      unsub();
      window.clearInterval(iv);
    };
  }, []);

  return {
    session, ticker, tickerCompany, tickerCountry, selectedSymbol,
    diag: { sdkAvailable, inIframe, channelId, messages, nudges: sdkNudges },
  };
}
