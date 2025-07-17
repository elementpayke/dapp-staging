import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'usd-coin';
    const currency = searchParams.get('currency') || 'kes';
    
    // Validate coin ID
    const validCoinIds = ['usd-coin', 'weatherxm-network', 'tether', 'ethereum'];
    if (!validCoinIds.includes(coinId)) {
      return NextResponse.json(
        { error: 'Invalid coin ID. Must be one of: usd-coin, weatherxm-network, tether, ethereum' },
        { status: 400 }
      );
    }

    // Make request to CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch rates from CoinGecko' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching CoinGecko rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
