// Single source of truth for Yahoo Finance symbol mappings.
// Keys are the same `id` strings used in src/data/*.ts so the frontend
// overlay can merge live values onto mock items by id.
//
// Keep raw tickers here — the fetch script is responsible for
// URL-encoding before building Yahoo Finance request URLs.

export const SYMBOLS = {
  indices: [
    { id: 'i-nifty',  yahoo: '^NSEI' },
    { id: 'i-sensex', yahoo: '^BSESN' },
    { id: 'i-niftym', yahoo: '^NSEMDCP50' },
    { id: 'i-spx',    yahoo: '^GSPC' },
    { id: 'i-nasdaq', yahoo: '^IXIC' },
    { id: 'i-vix',    yahoo: '^INDIAVIX' },
  ],
  // NSE sector indices. IDs match src/data/markets.ts sectors[].id so
  // the live overlay can swap in real d1/d5/m1/spark values.
  sectors: [
    { id: 's-it',     yahoo: '^CNXIT' },
    { id: 's-banks',  yahoo: '^NSEBANK',  fallbacks: ['^CNXBANK'] },
    { id: 's-auto',   yahoo: '^CNXAUTO' },
    { id: 's-fmcg',   yahoo: '^CNXFMCG' },
    { id: 's-pharma', yahoo: '^CNXPHARMA' },
    { id: 's-metals', yahoo: '^CNXMETAL' },
    { id: 's-energy', yahoo: '^CNXENERGY' },
    { id: 's-realty', yahoo: '^CNXREALTY' },
  ],
  // Yahoo-fetchable macro series. India CPI / Repo / IIP are not on
  // Yahoo (would need RBI / MoSPI scraping) so they stay mock — only
  // the rate / yield series that Yahoo serves go here.
  macro: [
    { id: 'm-us10y', yahoo: '^TNX' },
  ],
  currencies: [
    { id: 'fx-usdinr', yahoo: 'USDINR=X' },
    { id: 'fx-eurinr', yahoo: 'EURINR=X' },
    { id: 'fx-jpyinr', yahoo: 'JPYINR=X' },
    { id: 'fx-cnyinr', yahoo: 'CNYINR=X' },
    { id: 'fx-dxy',    yahoo: 'DX-Y.NYB' },
  ],
  commodities: [
    { id: 'c-brent',  yahoo: 'BZ=F' },
    { id: 'c-gold',   yahoo: 'GC=F' },
    { id: 'c-steel',  yahoo: 'HRC=F' },
    { id: 'c-alum',   yahoo: 'ALI=F' },
    { id: 'c-copper', yahoo: 'HG=F' },
    { id: 'c-sugar',  yahoo: 'SB=F' },
    // Palm oil has no clean Yahoo futures symbol. Try CPO=F (CME
    // palm oil futures, USD-denominated, settles to Bursa FCPO);
    // fall back to the FTSE Bursa Malaysia Palm Oil Plantation
    // index FBMPM.FGI which tracks plantation equities and moves
    // with the underlying. If both fail, the script logs a skip
    // and the chip shows LIVE · 6/7 instead of 7/7.
    { id: 'c-palm',   yahoo: 'CPO=F', fallbacks: ['FBMPM.FGI'] },
  ],
  holdings: [
    // Portfolio
    { id: 'p-infy',   yahoo: 'INFY.NS' },
    { id: 'p-mm',     yahoo: 'M&M.NS' },        // fetch script URL-encodes
    { id: 'p-hdfcb',  yahoo: 'HDFCBANK.NS' },
    { id: 'p-asianp', yahoo: 'ASIANPAINT.NS' },
    { id: 'p-tcs',    yahoo: 'TCS.NS' },
    { id: 'p-relian', yahoo: 'RELIANCE.NS' },
    { id: 'p-titan',  yahoo: 'TITAN.NS' },
    { id: 'p-bajfin', yahoo: 'BAJFINANCE.NS' },
    // Watchlist
    { id: 'w-pidil',  yahoo: 'PIDILITIND.NS' },
    { id: 'w-dmart',  yahoo: 'DMART.NS' },
    { id: 'w-divis',  yahoo: 'DIVISLAB.NS' },
    { id: 'w-zomato', yahoo: 'ZOMATO.NS' },
    { id: 'w-pi',     yahoo: 'PIIND.NS' },
  ],
};
