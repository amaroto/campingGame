# Campamento Brisa

Prototipo jugable de gestión de un camping en 3D con Babylon.js. La escena combina cámara isométrica, modelos low-poly y una interfaz de gestión en español.

## Empezar

Necesitas Node.js 20 o posterior.

```bash
npm install
npm run dev
```

Vite mostrará la dirección local del juego. Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Organización del código

- `src/main.ts`: inicializa la partida y coordina el ciclo de juego y sus acciones.
- `src/game/config.ts`: tipos compartidos, valores de equilibrio, nombres y precios.
- `src/game/world.ts`: escena Babylon.js, iluminación, modelos y estado visual de las parcelas.
- `src/game/ui.ts`: presentación del HUD, actualización de las tarjetas y conexión de controles con acciones.
- `src/game/persistence.ts`: validación de la partida guardada y acceso a `localStorage`.
- `src/style.css` e `index.html`: estilos y estructura de la interfaz.

Para cambiar el aspecto de los modelos, empieza por `world.ts`; para ajustar economía y tiempos, usa `config.ts`; para modificar las tarjetas y controles, edita `ui.ts`.

## Menú y partidas

- Al abrir el juego aparece el menú principal, con opciones para empezar una partida nueva o cargar la última guardada.
- Las partidas se guardan automáticamente durante el juego. Pulsa el botón de pausa para abrir las opciones de «Guardar partida» y «Guardar y volver al menú».
- «Nueva partida» pide confirmación si ya existe una partida guardada, que se reemplazará cuando la nueva partida se guarde.

## Bucle de juego

- Empiezas con 180 € y dos parcelas disponibles.
- Los viajeros llegan a recepción y esperan a que los selecciones.
- Selecciona un viajero y después haz clic en una parcela libre y limpia para alojarlo directamente. También puedes usar «Alojar» en la tarjeta de la parcela.
- Si haces clic en una parcela ocupada o sucia, el viajero permanece seleccionado para que puedas elegir otra. «Cancelar selección» lo desmarca.
- Al terminar la estancia, el viajero paga y la parcela queda sucia. Pulsa «Limpiar parcela» antes de recibir al siguiente.
- El estado de la parcela se indica como limpia, ocupada o por limpiar. La tarjeta y la lista de estancias muestran una cuenta atrás hasta la salida de cada huésped.
- Selecciona parcelas haciendo clic en la escena o en los números de la tarjeta.
- Mejora parcelas limpias y desocupadas para aumentar los ingresos, o compra una de las cuatro parcelas nuevas.
- La partida guarda automáticamente el dinero, el día, las parcelas compradas, sus mejoras y las parcelas pendientes de limpieza en el navegador.
- Usa la rueda del ratón para acercar o alejar la cámara y el botón de pausa para detener el tiempo.
- El reloj muestra la hora del camping: un día completo dura 45 segundos de juego y la iluminación cambia gradualmente al amanecer, atardecer y noche. La hora también se conserva al guardar la partida.

La economía, el ritmo de llegada y la duración de las estancias son valores provisionales para iterar sobre la primera base.
