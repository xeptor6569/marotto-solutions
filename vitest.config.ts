import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        // Pin the host timezone so date math tests behave identically on dev
        // machines, CI runners, and Docker (which runs UTC).
        env: { TZ: 'UTC' },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
