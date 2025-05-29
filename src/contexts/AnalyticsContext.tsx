import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { analytics } from '../lib/analytics';

interface AnalyticsContextType {
  trackEvent: (eventName: string, metadata?: Record<string, any>) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      analytics.startSession(user.id, deviceInfo).then(setSessionId);

      return () => {
        if (sessionId) {
          analytics.endSession(sessionId);
        }
      };
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && sessionId) {
      analytics.trackPageView(
        user.id,
        sessionId,
        location.pathname,
        Object.fromEntries(new URLSearchParams(location.search))
      );
    }
  }, [location, user?.id, sessionId]);

  const trackEvent = async (eventName: string, metadata?: Record<string, any>) => {
    if (user?.id) {
      await analytics.track({
        userId: user.id,
        eventType: 'feature_usage',
        eventName,
        metadata,
        sessionId: sessionId || undefined
      });
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};