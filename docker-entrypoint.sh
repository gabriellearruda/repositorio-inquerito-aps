#!/bin/sh
set -e
# Injeta a senha no HTML em runtime (lê do env)
node build.cjs

# Sobe site estático + API na porta 3000
exec node server.mjs
