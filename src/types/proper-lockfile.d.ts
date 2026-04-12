declare module 'proper-lockfile' {
    export interface LockOptions {
        stale?: number;
        update?: number;
        retries?: {
            retries: number;
            factor: number;
            minTimeout: number;
        };
    }

    export interface ReleaseFunction {
        (): Promise<void>;
    }

    export function lock(
        path: string,
        options?: LockOptions
    ): Promise<ReleaseFunction>;

    export function unlock(path: string): Promise<void>;

    export function check(path: string, options?: LockOptions): Promise<boolean>;
}
