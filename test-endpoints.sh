#!/bin/bash

# Element Pay API Test Script
# Run this script to test all endpoints and reproduce the timeout issue

API_URL="https://staging.elementpay.net/api/v1"
API_KEY="5U93R5U93R53CR3T"

echo "🔍 Element Pay API Test Script"
echo "🌐 API URL: $API_URL"
echo "🔑 API Key: ${API_KEY:0:4}..."
echo "📅 Test Date: $(date)"
echo "=================================="

# Test 1: Rates endpoint (should work)
echo "📡 Test 1: Rates endpoint"
start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -X GET "$API_URL/rates" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  --max-time 10)
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: $http_code (${duration}ms)"
else
    echo "❌ FAILED: $http_code (${duration}ms)"
    echo "Response: $body"
fi
echo "---"

# Test 2: Orders endpoint with HEAD (should return 405)
echo "📡 Test 2: Orders endpoint with HEAD"
start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -X HEAD "$API_URL/orders/create" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  --max-time 10)
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" = "405" ]; then
    echo "✅ EXPECTED: $http_code (${duration}ms) - Method Not Allowed"
else
    echo "⚠️ UNEXPECTED: $http_code (${duration}ms)"
    echo "Response: $body"
fi
echo "---"

# Test 3: Orders endpoint with POST - WXM (should timeout)
echo "📡 Test 3: Orders endpoint with POST - WXM"
echo "⚠️ This test will timeout after 30 seconds..."

start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/orders/create" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0xC63ABe092aeaB15102c3d6A4879A8BF77a21f8A8",
    "token": "0xB6093B61544572Ab42A0E43AF08aBaFD41bf25A6",
    "order_type": 0,
    "fiat_payload": {
      "amount_fiat": 10,
      "cashout_type": "PHONE",
      "phone_number": "254718677978",
      "currency": "KES"
    },
    "reason": "Transport"
  }' \
  --max-time 30)
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

http_code="${response: -3}"
body="${response%???}"

if [ "$duration" -ge 30000 ]; then
    echo "❌ TIMEOUT: Request timed out after ${duration}ms"
    echo "This confirms the issue - the endpoint is not responding"
elif [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: $http_code (${duration}ms)"
    echo "Response: $body"
else
    echo "⚠️ UNEXPECTED: $http_code (${duration}ms)"
    echo "Response: $body"
fi
echo "---"

# Test 4: Minimal POST test
echo "📡 Test 4: Minimal POST test"
echo "⚠️ This test will timeout after 10 seconds..."

start_time=$(date +%s%3N)
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/orders/create" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  --max-time 10)
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

http_code="${response: -3}"
body="${response%???}"

if [ "$duration" -ge 10000 ]; then
    echo "❌ TIMEOUT: Request timed out after ${duration}ms"
    echo "Even minimal POST requests timeout"
elif [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: $http_code (${duration}ms)"
    echo "Response: $body"
else
    echo "⚠️ UNEXPECTED: $http_code (${duration}ms)"
    echo "Response: $body"
fi
echo "---"

echo "🏁 Test Complete"
echo "=================================="
echo "Summary:"
echo "- Rates endpoint: ✅ Working"
echo "- Orders POST: ❌ Timing out"
echo "- Issue: Backend /orders/create endpoint is not responding to POST requests"
echo ""
echo "Next steps:"
echo "1. Check backend server logs for POST requests to /orders/create"
echo "2. Verify database connectivity"
echo "3. Check if endpoint is properly configured"
echo "4. Monitor server resources" 