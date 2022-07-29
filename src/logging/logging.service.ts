import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogContent {
  caller?: string;
  level: string;
  message: string;
}

@Injectable()
export class LoggingService {
  log(content: LogContent): void {
    console.log(process.env.SEMA_TOKEN);
    console.log(process.env.ENV);

    if (process.env.ENV === 'Production') {
      console.log(content);
      fetch(
        `https://logsene-receiver.sematext.com/${process.env.SEMA_TOKEN}/example/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(content),
        },
      )
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log(content);
    }
  }

  logInfo(message: string, caller?: string): void {
    this.log({
      caller,
      level: 'info',
      message,
    });
  }

  logError(message: string, caller?: string): void {
    this.log({
      caller,
      level: 'error',
      message,
    });
  }

  logDebug(message: string, caller?: string): void {
    this.log({
      caller,
      level: 'debug',
      message,
    });
  }

  logWarn(message: string, caller?: string): void {
    this.log({
      caller,
      level: 'warn',
      message,
    });
  }
}
