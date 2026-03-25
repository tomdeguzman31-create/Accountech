import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const frontendEnv = loadEnv(mode, '.', '');
    const rootEnv = loadEnv(mode, '..', '');
    const env = { ...rootEnv, ...frontendEnv };

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            },
            extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
    };
});
//# sourceMappingURL=vite.config.js.map