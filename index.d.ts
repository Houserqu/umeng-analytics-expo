declare module 'expo-umeng-analytics' {
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