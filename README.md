# Kharcha: a smart expense tracker

Type what you spent, like `spent 450 on groceries and 120 on auto yesterday`. Kharcha turns it into dated,
categorised entries, lets you check them, then shows monthly charts and insights.

**Stack:** React (Vite) · Node + Express · SQLite · JWT login · Recharts · Claude for parsing (optional)

Without an API key the app still works: a built-in rule-based parser handles common phrasing. With a key,
Claude understands looser sentences ("two fifty for chai and samosa, friday").

---

## 1. Install these first

| Tool | Why | How |
|---|---|---|
| **Node.js 22.13 or newer** (24 LTS is a good choice) | Runs the server and builds the React app. Includes `npm`. | Download the LTS installer from https://nodejs.org and run it. Or: Windows `winget install OpenJS.NodeJS.LTS`, macOS `brew install node`. |
| **VS Code** | Editor with a built-in terminal. | https://code.visualstudio.com |
| **A browser** | Chrome, Edge or Firefox. | Already installed. |
| *Optional:* **Git** | For version control and GitHub. | https://git-scm.com |
| *Optional:* **Anthropic API key** | Turns on AI parsing and AI summaries. | Create an account at https://console.anthropic.com, open API keys, create one. Usage is billed per request. |

Check Node after installing (close and reopen the terminal first):

```
node -v     # must print v22.13.0 or higher
npm -v
```

## 2. Run the project

Unzip the project, open the `kharcha` folder in VS Code, then open **two terminals** (Terminal → New Terminal).

**Terminal 1: the server**

```
cd server
npm install
```

Create your settings file:

- Windows: `copy .env.example .env`
- macOS / Linux: `cp .env.example .env`

Generate a secret and paste it after `JWT_SECRET=` in `server/.env`:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the server:

```
npm run dev
```

You should see `API running on http://localhost:5000`.

**Terminal 2: the website**

```
cd client
npm install
npm run dev
```

Open **http://localhost:5173**, create an account, and type your first expense.

## 3. Turn on AI (optional)

Put your key in `server/.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

Stop the server (Ctrl+C) and run `npm run dev` again. The line under the input box changes to
"AI reads your note", and a "Write my summary" button appears in the insights panel.
Never commit `.env` to Git. It is already in `.gitignore`.

## 4. Run the tests

```
cd server
npm test
```

These cover the parser (dates, amounts, multiple expenses), the insights maths, and the database rules.

---

## How it works

```
You type a sentence
   → POST /api/expenses/parse   AI (or rules) returns structured items. Nothing saved yet.
   → You review and edit the "slip"
   → POST /api/expenses         Items are validated again on the server and saved.
   → GET  /api/expenses + /api/insights   Ledger, charts and tips refresh.
```

Design choices worth being able to explain in an interview:

- **Human in the loop.** AI output is shown for review before saving, because models can misread amounts or dates.
- **Never trust model output.** Every item, whether from the AI or the rules, goes through `cleanItem()`:
  the amount must be positive, the category must be on the allowed list, the date must be valid.
- **Graceful fallback.** If the AI call fails, the rule-based parser takes over and the UI says so.
- **Dates are plain `YYYY-MM-DD` strings** in the user's local time, which avoids timezone bugs near midnight.
- **Insights are computed by code, not by the AI.** Totals and percentages are exact. The AI only writes the
  optional prose summary, and it receives totals, never your raw notes.
- **Security basics:** bcrypt password hashing, JWT with 7-day expiry, every query filtered by `user_id`,
  parameterised SQL, rate limits on login and AI routes, request size limit.

## Folder map

```
server/
  src/index.js           app setup and routes wiring
  src/auth.js            register, login, JWT middleware
  src/db.js              SQLite schema (built-in node:sqlite) and transaction helper
  src/parser.js          AI parsing + rule-based fallback + validation
  src/llm.js             one small function that calls the Claude API
  src/insights.js        totals, categories, daily series, tips
  src/routes/            expenses and insights endpoints
  test/                  unit tests
client/
  src/App.jsx            login state
  src/pages/             Auth and Dashboard
  src/components/        EntryBar (input + review), Ledger, Summary (charts)
  src/api.js             fetch wrapper that attaches the token
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `No such built-in module: node:sqlite` | Your Node is too old. Install 22.13 or newer. |
| `JWT_SECRET is missing or too short` | Fill in `JWT_SECRET` in `server/.env` and restart. |
| Page loads but every request fails | The server is not running. Start Terminal 1 first. |
| `EADDRINUSE` | Port 5000 is taken. Change `PORT` in `server/.env` and the proxy target in `client/vite.config.js`. |
| AI never seems to be used | Check the key in `.env`, restart the server, and read the server terminal for "AI parsing failed". |
| `ExperimentalWarning: SQLite` | Harmless. Node marks its built-in SQLite as experimental. |

## Taking it further

1. **Edit an existing expense** (add `PUT /api/expenses/:id` and an edit button).
2. **Budgets per category** with a warning when you pass 80%.
3. **CSV export** and a month-to-month comparison chart.
4. **Recurring expenses** (rent, subscriptions) with a daily job.
5. **Route tests** with `supertest`, and a GitHub Actions workflow that runs them.
6. **Deploy:** API on Render or Railway, site on Vercel or Netlify. Build the client with
   `VITE_API_URL=https://your-api-url`, and set `CLIENT_ORIGIN` on the server to your site's URL.
   Most free hosts wipe local files on restart, so use a persistent disk or move to PostgreSQL.
7. **Tokens in cookies.** The JWT currently lives in `localStorage`, which is simple but exposed to XSS.
   An `httpOnly` cookie is the next step up.
