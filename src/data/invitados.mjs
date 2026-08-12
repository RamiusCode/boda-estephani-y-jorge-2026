// src/data/invitados.mjs
// Única fuente de verdad de la lista de invitados.
//
// Lo usan las páginas ([slug].astro) y el archivo de enlaces
// (enlaces.txt.ts). Que los dos salgan de acá es lo que garantiza que
// ningún enlace de la lista apunte a una invitación que no existe.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LISTA = fileURLToPath(new URL("../../lista.txt", import.meta.url));

/*
   Cada renglón viene así:
       12. Señor Iver Otterburg Calvo y acompañante - 2 persona(s)
   Se parte en el nombre —que se muestra literal, tal cual está escrito en
   lista.txt— y la cantidad de pases.
*/
const RENGLON = /^\s*\d+\.\s*(.+?)\s*-\s*(\d+)\s*persona\(s\)\s*$/i;

// Para la URL no hacen falta ni el tratamiento ni el acompañante: el slug
// queda mucho más corto y sigue identificando a la persona sin ambigüedad.
const TRATAMIENTO = /^(Señores|Señorita|Señora|Señor)\s+/i;
const ACOMPANANTE =
    /\s+y\s+(familia|esposa|esposo|acompañante|señora|señor|sra\.?|sr\.?)\s*$/i;

/**
 * Pasa un nombre a slug de URL: sin acentos, en minúsculas y con guiones.
 * La normalización NFD separa la tilde de la letra, y el rango ̀-ͯ
 * borra esos acentos sueltos — así "Ángel" queda "angel" y "Choque" no se
 * mezcla con "Choqué".
 */
export function slugificar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Lee lista.txt y devuelve { nombre, pases, slug } por invitado.
 *
 * Los renglones que no siguen el formato se ignoran en silencio: así la
 * lista tolera líneas en blanco o alguna nota suelta sin romper el build.
 */
export function leerInvitados() {
    const crudo = readFileSync(LISTA, "utf8");
    const invitados = [];

    // Cuántas veces salió cada slug. Hoy los 61 nombres son distintos, pero
    // si mañana se repite uno, el segundo se lleva un sufijo en vez de
    // pisar la invitación del primero.
    const usados = new Map();

    for (const renglon of crudo.split(/\r?\n/)) {
        const partes = RENGLON.exec(renglon);
        if (!partes) continue;

        const nombre = partes[1].trim();
        const pases = Number(partes[2]);

        const base =
            slugificar(nombre.replace(TRATAMIENTO, "").replace(ACOMPANANTE, "")) ||
            slugificar(nombre) ||
            `invitado-${invitados.length + 1}`;

        const repetido = usados.get(base) ?? 0;
        usados.set(base, repetido + 1);

        invitados.push({
            nombre,
            pases,
            slug: repetido === 0 ? base : `${base}-${repetido + 1}`,
        });
    }

    return invitados;
}
