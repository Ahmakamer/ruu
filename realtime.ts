import { supabase } from '../db';
import logger from './logger';
import { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeService {
  private messageChannel: RealtimeChannel | null = null;
  private listingChannel: RealtimeChannel | null = null;

  // Initialize real-time channels
  initialize() {
    this.setupMessageChannel();
    this.setupListingChannel();
    logger.info('Realtime channels initialized');
  }

  // Set up message notifications
  private setupMessageChannel() {
    this.messageChannel = supabase.channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          try {
            const { new: newMessage } = payload;
            // Emit to connected clients via WebSocket
            // You'll implement this when we add WebSocket support
            logger.info('New message received:', newMessage);
          } catch (error) {
            logger.error('Error processing message notification:', error);
          }
        }
      )
      .subscribe((status) => {
        logger.info('Message channel status:', status);
      });
  }

  // Set up listing notifications
  private setupListingChannel() {
    this.listingChannel = supabase.channel('listings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        async (payload) => {
          try {
            const { eventType, new: newListing, old: oldListing } = payload;
            // Handle different event types
            switch (eventType) {
              case 'INSERT':
                logger.info('New listing created:', newListing);
                break;
              case 'UPDATE':
                logger.info('Listing updated:', { old: oldListing, new: newListing });
                break;
              case 'DELETE':
                logger.info('Listing deleted:', oldListing);
                break;
            }
          } catch (error) {
            logger.error('Error processing listing notification:', error);
          }
        }
      )
      .subscribe((status) => {
        logger.info('Listing channel status:', status);
      });
  }

  // Clean up function
  cleanup() {
    this.messageChannel?.unsubscribe();
    this.listingChannel?.unsubscribe();
    logger.info('Realtime channels cleaned up');
  }
}

export const realtimeService = new RealtimeService();
