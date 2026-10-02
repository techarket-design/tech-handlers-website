import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { createQueryClient, type PublicQuerySeed } from "./lib/queryClient";

export async function render(url: string, seed: PublicQuerySeed) {
  const helmetContext: Record<string, any> = {};
  const client = createQueryClient(seed);
  try {
    return await new Promise<{ body: string; head: string }>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const destination = new PassThrough();
      let failure: unknown;
      destination.on("data", chunk => chunks.push(Buffer.from(chunk)));
      destination.on("error", error => { clearTimeout(timeout); reject(error); });
      destination.on("end", () => {
        clearTimeout(timeout);
        if (failure) return reject(failure);
        const helmet = helmetContext.helmet;
        resolve({ body: Buffer.concat(chunks).toString("utf8"), head: ["title", "meta", "link", "script"].map(k => helmet?.[k]?.toString() || "").join("") });
      });
      const stream = renderToPipeableStream(
        <HelmetProvider context={helmetContext}>
          <App serverUrl={url} queryClient={client} />
        </HelmetProvider>,
        {
          onAllReady() { stream.pipe(destination); },
          onShellError(error) { clearTimeout(timeout); reject(error); },
          onError(error) { failure = error; },
        },
      );
      const timeout = setTimeout(() => { stream.abort(); reject(new Error("Render timed out")); }, 10_000);
    });
  } finally {
    client.clear();
  }
}
