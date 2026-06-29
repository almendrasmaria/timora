# Timora

Plataforma SaaS de gestión de turnos para negocios que trabajan con reservas: estéticas, médicos, peluquerías, veterinarias, abogados, gimnasios y más.

Centraliza la agenda, ofrece una página pública de reservas personalizada y recordatorios automáticos por WhatsApp. Cada negocio cuenta con un dashboard para administrar clientes, servicios, profesionales y horarios.

> Proyecto en desarrollo activo. La estructura base está lista; las funcionalidades de negocio se implementan progresivamente.

## Características (roadmap)

- [x] Monorepo con frontend y backend
- [x] PostgreSQL con Docker
- [x] Estructura de rutas (dashboard, auth, reservas públicas)
- [ ] Autenticación JWT (registro / login)
- [ ] CRUD de servicios, profesionales y clientes
- [ ] Agenda y turnos
- [ ] Página pública de reservas (`/{slug}`)
- [ ] Recordatorios por WhatsApp

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 19, SCSS, standalone components |
| Backend | Java 21, Spring Boot 3 |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (planificado) |
| Migraciones | Flyway |

## Estructura del repositorio

```
timora/
├── backend/          # API REST (Spring Boot + Maven)
├── frontend/         # App Angular (dashboard + reservas públicas)
├── docker-compose.yml
└── .env.example
```

## Requisitos

- [Node.js](https://nodejs.org/) 22+
- [Java 21](https://adoptium.net/) (LTS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Desarrollo local

Necesitás **3 terminales** (una por servicio).

### 1. Base de datos

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Postgres queda en el puerto **5433** (no 5432) para evitar conflictos con un PostgreSQL local de Windows.

| Variable | Valor por defecto |
|----------|-------------------|
| Base de datos | `timora` |
| Usuario | `timora` |
| Contraseña | `timora_dev` |
| Puerto | `5433` |

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run      # Linux / macOS
.\mvnw.cmd spring-boot:run  # Windows
```

- API: http://localhost:8080
- Health check: http://localhost:8080/api/health

### 3. Frontend

```bash
cd frontend
npm install   # solo la primera vez
npm start
```

- App: http://localhost:4200

### Rutas del frontend

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel del negocio |
| `/auth/login` | Inicio de sesión |
| `/auth/register` | Registro |
| `/{slug}` | Página pública de reservas (ej. `/peluqueria-maria`) |

## Variables de entorno

Copiá `.env.example` a `.env` si necesitás personalizar credenciales. Los valores por defecto funcionan con el `docker-compose.yml` incluido.

## Problemas frecuentes

**El backend no conecta a Postgres**  
Verificá que Docker esté corriendo (`docker compose ps`). Si tenés otro PostgreSQL en el puerto 5432, Timora usa el **5433** a propósito.

**`Port 8080 was already in use`**  
Ya hay una instancia del backend corriendo. Usá esa o detenela con `Ctrl+C` antes de volver a arrancar.

**`npm install` falla en `backend/`**  
`npm` es solo para el frontend. El backend usa Maven (`mvnw`).

**`java -version` muestra otra versión**  
Reiniciá la terminal o Cursor después de instalar Java 21.

## Scripts útiles

```bash
# Tests del backend
cd backend && ./mvnw test

# Build del frontend
cd frontend && npm run build
```

## Licencia

Copyright © 2026 María Almendras. Todos los derechos reservados.

Este proyecto es privado. No está permitido copiar, modificar ni distribuir
este código sin autorización expresa del autor.
