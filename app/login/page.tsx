import { redirect } from 'next/navigation';

import {
  getSessionFromCookies,
  isAuthConfigured,
  sanitizeRedirectPath,
} from '@/lib/auth';

type SearchParams = Promise<{
  error?: string | string[];
  next?: string | string[];
  notice?: string | string[];
}>;

function takeFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(error: string | undefined, notice: string | undefined) {
  if (notice === 'signed-out') {
    return {
      tone: 'neutral' as const,
      title: 'Sesion cerrada',
      body: 'Tu acceso fue cerrado correctamente.',
    };
  }

  if (error === 'credentials') {
    return {
      tone: 'error' as const,
      title: 'Credenciales invalidas',
      body: 'Verifica el correo y la clave asignada para este dashboard.',
    };
  }

  if (error === 'config') {
    return {
      tone: 'warning' as const,
      title: 'Configuracion pendiente',
      body: 'Faltan AUTH_SECRET o AUTH_ALLOWED_USERS en el entorno de despliegue.',
    };
  }

  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const nextPath = sanitizeRedirectPath(takeFirst(params.next));
  const message = getMessage(
    takeFirst(params.error),
    takeFirst(params.notice)
  );
  const session = await getSessionFromCookies();
  const authConfigured = isAuthConfigured();
  const blockForm = !authConfigured;

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f6d2cf_0%,#f3f4f6_38%,#e7ebf0_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_28px_90px_rgba(43,46,53,0.18)] lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-between bg-[#993935] px-8 py-10 text-white sm:px-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Acceso privado
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                  Dashboard Comercial CTC
                </h1>
                <p className="max-w-md text-sm leading-6 text-white/82 sm:text-base">
                  El ingreso esta restringido solo a las personas autorizadas. Inicia sesion con el usuario y clave que definas en Vercel.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white/82">
              <div className="rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                Protege la interfaz y tambien las rutas <code>/api/data/*</code>.
              </div>
              <div className="rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                Soporta una lista cerrada de usuarios sin necesidad de base de datos.
              </div>
              <div className="rounded-[16px] border border-white/14 bg-white/8 px-4 py-4">
                En Vercel puedes mantener las credenciales fuera del repositorio.
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              <div className="mb-8 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#993935]">
                  Ingreso
                </p>
                <h2 className="text-2xl font-bold text-[#2B2E35]">
                  Accede con tus credenciales
                </h2>
                <p className="text-sm leading-6 text-[#6B7381]">
                  Si mas adelante quieres cuentas con Google o Microsoft, esta base ya queda lista para escalar.
                </p>
              </div>

              {message && (
                <div
                  className={`mb-6 rounded-[16px] border px-4 py-3 text-sm ${
                    message.tone === 'error'
                      ? 'border-[#EB5852]/30 bg-[#EB5852]/8 text-[#7A231A]'
                      : message.tone === 'warning'
                        ? 'border-[#FFA600]/35 bg-[#FFA600]/10 text-[#7A5200]'
                        : 'border-[#82BDFF]/40 bg-[#82BDFF]/12 text-[#174273]'
                  }`}
                >
                  <p className="font-semibold">{message.title}</p>
                  <p className="mt-1">{message.body}</p>
                </div>
              )}

              <form action="/api/auth/login" method="post" className="space-y-5">
                <input type="hidden" name="next" value={nextPath} />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#2B2E35]">Correo</span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="username"
                    disabled={blockForm}
                    className="w-full rounded-[14px] border border-[#D7DEE8] bg-[#F7F9FC] px-4 py-3 text-sm text-[#2B2E35] outline-none transition focus:border-[#993935] focus:bg-white focus:ring-2 focus:ring-[#993935]/10 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="nombre@empresa.com"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#2B2E35]">Clave</span>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    disabled={blockForm}
                    className="w-full rounded-[14px] border border-[#D7DEE8] bg-[#F7F9FC] px-4 py-3 text-sm text-[#2B2E35] outline-none transition focus:border-[#993935] focus:bg-white focus:ring-2 focus:ring-[#993935]/10 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Tu clave"
                  />
                </label>

                <button
                  type="submit"
                  disabled={blockForm}
                  className="w-full rounded-[14px] bg-[#993935] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7A2E2B] disabled:cursor-not-allowed disabled:bg-[#C9B5B3]"
                >
                  Entrar al dashboard
                </button>
              </form>

              <div className="mt-6 rounded-[16px] border border-[#DBE2EB] bg-[#F7F9FC] px-4 py-4 text-sm text-[#5C6572]">
                <p className="font-semibold text-[#2B2E35]">Variables necesarias</p>
                <p className="mt-1">
                  <code>AUTH_SECRET</code> y <code>AUTH_ALLOWED_USERS</code>.
                  {` `}
                  {authConfigured
                    ? 'La autenticacion ya esta configurada en este entorno.'
                    : 'Todavia no estan disponibles en este entorno.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
