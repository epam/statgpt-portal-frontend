/* eslint-disable no-console */
/**
 * Next.js-compatible structured logging system
 *
 * Provides a comprehensive logging solution with configurable log levels,
 * structured context support, environment-aware formatting, and specialized
 * loggers for different application domains (API, DIAL, Chat, etc.).
 * Designed for both development and production use in Next.js applications.
 */

import { LogContext, LogLevel } from '../types/log';
import { parseBoolean } from '@epam/statgpt-shared-toolkit';

class NextLogger {
  private name: string;
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private debugMode = parseBoolean(process.env.NEXT_PUBLIC_DEBUG);
  private logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

  private readonly levels: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  constructor(name: string) {
    this.name = name;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      return `${baseLog} ${JSON.stringify(context, null, this.isDevelopment ? 2 : 0)}`;
    }

    return baseLog;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedLog = this.formatLog(level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.debugMode) console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.log(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }
}

export const logger = new NextLogger('APP');
export const apiLogger = new NextLogger('API');
export const chatLogger = new NextLogger('CHAT');

export default NextLogger;
