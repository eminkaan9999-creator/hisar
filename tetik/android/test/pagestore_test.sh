#!/usr/bin/env bash
# Uygulama içi sayfa güncellemesi (PageStore.java) masaüstü testi: JDK yeter, Android SDK gerekmez.
set -euo pipefail
T="$(cd "$(dirname "$0")" && pwd)"; A="$T/../app/src/main/java/com/hisar/tetik"; OUT="$(mktemp -d)"
javac -encoding UTF-8 --release 8 -Xlint:-options -d "$OUT" $(find "$T/stub" -name '*.java') "$A/PageStore.java" "$T/com/hisar/tetik/PageStoreTest.java"
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -cp "$OUT" com.hisar.tetik.PageStoreTest
