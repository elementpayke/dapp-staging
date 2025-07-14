# Element Pay API Debug Report

## Issue Summary
The `/orders/create` endpoint is timing out (30+ seconds) for POST requests, preventing WXM onramp orders from being processed.

## Environment Details
- **API URL**: `https://staging.elementpay.net/api/v1`
- **API Key**: `5U93R5U93R53CR3T` (first 4 chars: `5U93`)
- **Test Date**: $(date)

## Test Results

### ✅ Working Endpoints
```bash
# Rates endpoint - WORKS
curl -X GET "https://staging.elementpay.net/api/v1/rates" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
  -H "Content-Type: application/json" \
  --max-time 10
```
**Response**: `200 OK` (response time: ~500ms)

### ❌ Failing Endpoints

#### 1. Orders Create Endpoint - TIMEOUT
```bash
# WXM Onramp Order - TIMEOUTS after 30+ seconds
curl -X POST "https://staging.elementpay.net/api/v1/orders/create" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
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
  --max-time 30
```
**Expected**: JSON response with `tx_hash`
**Actual**: `❌ Error: The operation was aborted due to timeout`

#### 2. Alternative Test Cases

##### USDC Onramp Order (Base)
```bash
curl -X POST "https://staging.elementpay.net/api/v1/orders/create" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0xC63ABe092aeaB15102c3d6A4879A8BF77a21f8A8",
    "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "order_type": 0,
    "fiat_payload": {
      "amount_fiat": 10,
      "cashout_type": "PHONE",
      "phone_number": "254718677978",
      "currency": "KES"
    },
    "reason": "Transport"
  }' \
  --max-time 30
```

##### USDT Onramp Order (Lisk)
```bash
curl -X POST "https://staging.elementpay.net/api/v1/orders/create" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0xC63ABe092aeaB15102c3d6A4879A8BF77a21f8A8",
    "token": "0x05D032ac25d322df992303dCa074EE7392C117b9",
    "order_type": 0,
    "fiat_payload": {
      "amount_fiat": 10,
      "cashout_type": "PHONE",
      "phone_number": "254718677978",
      "currency": "KES"
    },
    "reason": "Transport"
  }' \
  --max-time 30
```

## Frontend Error Handling

The frontend has been updated with:
- **30-second timeout** for API calls
- **3 retries** with exponential backoff
- **45-second wrapper timeout** for onramp orders
- **Specific error messages** for different failure scenarios

## Expected Response Format

When working, the `/orders/create` endpoint should return:
```json
{
  "tx_hash": "0x...",
  "status": "submitted"
}
```

## Debugging Steps for Backend Team

1. **Check server logs** for `/orders/create` POST requests
2. **Verify database connectivity** for order creation
3. **Check if the endpoint is properly configured** to handle POST requests
4. **Monitor server resources** (CPU, memory, database connections)
5. **Test with a simple payload** to isolate the issue
6. **Check if there are any middleware** blocking POST requests

## Minimal Test Case

```bash
# Minimal test - just check if POST is accepted
curl -X POST "https://staging.elementpay.net/api/v1/orders/create" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  --max-time 10
```

## Impact

- **All onramp orders are failing** (not just WXM)
- **Users see timeout errors** after 30-45 seconds
- **Frontend retry logic is working** but all attempts fail
- **Rates endpoint works fine**, so API key and basic connectivity are OK

## Next Steps

1. **Backend team**: Investigate why `/orders/create` POST requests timeout
2. **Frontend team**: Monitor for resolution and test once fixed
3. **Consider**: Adding a health check endpoint that doesn't timeout

---

**Contact**: Frontend team is ready to test once the backend issue is resolved. 