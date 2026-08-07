# Backend Bug Fixes TODO

## Critical / High

- [x] Fix regex injection in `getAllProducts` (escape search query)
- [x] Fix order cancellation not restoring stock (`cancelMyOrder`)
- [x] Fix `updateProduct` deleting old images before new upload succeeds

## Medium

- [x] Add rate limit to register route
- [x] Enforce seller order status transitions (lifecycle guard)
- [x] Optimize `getSellerOrders` to query at DB level
- [x] Fix pagination NaN handling in `getAllProducts`

## Low

- [x] Fix `minPrice || maxPrice` treating 0 as falsy
- [x] Fix cart item fallback lookup ambiguity

## Test

- [x] Run backend test suite (all tests pass)
- [x] Verify build/server starts
      </content>
