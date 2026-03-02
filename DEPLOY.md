# Guía de Despliegue — Mushoku Tensei Slots

## Opción A: Render (Gratis)

### 1. Subir a GitHub
1. Crea un repositorio en https://github.com/new llamado `mushoku-tensei-slots`
2. Descomprime este ZIP y sube todos los archivos al repositorio

### 2. Desplegar en Render
1. Ve a https://render.com y crea cuenta gratuita
2. Clic en **New → Web Service**
3. Conecta tu GitHub y selecciona `mushoku-tensei-slots`
4. Render detectará el `render.yaml` automáticamente
5. Agrega estas variables de entorno en el panel de Render:
   - `DATABASE_URL` → URL de tu base de datos MySQL
   - `JWT_SECRET` → cualquier string largo y aleatorio
   - `PAYPAL_CLIENT_ID` → de developer.paypal.com
   - `PAYPAL_CLIENT_SECRET` → de developer.paypal.com
   - `VITE_PAYPAL_CLIENT_ID` → mismo que PAYPAL_CLIENT_ID

### 3. Base de datos MySQL gratis
Usa **PlanetScale** (https://planetscale.com) o **Clever Cloud** (https://clever-cloud.com)
- Crea una base de datos MySQL gratis
- Copia la URL de conexión como `DATABASE_URL`

### Comandos de build
- Instalar: `pnpm install`
- Construir: `pnpm build`
- Iniciar: `node dist/index.js`
- Migrar DB: `pnpm db:push`
