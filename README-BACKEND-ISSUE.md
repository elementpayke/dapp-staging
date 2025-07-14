# 🚨 URGENT: Element Pay API Timeout Issue

## Issue Summary
The `/orders/create` endpoint is timing out (30+ seconds) for all POST requests, preventing **all onramp orders** from being processed.

## Quick Test
Run this command to reproduce the issue:
```bash
curl -X POST "https://staging.elementpay.net/api/v1/orders/create" \
  -H "x-api-key: 5U93R5U93R53CR3T" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  --max-time 10
```
**Expected**: JSON response or error code  
**Actual**: ❌ Timeout after 10 seconds

## Files for Backend Team

1. **`backend-debug-report.md`** - Comprehensive debug report with all test cases
2. **`test-endpoints.sh`** - Automated test script (run with `./test-endpoints.sh`)
3. **`curl-commands.txt`** - Individual cURL commands for manual testing
4. **`test-api-status.js`** - Node.js test script

## What We Know

✅ **Working:**
- API key is valid
- `/rates` endpoint returns 200 OK
- Network connectivity is fine
- Frontend error handling is robust

❌ **Broken:**
- `/orders/create` POST requests timeout
- All tokens affected (WXM, USDC, USDT)
- No error response, just timeout
- HEAD requests return 405 (expected)

## Impact
- **All onramp orders failing**
- Users see timeout errors after 30-45 seconds
- Frontend retry logic working but all attempts fail
- Affects all supported tokens and chains

## Immediate Action Required
1. **Check server logs** for POST requests to `/orders/create`
2. **Verify database connectivity** for order creation
3. **Check endpoint configuration** for POST method
4. **Monitor server resources** (CPU, memory, DB connections)

## Frontend Status
- ✅ Timeout handling implemented (30s + 3 retries)
- ✅ Error messages improved
- ✅ Ready to test once backend is fixed

## Contact
Frontend team is ready to test once the backend issue is resolved.

---

**Priority**: 🔴 HIGH - All onramp functionality is broken
**Affected**: All tokens (WXM, USDC, USDT) on all chains
**Status**: Frontend ready, waiting for backend fix 