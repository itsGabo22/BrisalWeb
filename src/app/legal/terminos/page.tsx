import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Términos y Condiciones | Brisal by Salvador',
    description:
      'Lee los términos y condiciones de uso del catálogo y los servicios de Brisal by Salvador.',
  };
}

export default function TerminosPage() {
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
          Términos y Condiciones
        </h1>
        <p className="mt-3 font-sans text-sm text-brand-neutral-500">
          Última actualización: Junio 2025
        </p>
      </header>

      <div className="space-y-10 font-sans text-brand-neutral-700">
        <section aria-labelledby="terms-s1">
          <h2
            id="terms-s1"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            1. Aceptación de los términos
          </h2>
          <p className="text-sm leading-relaxed">
            Al acceder y utilizar el catálogo virtual de Brisal by Salvador
            (en adelante, &ldquo;el Sitio&rdquo;), aceptas quedar vinculado por
            los presentes Términos y Condiciones. Si no estás de acuerdo con
            alguna parte de estos términos, te pedimos que no uses el Sitio. El
            uso continuado del Sitio tras la publicación de modificaciones a
            estos términos implica tu aceptación de dichos cambios.
          </p>
        </section>

        <section aria-labelledby="terms-s2">
          <h2
            id="terms-s2"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            2. Uso del catálogo
          </h2>
          <p className="text-sm leading-relaxed">
            El Sitio tiene como propósito mostrar el catálogo de accesorios
            premium de Brisal by Salvador. Los precios y la disponibilidad de
            los productos están sujetos a cambios sin previo aviso. Las
            imágenes de los productos son de carácter ilustrativo; los colores
            y detalles reales pueden variar según la pantalla del dispositivo.
            El uso del Sitio está permitido únicamente para fines personales y
            no comerciales, salvo que cuentes con una autorización expresa como
            mayorista registrado.
          </p>
        </section>

        <section aria-labelledby="terms-s3">
          <h2
            id="terms-s3"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            3. Propiedad intelectual
          </h2>
          <p className="text-sm leading-relaxed">
            Todo el contenido del Sitio, incluyendo textos, imágenes,
            fotografías, logotipos, diseños y código fuente, es propiedad
            exclusiva de Brisal by Salvador o de sus licenciantes, y está
            protegido por las leyes colombianas e internacionales de propiedad
            intelectual. Queda estrictamente prohibida la reproducción,
            distribución, modificación o uso del contenido sin autorización
            previa y por escrito.
          </p>
        </section>

        <section aria-labelledby="terms-s4">
          <h2
            id="terms-s4"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            4. Limitación de responsabilidad
          </h2>
          <p className="text-sm leading-relaxed">
            Brisal by Salvador no será responsable por daños directos,
            indirectos, incidentales o consecuentes derivados del uso o la
            imposibilidad de uso del Sitio, incluyendo pero no limitándose a:
            pérdida de datos, interrupción del servicio o inexactitudes en la
            información mostrada. El Sitio se proporciona &ldquo;tal cual&rdquo; y sin
            garantías de ningún tipo, expresas o implícitas.
          </p>
        </section>

        <section aria-labelledby="terms-s5">
          <h2
            id="terms-s5"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            5. Modificaciones
          </h2>
          <p className="text-sm leading-relaxed">
            Brisal by Salvador se reserva el derecho de modificar estos
            Términos y Condiciones en cualquier momento. Cualquier cambio
            entrará en vigor en el momento de su publicación en el Sitio. Te
            recomendamos revisar esta página periódicamente para estar al tanto
            de posibles actualizaciones.
          </p>
        </section>

        <section aria-labelledby="terms-s6">
          <h2
            id="terms-s6"
            className="mb-3 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            6. Ley aplicable y jurisdicción
          </h2>
          <p className="text-sm leading-relaxed">
            Estos Términos y Condiciones se rigen por las leyes de la
            República de Colombia. Cualquier controversia que surja en relación
            con el uso del Sitio o con la interpretación de estos términos será
            sometida a la jurisdicción de los tribunales competentes de la
            ciudad de Colombia, renunciando las partes a cualquier otro fuero
            que pudiera corresponderles.
          </p>
        </section>
      </div>
    </main>
  );
}
