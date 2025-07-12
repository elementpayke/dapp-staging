import { NextRequest, NextResponse } from 'next/server';

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_AGGR_API_KEY;

interface RatesResponse {
  currency: string;
  base_rate: number;
  marked_up_rate: number;
  markup_percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'usdc';
    
    // Validate currency parameter
    const validCurrencies = ['usdc', 'eth', 'wxm', 'usdt_lisk'];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency. Must be one of: usdc, eth, wxm, usdt_lisk' },
        { status: 400 }
      );
    }

    // Make request to aggregator API
    const response = await fetch(`${AGGREGATOR_URL}/rates?currency=${currency}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      console.error('Aggregator API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch rates from aggregator' },
        { status: response.status }
      );
    }

    const data: RatesResponse = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 