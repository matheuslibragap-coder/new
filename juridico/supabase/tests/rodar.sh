#!/usr/bin/env bash
# Aplica stub + migrations num Postgres local e roda o teste de RLS.
# Uso: PGHOST=/tmp PGPORT=5499 PGUSER=postgres ./supabase/tests/rodar.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
psql -q -c "drop database if exists teste_rls" -c "create database teste_rls" >/dev/null
psql -q -d teste_rls -v ON_ERROR_STOP=1 -f supabase/tests/stub_supabase.sql >/dev/null
for f in supabase/migrations/*.sql; do psql -q -d teste_rls -v ON_ERROR_STOP=1 -f "$f" >/dev/null; done
psql -q -d teste_rls -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
