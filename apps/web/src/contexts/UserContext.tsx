"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Persona, UserAttributes } from "@/lib/personas";
import type { PageLayout } from "@/lib/layout-types";
import { growthbook } from "@/lib/growthbook";

interface EvaluatedFeatures {
  [key: string]: unknown;
}

interface UserContextValue {
  persona: Persona | null;
  isSignedIn: boolean;
  signIn: (persona: Persona) => void;
  signOut: () => void;
  /** Server-evaluated feature values (only when signed in) */
  remoteFeatures: EvaluatedFeatures;
  /** True while remote eval is in-flight */
  loadingRemote: boolean;
  /** Server-driven page layout */
  layout: PageLayout | null;
  /** True while layout is being fetched */
  loadingLayout: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [remoteFeatures, setRemoteFeatures] = useState<EvaluatedFeatures>({});
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);

  const fetchRemoteEval = useCallback(async (attributes: UserAttributes, userId: string) => {
    setLoadingRemote(true);
    try {
      const res = await fetch("/api/demoapp2/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, attributes }),
      });
      if (res.ok) {
        const data = await res.json();
        setRemoteFeatures(data.features || {});
      }
    } catch (err) {
      console.warn("Remote evaluation failed, falling back to client-side:", err);
      setRemoteFeatures({});
    } finally {
      setLoadingRemote(false);
    }
  }, []);

  const fetchLayout = useCallback(async (attributes?: UserAttributes, userId?: string) => {
    setLoadingLayout(true);
    try {
      const body: Record<string, unknown> = {};
      if (userId) body.userId = userId;
      if (attributes) body.attributes = attributes;
      const res = await fetch("/api/demoapp2/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setLayout(data);
      }
    } catch (err) {
      console.warn("Layout fetch failed:", err);
    } finally {
      setLoadingLayout(false);
    }
  }, []);

  // Fetch default layout on mount (no attributes = anonymous)
  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  const signIn = useCallback((p: Persona) => {
    setPersona(p);
    // Set attributes on the client-side SDK too (for features not covered by remote eval)
    growthbook.setAttributes({
      id: p.id,
      ...p.attributes,
    });
    // Fetch server-side evaluated features and layout
    fetchRemoteEval(p.attributes, p.id);
    fetchLayout(p.attributes, p.id);
  }, [fetchRemoteEval, fetchLayout]);

  const signOut = useCallback(() => {
    setPersona(null);
    setRemoteFeatures({});
    // Reset SDK attributes to anonymous
    growthbook.setAttributes({});
    // Re-fetch default layout
    fetchLayout();
  }, [fetchLayout]);

  // Re-fetch when growthbook features update (e.g., after a flag change)
  useEffect(() => {
    const handler = () => {
      if (persona) {
        fetchRemoteEval(persona.attributes, persona.id);
        fetchLayout(persona.attributes, persona.id);
      } else {
        fetchLayout();
      }
    };
    growthbook.setRenderer(handler);
    return () => {
      growthbook.setRenderer(() => {});
    };
  }, [persona, fetchRemoteEval, fetchLayout]);

  return (
    <UserContext.Provider
      value={{
        persona,
        isSignedIn: persona !== null,
        signIn,
        signOut,
        remoteFeatures,
        loadingRemote,
        layout,
        loadingLayout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
