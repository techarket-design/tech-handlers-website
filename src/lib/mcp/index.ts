import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listLeadsTool from "./tools/list-leads";
import listTasksTool from "./tools/list-tasks";
import listCustomersTool from "./tools/list-customers";

// The OAuth issuer MUST be the direct Supabase host, derived from the project
// ref at build time. Never read SUPABASE_URL at module scope (Cloud proxies it).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tech-handlers-mcp",
  title: "Tech Handlers MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Tech Handlers admin workspace. Use `whoami` to verify the signed-in user, `list_leads` to read website form submissions, `list_tasks` for CRM tasks, and `list_customers` for the customer directory. All reads follow the signed-in user's admin permissions and RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listLeadsTool, listTasksTool, listCustomersTool],
});