// src/scripts/animaciones.ts
// Animaciones de entrada compartidas por toda la invitación.
//
// La idea: un solo gesto corto y suave por sección, con todo entrando a la
// vez. El invitado sigue bajando mientras mira, no espera a que termine nada,
// así que nada puede tardar más de un segundo ni depender de varias etapas
// encadenadas.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
   toggleActions = onEnter | onLeave | onEnterBack | onLeaveBack.
   "restart" al entrar bajando la reproduce desde cero cada vez (con "play",
   una vez completada, volver a entrar no hacía nada). "reset" al salir por
   arriba la deja escondida, lista para la próxima bajada. Al volver desde
   abajo se deja como está, para no interrumpir la lectura de quien sube.
*/
const ACCIONES = "restart none none reset";

// sine.out frena parejo hasta detenerse: es el más calmo de la familia,
// sin el tirón inicial de los power.
const SUAVE = "sine.out";

// Arranca apenas la sección asoma por abajo, así el gesto se completa
// mientras todavía está entrando en pantalla y no después.
const ARRANQUE = "top 92%";

const DURACION = 0.8;

const menosMovimiento = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Entrada genérica: los elementos aparecen subiendo apenas y saliendo de un
 * desenfoque leve. El escalonado por defecto es corto a propósito: alcanza
 * para que no entren como un bloque plano, sin obligar a esperar.
 *
 * `x` desplaza la entrada en horizontal (positivo = entra desde la derecha).
 * Sirve para listas en zigzag, donde cada lado tiene que venir del suyo.
 */
export function animarEntrada(
    elementos: ArrayLike<Element> | Element,
    trigger: Element,
    {
        start = ARRANQUE,
        stagger = 0.1,
        delay = 0,
        x = 0,
        y = 14,
        duration = DURACION,
    } = {},
) {
    const lista = elementos instanceof Element ? [elementos] : Array.from(elementos);
    if (lista.length === 0) return;

    const scrollTrigger = { trigger, start, toggleActions: ACCIONES };

    if (menosMovimiento()) {
        gsap.fromTo(
            lista,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, delay, ease: "power1.out", scrollTrigger },
        );
        return;
    }

    gsap.fromTo(
        lista,
        { opacity: 0, x, y, filter: "blur(4px)" },
        {
            opacity: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            duration,
            stagger,
            delay,
            ease: SUAVE,
            scrollTrigger,
        },
    );
}

/**
 * Entrada de las franjas vino: la banda se abre apenas a lo alto desde su
 * centro mientras el texto asoma, todo en el mismo instante.
 *
 * La franja tiene que estar armada así:
 *   <section class="franja relative overflow-hidden ...">   ← sin bg-vino
 *       <div class="franja-fondo absolute inset-0 bg-vino"></div>
 *       <... class="franja-texto relative ...">
 *   </section>
 */
export function animarFranja(seccion: HTMLElement) {
    const fondo = seccion.querySelector<HTMLElement>(".franja-fondo");
    if (!fondo) return;

    const lineas = lineasDe(seccion);
    const scrollTrigger = { trigger: seccion, start: ARRANQUE, toggleActions: ACCIONES };

    if (menosMovimiento()) {
        gsap.fromTo(
            [fondo, ...lineas],
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: "power1.out", scrollTrigger },
        );
        return;
    }

    gsap.set(fondo, { transformOrigin: "center center" });

    const entrada = gsap.timeline({
        scrollTrigger,
        defaults: { ease: SUAVE, duration: DURACION },
    });

    // Las dos en la posición 0: banda y texto arrancan juntos.
    entrada.fromTo(fondo, { opacity: 0, scaleY: 0.82 }, { opacity: 1, scaleY: 1 }, 0);
    entrada.fromTo(
        lineas,
        { opacity: 0, y: 8, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)" },
        0,
    );
}

/*
   Cada renglón entra por su cuenta. Cuando el .franja-texto ya viene partido
   en <span> (las frases largas lo están, para poder cortarlas a mano) se
   animan esos; si no, el elemento entero cuenta como un renglón.
*/
function lineasDe(seccion: HTMLElement): HTMLElement[] {
    const lineas: HTMLElement[] = [];

    seccion.querySelectorAll<HTMLElement>(".franja-texto").forEach((contenedor) => {
        const spans = contenedor.querySelectorAll<HTMLElement>(":scope > span");
        if (spans.length > 0) lineas.push(...spans);
        else lineas.push(contenedor);
    });

    return lineas;
}
