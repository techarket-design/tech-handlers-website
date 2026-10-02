# Tech Handlers website

This project uses React, Vite, Supabase and Vercel. Keep the existing `package-lock.json` so everyone installs the same dependency versions.

## Run it from VS Code on Windows

1. Install the Node.js 22 LTS release. It includes npm. If `node --version` or `npm --version` is not recognized in VS Code, close and reopen VS Code after installing Node so the terminal refreshes its PATH.
2. In VS Code, choose **File → Open Folder** and open the `tech-handlers-website` repository folder itself.
3. Open **Terminal → New Terminal**. Confirm it is in the folder containing `package.json`:

   ```powershell
   node --version
   npm --version
   ```

   Node should report version 22 or higher. If you see `npm is not recognized`, Node/npm is not installed or VS Code still has the old PATH.
4. Copy `.env.example` to `.env.local`. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from **Supabase → Project Settings → API**. These are public browser settings; never use a service-role key as the publishable key.
5. Install dependencies and start Vite:

   ```powershell
   npm ci
   npm run dev
   ```

   Open the local URL Vite prints (normally `http://localhost:8080`).

To create the Vercel production output locally, run:

```powershell
npm run build
npm run preview
```

Then open `http://127.0.0.1:4173`. The local preview renders live published Supabase content. The public form API also needs the optional server-only values in `.env.local` before it can save a test enquiry. Do not use production credentials to submit test enquiries.

`npm run dev` starts Vite for day-to-day frontend work. It does not emulate Vercel's server-rendered routes or server lead API; use `npm run build` followed by `npm run preview` to inspect those locally.

For server setup, Supabase migrations, publishing behavior and deployment checks, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For the Gemini custom app that creates drafts and publishes approved blog posts, see [GEMINI-BLOG-PUBLISHER.md](./GEMINI-BLOG-PUBLISHER.md).
