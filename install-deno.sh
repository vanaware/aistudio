#!/usr/bin/env bash
set -e

echo "📦 Checking and installing zip/unzip prerequisites..."
if ! command -v zip >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
  echo "Installing zip and unzip via apt-get..."
  apt-get update -y && apt-get install -y zip unzip
fi

echo "🦕 Checking Deno installation..."
if ! command -v deno >/dev/null 2>&1; then
  echo "Installing Deno unattended (-y)..."
  curl -fsSL https://deno.land/install.sh | sh -s -- -y
  ln -sf /root/.deno/bin/deno /usr/local/bin/deno
  ln -sf /root/.deno/bin/deno /usr/bin/deno
fi

echo "✅ Deno ready: $(deno --version | head -n 1)"
