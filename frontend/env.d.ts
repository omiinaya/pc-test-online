/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<object, object, unknown>;
    export default component;
}

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_API_URL: string;
    readonly VITE_ANALYTICS_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
