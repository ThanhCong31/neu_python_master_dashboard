import { AppLoading } from "@/shared/LoadingState";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/expressive/button";
import Account from "@/features/account/Account";
import { Login } from "@/features/account/Login";
import { api, ApiError, invalidateApiSession } from "@/services/api";
import { useResource } from "@/services/useResource";
import { ScreenErrorBoundary } from "@/shared/ScreenErrorBoundary";
import { Shell } from "@/shell/Shell";
import { availableTo } from "./destinations";
import type { User } from "./model";
import { WorkspaceContext } from "./workspace";
import { resolveScopeStatus } from "./scope";

function Workspace({ user, signedOut }: { user: User; signedOut: () => void }) {
  const destinations = availableTo(user);
  const scopeKey = `neu-bi-scope:${user.username}`;
  // Session preference only: actual row-level filtering remains on the API.
  const [partner, setPartner] = useState<string | null>(() => {
    if (user.role !== "admin") return null;
    try { return sessionStorage.getItem(scopeKey); } catch { return null; }
  });
  const changeScope = (code: string | null) => {
    setPartner(code);
    try {
      if (code) sessionStorage.setItem(scopeKey, code);
      else sessionStorage.removeItem(scopeKey);
    } catch { /* Browsers may block storage. */ }
  };
  const options = useResource<{ partners: { code: string; name: string }[] }>(
    user.role === "admin" ? "/meta/options" : null,
  );
  const availablePartners = options.state === "ready" ? options.data.partners : null;
  useEffect(() => {
    if (user.role !== "admin" || !availablePartners || !partner) return;
    if (!availablePartners.some((item) => item.code === partner)) changeScope(null);
  }, [partner, availablePartners, user.role]);
  return (
    <WorkspaceContext.Provider
      value={{
        user,
        destinations,
        partner: user.role === "admin" ? partner : null,
        partners: options.state === "ready" ? options.data.partners : [],
        scopeStatus: resolveScopeStatus(user.role,partner,options.state,availablePartners),
        retryScope: options.retry,
      }}
    >
      <Routes>
        <Route
          element={<Shell changeScope={changeScope} signedOut={() => {
            try {
              sessionStorage.removeItem(scopeKey);
              sessionStorage.removeItem(`neu-admin-selected:${user.username}`);
            } catch { /* ignore */ }
            signedOut();
          }} />}
        >
          {destinations.map(({ id, path, Screen }) => (
            <Route key={id} path={path} element={<ScreenErrorBoundary key={id} screen={id}><Screen /></ScreenErrorBoundary>} />
          ))}
          <Route path="/tai-khoan" element={<ScreenErrorBoundary screen="account"><Account /></ScreenErrorBoundary>} />
          <Route
            path="*"
            element={
              <Navigate replace to={destinations[0]?.path ?? "/tai-khoan"} />
            }
          />
        </Route>
      </Routes>
    </WorkspaceContext.Provider>
  );
}

type Session = "loading" | "offline" | "anonymous" | User;

export function App() {
  const [session, setSession] = useState<Session>("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const expired = () => { invalidateApiSession(); setSession("anonymous"); };
    window.addEventListener("session-expired", expired);
    api<User>("/auth/me", { signal: controller.signal })
      .then((user) => {
        if (!controller.signal.aborted) setSession(user);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSession(
            error instanceof ApiError && [401, 403].includes(error.status)
              ? "anonymous"
              : "offline",
          );
      });
    return () => {
      controller.abort();
      window.removeEventListener("session-expired", expired);
    };
  }, [attempt]);
  if (session === "anonymous") return <ScreenErrorBoundary screen="login"><Login accept={user=>{invalidateApiSession();setSession(user);}} /></ScreenErrorBoundary>;
  if (session === "loading") return <AppLoading />;
  if (session === "offline")
    return (
      <main className="grid min-h-dvh place-items-center bg-surface p-6 text-on-surface">
        <section className="space-y-4">
          <h1 className="text-headline-small">Chưa kết nối được máy chủ</h1>
          <p className="text-body-large">Kiểm tra kết nối rồi thử lại.</p>
          <Button
            onClick={() => {
              setSession("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Thử lại
          </Button>
        </section>
      </main>
    );
  return (
    <ScreenErrorBoundary key={session.username} screen="workspace">
      <Workspace
        user={session}
        signedOut={() => {invalidateApiSession();setSession("anonymous");}}
      />
    </ScreenErrorBoundary>
  );
}
