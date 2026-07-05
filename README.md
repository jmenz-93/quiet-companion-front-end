# quiet-companion-front-end

React + Tailwind landing page and advisor terminal for Quiet Companion.

## Local development

1. Install dependencies in `quiet-companion/`.
2. Copy `.env.example` to `.env` and set `JWT_SECRET`.
3. Run `npm run dev` from `quiet-companion/`.

## Data connections

The server now reads client/account data from Postgres and news from Finnhub.

For Postgres, the default query expects:

1. `advisors(id, name, desk, region, email)`.
2. `clients(id, advisor_email, name, household, focus)`.
3. `accounts(id, client_id, label, strategy, market_value, cash, risk)`.

If your schema differs, create SQL views with those column names or adjust [server/db.ts](/Users/jonathanmenzel/Documents/git/quiet-companion-front-end/quiet-companion/server/db.ts#L1).

The home page uses the `/api/market` route, which fetches live headlines from Finnhub on the server.

## Architecture

The frontend only talks to `/api` routes. The Express middleware handles auth, rate limiting, and session cookies so the client never touches database credentials or raw records directly.
