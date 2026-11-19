import type { Server } from 'node:http';

export async function listenLocal(server: Server, initialPort: number, attempts = 10, onRetry?: (port: number) => void, host = '127.0.0.1'): Promise<number> {
  for (let offset = 0; offset < attempts && initialPort + offset <= 65535; offset++) {
    const port = initialPort + offset;
    try {
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => { server.off('error', failed); server.off('listening', ready); };
        const failed = (error: Error) => { cleanup(); reject(error); };
        const ready = () => { cleanup(); resolve(); };
        server.once('error', failed); server.once('listening', ready); server.listen(port, host);
      });
      return port;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE' || offset + 1 >= attempts || port === 65535) throw error;
      onRetry?.(port);
    }
  }
  throw new Error('Não há porta local disponível no intervalo configurado.');
}
