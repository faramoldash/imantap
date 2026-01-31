// src/utils/syncQueue.ts

interface QueueItem {
  id: string;
  timestamp: number;
  data: any;
}

class SyncQueue {
  private queue: QueueItem[] = [];
  private readonly STORAGE_KEY = 'imantap_sync_queue';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  add(data: any) {
    const item: QueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      data
    };
    
    this.queue.push(item);
    this.saveToStorage();
    console.log('📦 Added to sync queue:', item.id, `(total: ${this.queue.length})`);
  }

  async processQueue(syncFunction: (data: any) => Promise<boolean>) {
    if (this.queue.length === 0) return 0;

    console.log(`🔄 Processing ${this.queue.length} queued sync items...`);
    const itemsToProcess = [...this.queue];
    let successCount = 0;
    
    this.queue = [];
    
    for (const item of itemsToProcess) {
      try {
        const success = await syncFunction(item.data);
        if (success) {
          successCount++;
        } else {
          // Если не удалось, возвращаем в очередь
          this.queue.push(item);
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        // При ошибке также возвращаем
        this.queue.push(item);
      }
    }
    
    this.saveToStorage();
    console.log(`✅ Processed ${successCount}/${itemsToProcess.length} items`);
    return successCount;
  }

  getCount() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Sync queue cleared');
  }
}

export const syncQueue = new SyncQueue();