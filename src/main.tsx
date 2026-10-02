import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { createQueryClient, type PublicQuerySeed } from "./lib/queryClient";
import { startMeasurement } from "./lib/measurement";

const seedNode = document.getElementById("public-query-data");
const seed: PublicQuerySeed = seedNode ? JSON.parse(seedNode.textContent || "[]") : [];
const app = (
  <HelmetProvider>
    <App queryClient={createQueryClient(seed)} />
  </HelmetProvider>
);
const root = document.getElementById("root")!;
if (seedNode) hydrateRoot(root, app);
else createRoot(root).render(app);
startMeasurement();
