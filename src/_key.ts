export const key: Key = {
    env: (process.env as any).NODE_ENV === 'production' ? 'prod' : 'dev'
} as const;