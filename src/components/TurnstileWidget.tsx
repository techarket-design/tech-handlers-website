import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (err?: string) => void;
  onExpire?: () => void;
  action?: string;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire, action = "lead_submission", className = "", theme = "auto" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim();

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            // Ignore reset errors
          }
        }
      },
    }));

    useEffect(() => {
      if (!siteKey) return;
      let isMounted = true;

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !isMounted) return;
        if (widgetIdRef.current) return; // Already rendered

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme,
            callback: (token: string) => {
              if (isMounted) onSuccess(token);
            },
            "error-callback": (err?: string) => {
              if (isMounted && onError) onError(err);
            },
            "expired-callback": () => {
              if (isMounted && onExpire) onExpire();
            },
          });
          widgetIdRef.current = id;
        } catch {
          // Ignore render collisions
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        // Load the Cloudflare script if not already in document
        const scriptId = "cf-turnstile-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);

        return () => {
          clearInterval(checkInterval);
          isMounted = false;
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
              widgetIdRef.current = null;
            } catch {
              // Ignore cleanup errors
            }
          }
        };
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          } catch {
            // Ignore cleanup errors
          }
        }
      };
    }, [siteKey, action, theme, onSuccess, onError, onExpire]);

    if (!siteKey) return null;

    return (
      <div className={`flex justify-center my-2 ${className}`}>
        <div ref={containerRef} />
      </div>
    );
  }
);

TurnstileWidget.displayName = "TurnstileWidget";
export default TurnstileWidget;
