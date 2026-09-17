// Anchos de referencia de los canvas del builder.
//
// El mobile es 375 px a propósito: las medidas de los módulos que vienen
// del deck de MeLi están calculadas para ese viewport. Con 375 encajan
// exacto (335 útiles tras el padding de 20 por lado, gap de 20):
//
//   Galería x2 / x3 (328 px) -> 328 <= 335              -> 1 por fila
//   Galería x4      (156 px) -> 156*2 + 20 = 332 <= 335 -> grid 2x2
//
// Si se cambia este valor, el arreglo de los módulos deja de coincidir
// con el spec de MeLi. Ya pasó: estuvo en 920 y luego en 800, y las
// galerías salían en grid cuando debían ir apiladas.
//
// OJO: .canvas-wrapper.mobile en index.css tiene que coincidir con
// MOBILE_CANVAS_WIDTH. CSS no puede importar de acá.
export const DESKTOP_CANVAS_WIDTH = 1920;
export const MOBILE_CANVAS_WIDTH = 375;

// El canvas mobile a tamaño real queda chico para trabajar en pantalla
// grande, así que el editor puede agrandarlo hasta este factor. Es solo
// zoom de visualización: el layout siempre se calcula sobre 375.
export const MOBILE_MAX_ZOOM = 2;
