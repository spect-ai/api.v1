import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService extends ConsoleLogger {
  recordLog(
    message: any,
    level: string,
    ...optionalParams: [...any, string?]
  ): void {
    try {
      if (process.env.NODE_ENV === 'production') {
        fetch(
          `https://logsene-receiver.sematext.com/${process.env.SEMA_TOKEN}/example/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              optionalParams,
              context: this.context,
              level,
            }),
          },
        );
      } else {
        console.log(message);
      }
    } catch (error) {
      console.log(error);
    }
  }
  log(message: any, ...optionalParams: [...any, string?]): void {
    this.recordLog(message, 'info', ...optionalParams);
  }

  debug(message: any, ...optionalParams: [...any, string?]): void {
    this.recordLog(message, 'debug', ...optionalParams);
  }

  warn(message: any, ...optionalParams: [...any, string?]): void {
    this.recordLog(message, 'warn', ...optionalParams);
  }

  error(message: any, ...optionalParams: [...any, string?]): void {
    this.recordLog(message, 'error', ...optionalParams);
  }

  async logError(
    message: any,
    request?: any,
    ...optionalParams: [...any, string?]
  ): Promise<void> {
    const bodySizeInBytes = new TextEncoder().encode(request.body).length;
    this.error(message, {
      ...optionalParams,
      request: request
        ? {
            method: request.method,
            url: request.url,
            body: bodySizeInBytes < 500000 ? request.body : '', // 500kb
            query: request.query,
            params: request.params,
            caller: request.user?.id,
          }
        : {},
    });
  }
}
