import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { whalesApi } from '../api/whales.api';
import { socket } from '../lib/socket';

export function useWhales() {
  const queryClient = useQueryClient();

  const liveQuery = useQuery({
    queryKey: ['whales', 'live'],
    queryFn: async () => {
      return whalesApi.getLive();
    },
    refetchInterval: 15000, // Reduced from 5s to 15s since we now have real-time websocket updates!
  });

  const historyQuery = useQuery({
    queryKey: ['whales', 'history'],
    queryFn: async () => {
      return whalesApi.getHistory();
    }
  });

  useEffect(() => {
    const handleWhaleEvent = (newEvent: any) => {
      console.log('[useWhales] Live WebSocket event received:', newEvent);
      
      // Update React Query's live whales cache
      queryClient.setQueryData(['whales', 'live'], (oldData: any) => {
        if (!oldData) {
          return { events: [newEvent], verification: null };
        }
        
        const currentEvents = oldData.events || (Array.isArray(oldData) ? oldData : []);
        
        // Prevent duplicates
        if (currentEvents.some((e: any) => e.id === newEvent.id)) {
          return oldData;
        }

        const updatedEvents = [newEvent, ...currentEvents].slice(0, 10);
        
        return {
          ...oldData,
          events: updatedEvents
        };
      });

      // Invalidate history query to refresh tables
      queryClient.invalidateQueries({ queryKey: ['whales', 'history'] });
    };

    socket.on('whale_event', handleWhaleEvent);

    return () => {
      socket.off('whale_event', handleWhaleEvent);
    };
  }, [queryClient]);

  return {
    live: liveQuery,
    history: historyQuery
  };
}
