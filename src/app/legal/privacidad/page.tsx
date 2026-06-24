import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Política de Privacidad | Brisal by Salvador',
    description:
      'Conoce cómo Brisal by Salvador recopila, usa y protege tu información personal.',
  };
}

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      {/* Draft notice */}
      <div
        role="note"
        className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      >
        <span className="mt-0.5 text-xl leading-none" aria-hidden="true">⚠️</span>
        <p className="font-sans text-sm text-amber-800">
          <strong>Borrador de referencia.</strong> Este documento debe ser
          revisado y aprobado por un profesional legal antes de publicarse
          oficialmente.
        </p>
      </div>

      <header className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-brand-neutral-900">
          Política de Privacidad
        </h1>
        <p className="mt-3 font-sans text-sm text-brand-neutral-500">
          Última actualización: Junio 2025
        </p>
      </header>

      <div className="prose-brisal space-y-10 font-sans text-brand-neutral-700">
        <section aria-labelledby="priv-s1">
          <h2
            id="priv-s1"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            1. Información que recopilamos
          </h2>
          <p className="text-sm leading-relaxed">
            Cuando visitas nuestro catálogo o completas un formulario de
            contacto o solicitud de mayorista, podemos recopilar los siguientes
            datos personales: nombre completo, dirección de correo electrónico,
            número de teléfono, nombre del negocio y NIT o cédula (en el caso
            del programa de mayoristas). Adicionalmente, recopilamos datos de
            navegación de forma anónima (páginas visitadas, tiempo de sesión,
            tipo de dispositivo) con fines estadísticos y de mejora del
            servicio.
          </p>
        </section>

        <section aria-labelledby="priv-s2">
          <h2
            id="priv-s2"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            2. Cómo usamos tu información
          </h2>
          <p className="text-sm leading-relaxed">
            Los datos personales que nos proporcionas se utilizan
            exclusivamente para: responder tus consultas o mensajes de
            contacto, gestionar tu registro en el programa de mayoristas,
            enviarte información relevante sobre productos o servicios que
            hayas solicitado, y mejorar la experiencia de navegación en
            nuestro catálogo. No utilizamos tus datos para fines de marketing
            no solicitado (spam).
          </p>
        </section>

        <section aria-labelledby="priv-s3">
          <h2
            id="priv-s3"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            3. Compartir información con terceros
          </h2>
          <p className="text-sm leading-relaxed">
            Brisal by Salvador no vende, alquila ni comparte tu información
            personal con terceros con fines comerciales. Podemos compartir
            datos con proveedores de servicios tecnológicos (como plataformas
            de envío de correo electrónico) únicamente en la medida necesaria
            para prestar los servicios que has solicitado, bajo acuerdos de
            confidencialidad. Estos proveedores no tienen autorización para
            usar tu información con otros fines.
          </p>
        </section>

        <section aria-labelledby="priv-s4">
          <h2
            id="priv-s4"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            4. Seguridad de los datos
          </h2>
          <p className="text-sm leading-relaxed">
            Implementamos medidas de seguridad técnicas y organizativas
            razonables para proteger tu información personal contra acceso no
            autorizado, pérdida o divulgación. La transmisión de datos en
            nuestro sitio se realiza mediante cifrado HTTPS. Sin embargo,
            ningún sistema de seguridad es completamente infalible, por lo que
            no podemos garantizar la seguridad absoluta de los datos
            transmitidos a través de Internet.
          </p>
        </section>

        <section aria-labelledby="priv-s5">
          <h2
            id="priv-s5"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            5. Tus derechos
          </h2>
          <p className="text-sm leading-relaxed">
            De acuerdo con la Ley 1581 de 2012 (Ley de Protección de Datos
            Personales de Colombia) y sus decretos reglamentarios, tienes
            derecho a: conocer, actualizar, rectificar y suprimir tus datos
            personales; revocar la autorización otorgada para el tratamiento de
            tus datos; ser informado sobre el uso que se da a tus datos; y
            presentar quejas ante la Superintendencia de Industria y Comercio.
            Para ejercer cualquiera de estos derechos, puedes contactarnos a
            través del formulario de contacto o escribirnos directamente.
          </p>
        </section>

        <section aria-labelledby="priv-s6">
          <h2
            id="priv-s6"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            6. Contacto
          </h2>
          <p className="text-sm leading-relaxed">
            Si tienes preguntas sobre esta Política de Privacidad o sobre el
            manejo de tus datos personales, puedes contactarnos en:{' '}
            <a
              href="mailto:contacto@brisalbysalvador.com"
              className="text-brand-gold underline hover:text-brand-gold-light transition-colors"
            >
              contacto@brisalbysalvador.com
            </a>
            . También puedes usar el{' '}
            <a
              href="/contacto"
              className="text-brand-gold underline hover:text-brand-gold-light transition-colors"
            >
              formulario de contacto
            </a>{' '}
            disponible en nuestro sitio.
          </p>
        </section>
      </div>
    </main>
  );
}
