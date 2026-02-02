interface QueueItem {
  userId: number;
  data: any;
  timestamp: number;
}

class SyncQueue {
  private queue: QueueItem[] = [];
  private readonly STORAGE_KEY = 'sync_queue_v1';

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  add(data: any) {
    this.queue.push({
      userId: data.userId,
      data,
      timestamp: Date.now()
    });
    this.saveQueue();
    console.log(`📦 Added to sync queue. Total items: ${this.queue.length}`);
  }

  async processQueue(processor: (data: any) => Promise<boolean>): Promise<number> {
    if (this.queue.length === 0) {
      return 0;
    }

    console.log(`🔄 Processing ${this.queue.length} items in sync queue...`);
    let processed = 0;
    const failed: QueueItem[] = [];

    for (const item of this.queue) {
      try {
        const success = await processor(item.data);
        if (success) {
          processed++;
          console.log(`✅ Processed item for user ${item.userId}`);
        } else {
          failed.push(item);
          console.log(`❌ Failed to process item for user ${item.userId}`);
        }
      } catch (error) {
        console.error('Error processing queue item:', error);
        failed.push(item);
      }
    }

    this.queue = failed;
    this.saveQueue();
    console.log(`📊 Processed: ${processed}, Failed: ${failed.length}`);
    return processed;
  }

  getSize(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️ Sync queue cleared');
  }
}

export const syncQueue = new SyncQueue();