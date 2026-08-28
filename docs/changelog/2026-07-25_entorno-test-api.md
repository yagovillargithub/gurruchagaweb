# 2026-07-25 — Entorno TEST de la API (tarea #268)

## Qué
Se añade un entorno de **test** para la API de contacto (`api/`), sirviéndola bajo
el vhost YA existente de `gurru-test.unlimited-systems.net` en la ruta `/api`
(https://gurru-test.unlimited-systems.net/api), sin DNS nuevo.

- 2ª instancia de la MISMA API (código idéntico, no se toca `server.js`) en
  `127.0.0.1:3101`, con unit `demogurru-api-test.service` y `.env` propio.
- El vhost de gurru-test, que antes proxeaba `/api/` → `:3100` (PROD), ahora
  apunta a `:3101` (test).

## Por qué
La web hermana ya tenía staging (gurru-test) pero su formulario de contacto pegaba
contra la API de PRODUCCIÓN. Ahora staging tiene su propio backend aislado: los
envíos de prueba no llegan a la clienta ni comparten origen con prod.

## Aislamiento test ↔ prod
- **Puerto** 3101 (prod 3100), unit e instancia independientes.
- **`.env` de test** (`/opt/demogurru-api-test/.env`): `ALLOWED_ORIGINS` sólo el
  origen de staging, `MAIL_TO=info@unlimited-systems.net` (interno, NO
  `gurru999@gmail.com`), `MAIL_FROM` marcado `[TEST]`, `STATIC_ROOT` al estático de
  gurru-test.
- **Credencial SMTP sin copias**: la unit de test carga primero el `.env` de PROD
  (fuente única de `SMTP_PASS`) y luego el `.env` de test, que sólo pisa lo demás.
  El `.env` de test NO declara `SMTP_PASS`.

## Ficheros
- `api/.env.test.example` — plantilla del `.env` de test.
- `deploy/demogurru-api-test.service` — unit systemd de la instancia test.
- `deploy/TEST-INSTANCE.md` — guía root (instalar + repuntar proxy + verificar +
  rollback).

## Verificación en vivo (2026-07-25)
- `curl http://127.0.0.1:3101/api/health` → `{ok:true}`.
- `https://gurru-test.unlimited-systems.net/api/health` → `{ok:true}` y devuelve
  **403** a `Origin: https://gurruchagaweb.com` (prueba de que sirve la instancia
  test con su CORS, no la de prod).
- PROD intacta: `http://127.0.0.1:3100/api/health` y `https://gurruchagaweb.com/api/health`
  → `{ok:true}`; prod devuelve 403 al origen de staging.
- Evidencias en `shared/entregas/268-entorno-test-gurruchagaweb-api/`.

## Zonas grises / pendientes
- El paso root (crear `/opt/demogurru-api-test`, unit, editar vhost) lo ejecuta
  Yago: la jaula del agente no puede escribir `/etc` ni units systemd.
- Registro en `project_domain` (env=test): el gate bloquea SQL sobre `jarvis.db`;
  el SQL queda listo en `shared/entregas/.../project_domain-test.sql` para que lo
  corra Yago/root.
