import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for CoinGecko markets API responses
// Key: `markets-${coinIds.join(',')}`, Value: { data, timestamp }
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Track pending requests to prevent duplicate simultaneous calls
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(coinIds: string[]): string {
  return `markets-${coinIds.sort().join(',')}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinIdsParam = searchParams.get('ids');
    
    if (!coinIdsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    const coinIds = coinIdsParam.split(',').map(id => id.trim());
    
    // Validate coin IDs
    const validCoinIds = ['bitcoin', 'ethereum', 'usd-coin', 'weatherxm-network', 'tether'];
    const invalidIds = coinIds.filter(id => !validCoinIds.includes(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid coin IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(coinIds);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`[CoinGecko Markets Cache HIT] ${cacheKey}`);
      return NextResponse.json(cached.data);
    }

    // Check if there's already a pending request for this key
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log(`[CoinGecko Markets Request DEDUP] ${cacheKey} - waiting for pending request`);
      const data = await pendingRequest;
      return NextResponse.json(data);
    }

    // Create new request
    console.log(`[CoinGecko Markets API CALL] ${cacheKey}`);
    const fetchPromise = (async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          // If 429, try to return cached data even if expired
          if (response.status === 429) {
            console.warn(`[CoinGecko Markets 429] ${cacheKey} - returning stale cache if available`);
            if (cached) {
              return cached.data;
            }
          }
          console.error('CoinGecko Markets API error:', response.status, response.statusText);
          throw new Error(`CoinGecko Markets API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Store in cache
        cache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, fetchPromise);
    
    const data = await fetchPromise;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching CoinGecko markets:', error);
    
    // Try to return stale cache on error
    const { searchParams } = new URL(request.url);
    const coinIdsParam = searchParams.get('ids');
    if (coinIdsParam) {
      const coinIds = coinIdsParam.split(',').map(id => id.trim());
      const cacheKey = getCacheKey(coinIds);
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`[CoinGecko Markets FALLBACK] ${cacheKey} - returning stale cache on error`);
        return NextResponse.json(cached.data);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

