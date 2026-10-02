import { loadEnv } from "vite";
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 22) {
  console.error(`This project requires Node.js 22 or newer. Found ${process.versions.node}. Install the Node.js LTS release, then restart the VS Code terminal.`);
  process.exit(1);
}
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
if (env.VITE_SUPABASE_SERVICE_ROLE_KEY) throw new Error("Remove privileged Supabase keys from VITE_* variables");
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase's public project settings are missing. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from your Supabase project settings.");
  process.exit(1);
}
if (env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith("sb_secret_")) throw new Error("The browser requires a public Supabase key");
try {
  const payload = JSON.parse(Buffer.from(env.VITE_SUPABASE_PUBLISHABLE_KEY.split(".")[1], "base64url").toString());
  if (payload.role === "service_role") throw new Error("The browser requires an anonymous Supabase key");
} catch (error) { if (error.message === "The browser requires an anonymous Supabase key") throw error; }
