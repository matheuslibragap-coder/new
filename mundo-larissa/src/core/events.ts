type Handler = (...args: any[]) => void;

/** Barramento de eventos simples que liga a lógica, a interface (DOM) e as cenas do Phaser. */
class Bus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, h: Handler): () => void {
    let set = this.map.get(event);
    if (!set) this.map.set(event, (set = new Set()));
    set.add(h);
    return () => this.off(event, h);
  }

  off(event: string, h: Handler) {
    this.map.get(event)?.delete(h);
  }

  emit(event: string, ...args: any[]) {
    this.map.get(event)?.forEach((h) => {
      try {
        h(...args);
      } catch (e) {
        console.error('Erro no evento', event, e);
      }
    });
  }
}

export const bus = new Bus();
