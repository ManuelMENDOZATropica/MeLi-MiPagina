#!/usr/bin/env bash
# Iguala main a dev. Pensado para correr desde Git Bash en la raiz del repo.
#
#   bash sync-main.sh
#
# Es seguro: antes de tocar nada verifica que ningun commit de main quede
# afuera de dev. Si detecta que se perderia trabajo, aborta y te lo dice.

set -euo pipefail

ORIGEN="dev"
DESTINO="main"

cd "$(dirname "$0")"

echo "==> Trayendo el estado del remoto"
git fetch origin --prune

# --- Verificacion 1: dev local al dia con el remoto -------------------------
if [ -n "$(git log --oneline "origin/$ORIGEN..$ORIGEN" 2>/dev/null)" ]; then
  echo
  echo "ABORTADO: tenes commits en $ORIGEN local que no estan en origin/$ORIGEN."
  git log --oneline "origin/$ORIGEN..$ORIGEN"
  echo
  echo "Corre primero:  git push origin $ORIGEN"
  exit 1
fi

# --- Verificacion 2: no perder trabajo de main ------------------------------
PERDIDOS=$(git log --oneline "origin/$ORIGEN..origin/$DESTINO" || true)
if [ -n "$PERDIDOS" ]; then
  echo
  echo "CUIDADO: origin/$DESTINO tiene commits que no estan en $ORIGEN:"
  echo "$PERDIDOS"
  echo
  echo "Igualar $DESTINO a $ORIGEN los dejaria fuera de la rama."
  read -r -p "Escribi 'si' para forzar igual: " OK
  [ "$OK" = "si" ] || { echo "Cancelado."; exit 1; }
  FORZAR="--force-with-lease"
else
  FORZAR=""
fi

# --- Que se va a publicar ---------------------------------------------------
NUEVOS=$(git log --oneline "origin/$DESTINO..$ORIGEN" || true)
if [ -z "$NUEVOS" ]; then
  echo
  echo "$DESTINO ya esta igual a $ORIGEN. No hay nada que hacer."
  exit 0
fi

echo
echo "==> Commits que van a pasar a $DESTINO:"
echo "$NUEVOS"
echo

# --- Push -------------------------------------------------------------------
echo "==> Publicando $ORIGEN en $DESTINO"
# shellcheck disable=SC2086
git push origin "$ORIGEN:$DESTINO" $FORZAR

# Deja la rama main local tambien al dia, sin cambiar de rama
git fetch origin
git update-ref "refs/heads/$DESTINO" "refs/remotes/origin/$DESTINO"

echo
echo "==> Listo. $DESTINO ahora esta igual a $ORIGEN:"
git log --oneline -1 "origin/$DESTINO"
