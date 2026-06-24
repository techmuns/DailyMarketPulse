// src/hooks/useHostPortfolio.ts
//
// Pulls the user's real portfolio from the Munshot host using the bearer
// token provided via the Dashboard SDK host context, and maps each item to
// the app's Holding shape so it can drop into the Portfolio tab.
//
// Datasource: portfolio_list (registry) — nestjs service.
//   GET https://devde.muns.io/portfolio/list   (Authorization: Bearer <token>)
//
// The endpoint returns holdings only (ticker / company / sector / industry /
// rank) — it carries no live price, weight or trend. Those fields are filled
// the same way manually-added holdings are: weight is equal-weighted so the
// heatmap/contribution visuals stay sane, and price/trend are zeroed.
//
// When there is no host session (running standalone outside the iframe, where
// the SDK is the no-op client), `active` is false and the caller keeps its
// existing mock data unchanged.

import { useEffect, useState } from "react";
import { useHostContext } from "./useHostContext";
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
    // No live price feed for host holdings from this endpoint — zeroed, exactly
    // like the app already does for manually-added holdings.
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

export interface HostPortfolioState {
  holdings: Holding[];
  error: string | null;
  active: boolean; // true once host holdings have been loaded
}

export function useHostPortfolio(): HostPortfolioState {
  const { session } = useHostContext();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.token) return; // no host session — caller keeps its mock data
    const ctrl = new AbortController();

    fetch(PORTFOLIO_LIST_URL, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`portfolio/list ${r.status}`);
        return r.json();
      })
      .then((rows: PortfolioListItem[]) => {
        const list = Array.isArray(rows) ? rows : [];
        const ordered = [...list].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        const w = ordered.length
          ? Math.round((100 / ordered.length) * 10) / 10
          : 0;
        setHoldings(ordered.map((item) => toHolding(item, w)));
        setError(null);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(String(e));
      });

    return () => ctrl.abort();
  }, [session.token]); // re-fetch when the host session refreshes

  return { holdings, error, active: holdings.length > 0 };
}
