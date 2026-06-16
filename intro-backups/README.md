# Intro backups

Snapshots de versiones del intro (loader) para poder restaurar.

## v1-particles-leftright  (commit d390e47)
Frase 1 (claro) -> fundido a oscuro -> frase 2 con typing por palabra (dorado->blanco)
y "automatizado" en degradado -> la palabra estalla en una nube densa de
particulas nitidas girando que llenan la pantalla -> se forman en VECTIS de
izquierda a derecha (degradado azul->dorado->blanco + glow).

Para restaurar: copiar el .ts.txt de vuelta a
src/app/features/intro/intro.component.ts (quitando el .txt), junto con
.html y .scss.
