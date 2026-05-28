# Dashboard Comercial CTC

Proyecto en `Next.js` para consultar KPIs, ventas y filtros comerciales/gerenciales.

## Desarrollo local

```bash
npm install
npm run dev
```

El proyecto seguira funcionando con datos locales si no encuentra credenciales de Google Sheets.

## Login privado

Se agrego un login propio para restringir el acceso solo a personas autorizadas.

Variables necesarias:

- `AUTH_SECRET`: secreto largo para firmar la sesion.
- `AUTH_ALLOWED_USERS`: JSON con los usuarios permitidos.
- `AUTH_SESSION_HOURS`: horas de duracion de la sesion. Opcional.
- `AUTH_FORCE`: si lo pones en `true`, el login tambien se exige fuera de produccion.

Ejemplo:

```env
AUTH_SECRET=pon-aqui-un-secreto-largo-y-unico
AUTH_ALLOWED_USERS={"ana@empresa.com":"ClaveSegura123!","carlos@empresa.com":"ClaveSegura456!"}
AUTH_SESSION_HOURS=12
AUTH_FORCE=false
```

Notas:

- El login protege la UI y tambien `/api/data/*`.
- Si en produccion faltan `AUTH_SECRET` o `AUTH_ALLOWED_USERS`, la app no queda abierta por accidente: redirige al login con aviso de configuracion pendiente.
- Si luego quieres SSO con Google o Microsoft, esta implementacion se puede reemplazar por `Auth.js` o un proveedor externo sin rehacer todo el dashboard.

## Google Sheets en Vercel

En local puedes seguir usando el archivo `gsheets_credentials.json`.

En Vercel no debes subir ese archivo. Usa variables de entorno:

```env
GSHEETS_FILE_ID=1c8vJpVXrVZhSbcDHOX1I18aDEZlsM2fm
GSHEETS_CREDENTIALS_JSON={"type":"service_account","project_id":"tu-proyecto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"tu-cuenta@tu-proyecto.iam.gserviceaccount.com","client_id":"...","token_uri":"https://oauth2.googleapis.com/token"}
```

Si `GSHEETS_CREDENTIALS_JSON` no existe, el proyecto cae a los datos locales sin romper el despliegue.

## Subir a Vercel

1. Sube este repo a GitHub.
2. Importa el repositorio en Vercel.
3. En `Settings > Environment Variables`, agrega:
   `AUTH_SECRET`, `AUTH_ALLOWED_USERS`, `AUTH_SESSION_HOURS` opcional, `GSHEETS_FILE_ID` y `GSHEETS_CREDENTIALS_JSON`.
4. Ejecuta el deploy.

## Archivo de ejemplo

Tienes un ejemplo listo en [.env.example](./.env.example).
