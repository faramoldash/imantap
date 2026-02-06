interface QueueItem {
  userId: string;  // ✅ Изменено на string
  data: any;
  timestamp: number;
}

class SyncQueue {
  private queue: QueueItem[] = [];
  private readonly STORAGE_KEY = 'sync_queue_v1';
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 дней
  private readonly MAX_ITEMS = 100; // Максимум 100 элементов

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // ✅ Фильтруем старые элементы
        this.queue = parsed.filter((item: QueueItem) => 
          now - item.timestamp < this.MAX_AGE
        );
        
        // ✅ Ограничиваем размер
        if (this.queue.length > this.MAX_ITEMS) {
          this.queue = this.queue.slice(-this.MAX_ITEMS);
        }
        
        console.log(`📦 Loaded ${this.queue.length} items from sync queue`);
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
    // ✅ Дедупликация - удаляем старые записи этого пользователя
    this.queue = this.queue.filter(item => item.userId !== data.userId);
    
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
