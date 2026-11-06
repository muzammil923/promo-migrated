#!/usr/bin/env bash
# Recreate the Flutter symlink mirror after a zip extraction.
# Run from anywhere: bash games/gamelinks.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/mobile/lib/games/gamelinks"
rm -rf "$BASE"
mkdir -p "$BASE/shared_pkg/lib"
cd "$BASE/shared_pkg/lib" && ln -sfn ../../../../../../games/shared_pkg/lib/engine.dart engine.dart
for g in snake nagaraja quiz math crossword memory wordsearch; do
  mkdir -p "$BASE/$g"
  ( cd "$BASE/$g"
    ln -sfn "../../../../../games/$g/logic.dart" logic.dart
    ln -sfn "../../../../../games/$g/playerpage.dart" playerpage.dart )
done
echo "gamelinks mirror recreated."
