// src/hooks/useHostPortfolio.ts
//
// Pulls the user's real portfolio from the Munshot host using the bearer
// token from the Dashboard SDK host context, and maps each item to the app's
// Holding shape so it can replace the demo book in the Portfolio tab when the
// dashboard runs embedded inside the Munshot host.
//
// Datasource: portfolio_list (registry) — nestjs service.
//   GET https://devde.muns.io/portfolio/list   (Authorization: Bearer <token>)
//
// The endpoint returns holdings only (ticker / company / sector / industry /
// rank) — no live price, weight or trend. Weight is equal-weighted so the
// heatmap/contribution visuals stay sane; live price + trend are filled by the
// app's existing fetchQuote() (Worker /api/quote -> Yahoo), reusing its cache.
//
// When there is no host session (running standalone, where the SDK is the
// no-op client), `active` is false and the caller keeps its demo data.

import { useEffect, useState } from "react";
import { useHostContext } from "./useHostContext";
import { fetchQuote } from "../state/quotes";
import type { Holding } from "../types";

const PORTFOLIO_LIST_URL = "https://devde.muns.io/portfolio/list";

// Shape returned by the portfolio_list datasource.
interface PortfolioListItem {
  id: string;
  ticker: string;
  rank: number;
  createdAt: string;
  groupId: string;
  company_name?: string | null;
  country?: string | null;
  sector?: string | null;
  industry?: string | null;
}

// Map a portfolio ticker to a Yahoo Finance symbol for fetchQuote(). Indian
// (NSE) listings need the ".NS" suffix; US and other listings use the bare
// ticker. The displayed Holding keeps the clean ticker.
function yahooSymbol(ticker: string, country?: string | null): string {
  const c = (country || "").trim().toLowerCase();
  const isIndia = c === "in" || c === "ind" || c === "india";
  return isIndia ? `${ticker}.NS` : ticker;
}

// The portfolio_list response may be a bare array or wrapped in a common
// envelope ({ data: [...] }, { items: [...] }, etc.). Find the array either way.
function extractList(payload: unknown): PortfolioListItem[] {
  if (Array.isArray(payload)) return payload as PortfolioListItem[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const k of ["data", "items", "portfolio", "results", "list", "holdings"]) {
      if (Array.isArray(obj[k])) return obj[k] as PortfolioListItem[];
    }
  }
  return [];
}

function toHolding(item: PortfolioListItem, equalWeight: number): Holding {
  return {
    id: item.id,
    title: item.company_name || item.ticker,
    ticker: item.ticker,
    sector: item.sector || item.industry || "—",
    category: "portfolio",
    current: 0,
    previous: 0,
    weight: equalWeight,
    thesis: "",
    // Neutral until fetchQuote() fills live price + trend (or if it fails).
    trend: { d1: 0, d5: 0, m1: 0, spark: [0, 0, 0, 0, 0, 0, 0] },
    signal: "monitor",
    impact: 0,
    affected: [item.ticker],
    whyShown: "Synced from your portfolio.",
    source: "Reliable media",
    confidence: 0,
    timestamp: item.createdAt || new Date().toISOString(),
  };
}

// TEMPORARY diagnostic surfaced in the UI so we can confirm, in the deployed
// iframe, that the host session + portfolio fetch actually work. Remove once
// verified.
export interface HostPortfolioDebug {
  tokenPresent: boolean;
  status: "idle" | "ok" | "error";
  httpStatus: number | null;
  rawType: string;
  count: number;
  error: string | null;
}

export interface HostPortfolioState {
  holdings: Holding[];
  active: boolean; // true once host holdings have been loaded
  debug: HostPortfolioDebug;
}

export function useHostPortfolio(): HostPortfolioState {
  const { session } = useHostContext();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [debug, setDebug] = useState<HostPortfolioDebug>({
    tokenPresent: false,
    status: "idle",
    httpStatus: null,
    rawType: "",
    count: 0,
    error: null,
  });

  useEffect(() => {
    if (!session.token) return; // no host session — caller keeps its demo data
    const ctrl = new AbortController();
    let httpStatus: number | null = null;

    fetch(PORTFOLIO_LIST_URL, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
    })
      .then((r) => {
        httpStatus = r.status;
        if (!r.ok) throw new Error(`portfolio/list ${r.status}`);
        return r.json();
      })
      .then((payload: unknown) => {
        const list = extractList(payload);
        const rawType = Array.isArray(payload)
          ? "array"
          : payload && typeof payload === "object"
            ? `object:{${Object.keys(payload as object).join(",")}}`
            : String(payload);
        const ordered = [...list].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        const w = ordered.length
          ? Math.round((100 / ordered.length) * 10) / 10
          : 0;
        const base = ordered.map((item) => ({
          holding: toHolding(item, w),
          symbol: yahooSymbol(item.ticker, item.country),
        }));
        setHoldings(base.map((b) => b.holding)); // show the list right away
        setDebug({
          tokenPresent: true,
          status: "ok",
          httpStatus,
          rawType,
          count: base.length,
          error: null,
        });
        if (base.length === 0) return;

        // Fill live price + trend per holding using the app's existing
        // Worker-proxied quote endpoint (reuses its in-memory + edge cache).
        return Promise.all(
          base.map((b) =>
            fetchQuote(b.symbol)
              .then((q) => ({ id: b.holding.id, current: q.current, trend: q.trend }))
              .catch(() => null),
          ),
        ).then((quotes) => {
          if (ctrl.signal.aborted) return;
          const byId = new Map(
            quotes.filter(Boolean).map((q) => [q!.id, q!]),
          );
          setHoldings(
            base.map(({ holding }) => {
              const q = byId.get(holding.id);
              return q ? { ...holding, current: q.current, trend: q.trend } : holding;
            }),
          );
        });
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) {
          setDebug({
            tokenPresent: true,
            status: "error",
            httpStatus,
            rawType: "",
            count: 0,
            error: String(e),
          });
        }
      });

    return () => ctrl.abort();
  }, [session.token]); // re-fetch when the host session refreshes

  return {
    holdings,
    active: holdings.length > 0,
    debug: { ...debug, tokenPresent: !!session.token },
  };
}
