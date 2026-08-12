// src/pages/enlaces.txt.ts
// Genera la lista de enlaces para repartir, uno por invitado.
//
//   · en desarrollo:  http://localhost:PUERTO/enlaces.txt
//   · en el build:    queda como archivo real en dist/enlaces.txt
//
// La base de los enlaces se resuelve sola; ver el comentario del GET.
//
// ⚠️ No guardar la copia en la raíz del proyecto con el nombre
// "enlaces.txt": en desarrollo Vite sirve los archivos del disco antes de
// llegar a las rutas de Astro, así que ese archivo taparía este endpoint y
// se seguiría viendo una lista vieja aunque lista.txt haya cambiado. La
// copia va como "enlaces-invitados.txt".
//
// Sale del mismo leerInvitados() que arma las páginas, así que un enlace de
// acá no puede apuntar nunca a una invitación que no exista.
import type { APIRoute } from "astro";
import { leerInvitados } from "../data/invitados.mjs";

export const GET: APIRoute = ({ site, url }) => {
    /*
       La base se resuelve sola, sin constantes que queden viejas:

         · en desarrollo no hay `site` configurado, así que usa el origen
           real del pedido. El puerto de Astro va saltando (4321 en uso →
           4322 → 4323…) y de esta forma los enlaces siempre salen con el
           puerto correcto, sin tener que acordarse de tocar nada.

         · al publicar, alcanza con poner `site: "https://tudominio.com"`
           en astro.config.mjs y los 61 enlaces se regeneran apuntando ahí.
    */
    const base = (site?.href ?? url.origin).replace(/\/+$/, "");

    const invitados = leerInvitados();

    const renglones = invitados.map(
        ({ nombre, pases, slug }, i) =>
            `${i + 1}. ${nombre} - ${pases} persona(s)\n   ${base}/${slug}`,
    );

    /*
       Un build sin `site` configurado deja enlaces a localhost, que fuera
       de esta máquina no abren. El aviso va dentro del propio archivo para
       que sea imposible repartirlos sin darse cuenta.
    */
    const aviso = base.includes("localhost")
        ? [
              "*** OJO: estos enlaces son de PRUEBA y sólo funcionan en esta",
              "*** computadora. Para repartirlos, poner el dominio real en",
              '*** astro.config.mjs como  site: "https://tudominio.com"  y',
              "*** volver a generar este archivo.",
              "",
          ]
        : [];

    const texto = [
        "ENLACES DE LA INVITACIÓN — Stephanie & Jorge",
        "Sábado 29 de agosto de 2026",
        "",
        ...aviso,
        `Invitación general (sin nombre ni pases): ${base}/`,
        "",
        `${invitados.length} invitaciones personalizadas:`,
        "",
        ...renglones,
        "",
    ].join("\n");

    return new Response(texto, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
