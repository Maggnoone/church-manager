# Deploy en Vercel

## Variables de entorno

En el dashboard de Vercel → Settings → Environment Variables, agregar:

| Key | Valor | Entorno |
|-----|-------|---------|
| `VITE_SUPABASE_URL` | https://afsycytxlakqrjvjfoss.supabase.co | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | <tu-publishable-key> | Production, Preview, Development |
| `SUPABASE_URL` | https://afsycytxlakqrjvjfoss.supabase.co | Production, Preview, Development |
| `SUPABASE_PUBLISHABLE_KEY` | <tu-publishable-key> | Production, Preview, Development |

## Pasos de deploy

1. Conectar el repo a Vercel
2. Configurar las variables de entorno (arriba)
3. Deploy automático al hacer push a main

## Build local test

```bash
npm run build
```

El resultado debe estar en `dist/client/` (el shell estático es `_shell.html`).
