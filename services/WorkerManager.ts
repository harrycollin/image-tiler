import {
  WorkerProcessRequest,
  WorkerProcessResponse,
  WorkerErrorResponse,
} from "../workers/imageProcessor.worker";

interface PendingRequest {
  resolve: (result: { imageData: ImageData; tiledPattern: ImageData }) => void;
  reject: (error: Error) => void;
}

export class WorkerManager {
  private static instance: WorkerManager | null = null;
  private worker: Worker | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestIdCounter = 0;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  private initWorker(): void {
    try {
      // Create worker from the worker file
      this.worker = new Worker(
        new URL("../workers/imageProcessor.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (
        event: MessageEvent<WorkerProcessResponse | WorkerErrorResponse>
      ) => {
        const { type, id } = event.data;
        const pending = this.pendingRequests.get(id);

        if (!pending) {
          console.error(`No pending request found for id: ${id}`);
          return;
        }

        this.pendingRequests.delete(id);

        if (type === "process-complete") {
          const response = event.data as WorkerProcessResponse;
          pending.resolve({
            imageData: response.imageData,
            tiledPattern: response.tiledPattern,
          });
        } else if (type === "error") {
          const errorResponse = event.data as WorkerErrorResponse;
          pending.reject(new Error(errorResponse.error));
        }
      };

      this.worker.onerror = (error) => {
        console.error("Worker error:", error);
        // Reject all pending requests
        this.pendingRequests.forEach((pending) => {
          pending.reject(
            new Error("Worker error: " + (error.message || "Unknown error"))
          );
        });
        this.pendingRequests.clear();
      };
    } catch (error) {
      console.error("Failed to initialize worker:", error);
      this.worker = null;
    }
  }

  public processImage(
    imageData: ImageData,
    settings: any
  ): Promise<{ imageData: ImageData; tiledPattern: ImageData }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const id = `req-${++this.requestIdCounter}`;
      this.pendingRequests.set(id, { resolve, reject });

      const request: WorkerProcessRequest = {
        type: "process",
        id,
        imageData: imageData,
        settings,
      };

      // Transfer the ImageData buffer to worker (zero-copy transfer)
      // The ArrayBuffer is transferred, not copied, making this very efficient
      this.worker.postMessage(request, [imageData.data.buffer]);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
    WorkerManager.instance = null;
  }

  public isAvailable(): boolean {
    return this.worker !== null;
  }
}
