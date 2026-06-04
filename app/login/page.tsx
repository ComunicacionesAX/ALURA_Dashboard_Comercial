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
      title: 'Correo no autorizado',
      body: 'Este correo no tiene acceso al dashboard. Contacta al administrador.',
    };
  }
  if (error === 'oauth_cancelled') {
    return {
      tone: 'neutral' as const,
      title: 'Inicio de sesion cancelado',
      body: 'Cerraste la ventana de Google antes de completar el acceso.',
    };
  }
  if (error === 'oauth_error' || error === 'oauth_state' || error === 'oauth_invalid') {
    return {
      tone: 'error' as const,
      title: 'Error al autenticar con Google',
      body: 'Ocurrio un problema al conectar con Google. Intentalo de nuevo.',
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

      
      <div className="hidden lg:flex lg:w-[52%] relative bg-[#993935] overflow-hidden flex-col justify-between px-14 py-12">

        
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/10" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-white/5" />

        
        <div className="relative z-10">
          <Image
            src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
            alt="Alura"
            width={120}
            height={42}
            className="brightness-0 invert"
          />
        </div>

      
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

        
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Alura &middot; Iluma Alliance
          </p>
        </div>
      </div>

      
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FB] px-6 py-12">
        <div className="w-full max-w-sm space-y-8">

          
          <div className="lg:hidden flex justify-center">
            <Image
              src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
              alt="Alura"
              width={100}
              height={35}
              className="h-8 w-auto"
            />
          </div>

          
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
              Iniciar sesion
            </h2>
            <p className="text-sm text-[#6B7280]">
              Ingresa tu correo electronico para continuar.
            </p>
          </div>

          
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

        
          <a
            href={`/api/auth/google${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#111827] shadow-sm transition hover:bg-[#F3F4F6] active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
            </svg>
            Continuar con Google
          </a>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">o</span>
            <div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          
          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />

            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="username"
              placeholder="Direccion de correo electronico"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] shadow-sm outline-none transition focus:border-[#993935] focus:ring-2 focus:ring-[#993935]/15"
            />

            {passwordRequired && (
              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Contrasena"
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] shadow-sm outline-none transition focus:border-[#993935] focus:ring-2 focus:ring-[#993935]/15"
              />
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f2937] active:scale-[0.98]"
            >
              Continuar
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
