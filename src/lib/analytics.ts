import { supabase } from './supabase';

interface TrackEventOptions {
  userId?: string;
  eventType: 'auth' | 'navigation' | 'feature_usage' | 'deal_progress' | 'revenue' | 'subscription' | 'customer_interaction' | 'system_performance';
  eventName: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export const analytics = {
  track: async (options: TrackEventOptions) => {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert([{
          user_id: options.userId,
          event_type: options.eventType,
          event_name: options.eventName,
          metadata: options.metadata || {},
          session_id: options.sessionId
        }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics errors shouldn't break the app
      return null;
    }
  },

  startSession: async (userId: string, deviceInfo: any) => {
    try {
      const { data, error } = await supabase
        .from('analytics_sessions')
        .insert([{
          user_id: userId,
          device_info: deviceInfo
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Session start error:', error);
      return null;
    }
  },

  endSession: async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('analytics_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Session end error:', error);
    }
  },

  trackPageView: async (userId: string, sessionId: string, path: string, queryParams?: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('analytics_page_views')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          path,
          query_params: queryParams || {}
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Page view tracking error:', error);
    }
  }
};