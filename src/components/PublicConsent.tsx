import { useLocation } from "react-router-dom";
import CookieConsentBanner from "./CookieConsentBanner";
export default function PublicConsent() {
  const { pathname } = useLocation();
  return pathname.startsWith("/admin") ? null : <CookieConsentBanner />;
}
