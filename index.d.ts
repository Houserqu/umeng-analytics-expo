declare module 'expo-umeng-analytics' {
  // 原生模块是否已集成到当前二进制。
  // 若仅通过 OTA 热更新下发了 JS 但原生未重新构建，此值为 false，
  // 此时调用各接口会安全降级为无操作，不会崩溃。
  export const isAvailable: boolean;

  export const CHANNEL: string;

  export function init(): Promise<void>;

  export function getDeviceInfo(): Promise<any>;

  export function getUserAgent(): Promise<any>;

  export function getPhoneNumber(): Promise<any>;

  export function signIn(userId: string, provider?: string): void;

  export function signOut(): void;

  export function exitApp(): void;

  export function enterPage(pageName: string): void;

  export function leavePage(pageName: string): void;

  export function sendEvent(eventId: string): void;

  export function sendEventLabel(eventId: string, label: string): void;

  export function sendEventData(eventId: string, data: Record<string, any>): void;

  export function sendEventCounter(eventId: string, data: Record<string, any>, counter: number): void;

  export function sendError(error: string): void;
}