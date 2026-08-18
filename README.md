# Kanban Portfolio MVP

Un tablero Kanban pequeño, construido para demostrar React, una API REST con Express y persistencia SQLite.

## Qué incluye

- Tablero inicial con columnas Por hacer, En progreso y Listo.
- Crear, editar y eliminar tarjetas.
- Etiquetas y fecha límite.
- Arrastrar tarjetas entre columnas y reordenarlas.
- Orden por posiciones espaciadas: al mover una tarjeta solo se actualiza esa tarjeta; la columna se normaliza solo si se queda sin espacio.

## Ejecutar localmente

Requiere Node.js 22.5 o superior.

```bash
cd server && npm install && npm run dev
```

En otra terminal:

```bash
cd client && npm install && npm run dev
```

Abre `http://localhost:5173`. La base SQLite se crea automáticamente en `server/data/kanban.db`.

Opcionalmente, copia `.env.example` como `server/.env` para cambiar el puerto o la ruta de la base de datos. Para el cliente, crea `client/.env` con `VITE_API_URL=http://localhost:3001/api`.

Imagenes de la App

<img width="1616" height="1063" alt="Captura de pantalla 2026-08-18 a la(s) 5 15 27 p m" src="https://github.com/user-attachments/assets/358be2a7-3de9-42f0-a054-03f7fb2e8de2" />
