# Security Smoke Tests

Manual verification checklist after security hardening changes.

## 1. RLS Cross-User Isolation
- Log in as User A, note their campaign/character IDs
- Log in as User B
- Attempt to SELECT User A's characters by ID -> should return empty
- Attempt to UPDATE User A's campaign by ID -> should fail
- Attempt to SELECT User A's companion_states -> should return empty
- Attempt to SELECT User A's rate_limits -> should return empty

## 2. Input Validation (400 Responses)
- POST to game-turn with action > 2000 chars -> expect 400
- POST to game-turn with non-UUID campaignId -> expect 400
- POST to game-turn with empty action -> expect 400
- POST to campaign-init with customPrompt > 4000 chars -> expect 400
- POST to campaign-init with campaignName > 100 chars -> expect 400
- POST to campaign-init with invalid mode -> expect 400
- POST to campaign-init with non-UUID characterId -> expect 400

## 3. Rate Limiting (429 Responses)
- Send >10 game-turn requests within 60 seconds -> expect 429 on 11th
- Send >5 campaign-init requests within 60 seconds -> expect 429 on 6th
- Wait 60 seconds -> requests should succeed again

## 4. CORS Origin Control
- Request from unknown browser origin -> response origin is first allowed origin (not echoed)
- Request with no origin (mobile) -> response origin is '*'
- Request from localhost:8081 -> response echoes origin

## 5. Error Sanitization
- Trigger an internal failure (e.g., bad API key) -> response body says "An unexpected error occurred" not raw stack/SQL
- Check Supabase Edge Function logs -> detailed error IS logged server-side

## 6. JWT Gateway
- Call game-turn without Authorization header -> expect 401 from gateway (not function)
- Call campaign-init without Authorization header -> expect 401 from gateway
- Call with expired JWT -> expect 401 (client should auto-refresh before this happens)
