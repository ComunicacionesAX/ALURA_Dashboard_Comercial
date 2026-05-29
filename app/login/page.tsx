import { redirect } from 'next/navigation';
import Image from 'next/image';

import {
  getSessionFromCookies,
  hasPasswordlessAllowedUsers,
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
      title: 'Acceso no disponible',
      body: 'El sistema no esta disponible en este momento. Contacta al administrador.',
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
  const message = getMessage(takeFirst(params.error), takeFirst(params.notice));
  const session = await getSessionFromCookies();
  const passwordRequired = !hasPasswordlessAllowedUsers();

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen flex">

      {/* ── Panel izquierdo ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-[#993935] overflow-hidden flex-col justify-between px-14 py-12">

        {/* Círculos decorativos de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/10" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
            alt="Alura"
            width={120}
            height={42}
            className="brightness-0 invert"
          />
        </div>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Dashboard Comercial
            </span>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Toma decisiones<br />con datos en<br />tiempo real.
            </h1>
          </div>

          <div className="space-y-4">
            {[
              'Ventas y cumplimiento de presupuesto por consultor',
              'Seguimiento de clientes nuevos y sin movimiento',
              'Indicadores de desempeno para el equipo CTC',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l2.5 2.5L9 1" />
                  </svg>
                </div>
                <span className="text-sm text-white/75 leading-5">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Alura &middot; Iluma Alliance
          </p>
        </div>
      </div>

      {/* ── Panel derecho / formulario ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FB] px-6 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center">
            <Image
              src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
              alt="Alura"
              width={100}
              height={35}
              className="h-8 w-auto"
            />
          </div>

          {/* Encabezado */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-[#6B7280]">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : message.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              <p className="font-semibold">{message.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{message.body}</p>
            </div>
          )}

          {/* Formulario */}
          <form action="/api/auth/login" method="post" className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#374151]">
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="username"
                placeholder="nombre@empresa.com"
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] shadow-sm outline-none transition focus:border-[#993935] focus:ring-2 focus:ring-[#993935]/15"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required={passwordRequired}
                autoComplete="current-password"
                placeholder="Tu contrasena"
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] shadow-sm outline-none transition focus:border-[#993935] focus:ring-2 focus:ring-[#993935]/15"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#993935] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7D2E2B] active:scale-[0.98]"
            >
              Iniciar sesion
            </button>
          </form>

          <p className="text-center text-xs text-[#9CA3AF]">
            Si tienes problemas para ingresar, contacta al administrador.
          </p>
        </div>
      </div>

    </main>
  );
}
