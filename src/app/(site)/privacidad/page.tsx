import type { Metadata } from "next";
import { getSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description: "Cómo Emaús Cristo Rey Cali trata los datos personales recolectados en el registro de asistencia a eventos.",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Política de tratamiento de datos personales</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-stone-700">
        <p>
          En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Emaús Cristo Rey Cali informa que los datos personales
          recolectados a través del registro de asistencia (número de documento, nombre completo, teléfono y fecha de nacimiento) se usan
          exclusivamente para llevar el control de asistencia a nuestras actividades y para comunicarnos con los participantes de la comunidad.
        </p>
        <p>
          Los datos no se comparten con terceros ni se usan con fines comerciales. Para agilizar futuros registros, al ingresar tu número de
          documento se mostrarán los datos que suministraste previamente para que puedas confirmarlos o actualizarlos.
        </p>
        <p>
          Como titular puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento
          {settings.email ? (
            <>
              {" "}escribiendo a <a href={`mailto:${settings.email}`} className="font-semibold text-brand-700">{settings.email}</a>
            </>
          ) : (
            " comunicándote con la coordinación del grupo"
          )}
          .
        </p>
      </div>
    </div>
  );
}
