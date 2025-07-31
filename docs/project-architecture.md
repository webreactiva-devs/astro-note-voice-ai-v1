# 🏗️ Arquitectura del Proyecto - AI Astro Voice

Este documento describe la arquitectura completa del proyecto AI Astro Voice, desarrollado durante el Reto Estrategas de la IA de Web Reactiva.

## 📋 Tabla de Contenidos

1. [Diagrama de Arquitectura del Sistema](#diagrama-de-arquitectura-del-sistema)
2. [Flujo de Datos Principal](#flujo-de-datos-principal)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [Mapeo de Endpoints y APIs](#mapeo-de-endpoints-y-apis)
5. [Estructura de Carpetas](#estructura-de-carpetas)
6. [Patrones Arquitectónicos](#patrones-arquitectónicos)
7. [Diagramas de Flujo de Usuario](#diagramas-de-flujo-de-usuario)

## 🏛️ Diagrama de Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Cliente (Browser)"
        UI[React Components]
        Audio[MediaRecorder API]
        State[React State]
    end

    subgraph "Servidor Astro"
        subgraph "Frontend Layer"
            Pages[Astro Pages]
            Components[Astro/React Components]
        end
        
        subgraph "API Layer"
            AuthAPI[api-auth]
            TranscribeAPI[api-transcribe]
            NotesAPI[api-notes]
            Middleware[Auth Middleware]
        end
        
        subgraph "Services Layer"
            AuthService[Better Auth]
            RateLimit[Rate Limiting]
            Validation[Data Validation]
        end
    end

    subgraph "Servicios Externos"
        GroqAPI[Groq API]
        subgraph "Base de Datos"
            SQLite[(SQLite Local)]
            Turso[(Turso Cloud)]
        end
    end

    UI --> Pages
    Audio --> TranscribeAPI
    State --> NotesAPI
    
    Pages --> Components
    Components --> UI
    
    TranscribeAPI --> GroqAPI
    NotesAPI --> GroqAPI
    
    AuthAPI --> AuthService
    TranscribeAPI --> RateLimit
    NotesAPI --> RateLimit
    
    Middleware --> AuthService
    
    AuthService --> SQLite
    AuthService --> Turso
    NotesAPI --> SQLite
    NotesAPI --> Turso
    
    RateLimit -.-> Validation
    Validation -.-> AuthService

    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef external fill:#fff3e0
    classDef database fill:#fce4ec
    
    class UI,Audio,State,Pages,Components frontend
    class AuthAPI,TranscribeAPI,NotesAPI,Middleware api
    class AuthService,RateLimit,Validation service
    class GroqAPI external
    class SQLite,Turso database
```

## 🔄 Flujo de Datos Principal

### 1. Flujo de Grabación y Transcripción

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as Cliente (React)
    participant A as API Astro
    participant G as Groq API
    participant DB as Base de Datos

    U->>C: Inicia grabación
    C->>C: MediaRecorder.start()
    C->>U: Visualización de ondas
    
    U->>C: Detiene grabación
    C->>C: Genera blob de audio
    C->>U: Opciones: reproducir/descargar/transcribir
    
    U->>C: Solicita transcripción
    C->>A: POST /api/transcribe (FormData)
    A->>A: Validar auth + rate limit
    A->>G: Enviar audio para transcripción
    G->>A: Retornar texto transcrito
    A->>C: Respuesta con transcripción
    
    C->>U: Modal con texto editable
    U->>C: Edita y confirma texto
    
    C->>A: POST /api/notes (texto final)
    A->>A: Validar auth + rate limit
    A->>G: Generar título y tags
    G->>A: Título y tags generados
    A->>DB: Guardar nota completa
    DB->>A: Confirmación
    A->>C: Nota creada exitosamente
    C->>U: Redirección a dashboard
```

### 2. Flujo de Gestión de Notas

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as Cliente (React)
    participant A as API Astro
    participant DB as Base de Datos

    U->>C: Accede al dashboard
    C->>A: GET /api/notes
    A->>A: Validar autenticación
    A->>DB: Consultar notas del usuario
    DB->>A: Lista de notas
    A->>C: Notas formateadas
    C->>U: Dashboard con notas

    U->>C: Aplica filtros/búsqueda
    C->>A: GET /api/notes?q=term&tag=category
    A->>DB: Consulta filtrada
    DB->>A: Resultados filtrados
    A->>C: Notas filtradas
    C->>U: Resultados actualizados

    U->>C: Selecciona nota para editar
    C->>U: Modal de edición
    U->>C: Modifica contenido
    C->>A: PUT /api/notes/:id
    A->>A: Validar ownership
    A->>DB: Actualizar nota
    DB->>A: Confirmación
    A->>C: Nota actualizada
    C->>U: Dashboard actualizado
```

## 🗃️ Esquema de Base de Datos

```mermaid
erDiagram
    user {
        string id PK
        string name
        string email UK
        datetime emailVerified
        string image
        datetime createdAt
        datetime updatedAt
    }

    session {
        string id PK
        string userId FK
        datetime expiresAt
        string token UK
        datetime createdAt
        datetime updatedAt
    }

    notes {
        string id PK
        string userId FK
        string title
        text content
        text organizedContent
        string tags
        datetime createdAt
        datetime updatedAt
    }

    migrations_log {
        string filename PK
        string checksum
        datetime executedAt
    }

    user ||--o{ session : "has"
    user ||--o{ notes : "owns"
```

### Descripción de Tablas

#### `user` (Gestionada por Better Auth)
- **id**: Identificador único del usuario
- **email**: Email único para autenticación
- **name**: Nombre del usuario
- **emailVerified**: Timestamp de verificación de email
- **image**: URL del avatar (opcional)

#### `notes` (Tabla principal del proyecto)
- **id**: UUID único de la nota
- **userId**: Referencia al propietario
- **title**: Título generado por IA
- **content**: Transcripción original/editada
- **organizedContent**: Contenido procesado por IA
- **tags**: JSON string con etiquetas

#### `migrations_log` (Sistema de migraciones)
- **filename**: Nombre del archivo de migración
- **checksum**: Hash del contenido para detectar cambios
- **executedAt**: Timestamp de ejecución

## 🛣️ Mapeo de Endpoints y APIs

### Endpoints de Autenticación (Better Auth)
```
POST /api/auth/sign-in          # Inicio de sesión
POST /api/auth/sign-up          # Registro de usuario  
POST /api/auth/sign-out         # Cerrar sesión
GET  /api/auth/session          # Obtener sesión actual
```

### Endpoints de la Aplicación
```
# Transcripción
POST /api/transcribe
├── Headers: Authorization, Content-Type: multipart/form-data
├── Body: FormData con archivo de audio
├── Rate Limit: 5 req/min
├── Response: { transcription: string }
└── Errors: 401, 429, 500

# Gestión de Notas
GET /api/notes
├── Headers: Authorization
├── Query Params: ?q=search&tag=filter&offset=0&limit=10
├── Rate Limit: 30 req/min
├── Response: { notes: Note[], total: number }
└── Errors: 401, 429, 500

POST /api/notes
├── Headers: Authorization, Content-Type: application/json
├── Body: { text: string }
├── Rate Limit: 30 req/min
├── Response: { note: Note }
└── Errors: 401, 422, 429, 500

PUT /api/notes/[id]
├── Headers: Authorization, Content-Type: application/json
├── Body: { title?: string, content?: string, tags?: string }
├── Rate Limit: 30 req/min
├── Response: { note: Note }
└── Errors: 401, 403, 404, 422, 429, 500

DELETE /api/notes/[id]
├── Headers: Authorization
├── Rate Limit: 30 req/min
├── Response: { success: boolean }
└── Errors: 401, 403, 404, 429, 500

# Utilidades
GET /api/db-check               # Health check de base de datos
```

### Integración con APIs Externas

#### Groq API
```
# Transcripción de Audio
POST https://api.groq.com/openai/v1/audio/transcriptions
├── Headers: Authorization: Bearer $GROQ_API_KEY
├── Body: FormData { file, model: "whisper-large-v3" }
└── Response: { text: string }

# Generación de Títulos y Tags
POST https://api.groq.com/openai/v1/chat/completions
├── Headers: Authorization: Bearer $GROQ_API_KEY
├── Body: { model: "llama-3.3-70b-versatile", messages: [...] }
└── Response: { choices: [{ message: { content: string } }] }
```

## 📁 Estructura de Carpetas

```
ai-astro-voice-manual/
├── 📁 src/
│   ├── 📁 components/           # Componentes React y Astro
│   │   ├── 📁 ui/              # Componentes base (Shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── AudioRecorder.tsx    # Grabación de audio
│   │   ├── TranscriptionModal.tsx # Modal de transcripción
│   │   ├── NoteCard.tsx        # Tarjeta de nota
│   │   ├── NoteViewModal.tsx   # Vista completa de nota
│   │   ├── NotesManager.tsx    # Gestión de notas
│   │   └── Header.astro        # Cabecera común
│   │
│   ├── 📁 lib/                 # Utilidades y configuración
│   │   ├── auth.ts            # Configuración Better Auth
│   │   ├── database.ts        # Cliente dual SQLite/Turso
│   │   ├── config.ts          # Variables de entorno
│   │   ├── rate-limit.ts      # Sistema de rate limiting
│   │   ├── validation.ts      # Esquemas de validación
│   │   └── utils.ts           # Utilidades generales
│   │
│   ├── 📁 pages/              # Rutas y páginas
│   │   ├── 📁 api/            # API Routes
│   │   │   ├── 📁 auth/       # Endpoints de Better Auth
│   │   │   ├── transcribe.ts  # Transcripción de audio
│   │   │   ├── notes/
│   │   │   │   ├── index.ts   # GET/POST /api/notes
│   │   │   │   └── [id].ts    # PUT/DELETE /api/notes/[id]
│   │   │   └── db-check.ts    # Health check
│   │   ├── index.astro        # Página principal
│   │   ├── dashboard.astro    # Dashboard (redirige a /notes)
│   │   ├── notes.astro        # Gestión de notas
│   │   ├── record.astro       # Grabación de audio
│   │   ├── profile.astro      # Perfil de usuario
│   │   ├── login.astro        # Inicio de sesión
│   │   └── register.astro     # Registro
│   │
│   └── 📁 styles/             # Estilos globales
│       └── globals.css
│
├── 📁 database/               # Base de datos
│   ├── 📁 migrations/         # Migraciones SQL
│   │   ├── 001_create_notes_table.sql
│   │   └── 002_add_organized_content.sql
│   └── dev.db                 # SQLite local (git ignored)
│
├── 📁 scripts/                # Scripts de utilidad
│   ├── migrate.js            # Sistema de migraciones
│   ├── clean-migration.js    # Limpieza de migraciones
│   └── check-bundle-size.js  # Verificación de bundle
│
├── 📁 docs/                   # Documentación
│   ├── project-specs.md      # Especificaciones técnicas
│   ├── project-plan.md       # Plan de desarrollo
│   ├── project-architecture.md # Este documento
│   ├── deployment.md         # Guía de despliegue
│   └── betterauth.md         # Configuración de auth
│
├── 📁 public/                 # Assets estáticos
├── 📁 tests/                  # Tests automatizados
│   ├── 📁 api/               # Tests de endpoints
│   ├── 📁 components/        # Tests de componentes
│   └── setup.ts              # Configuración de tests
│
├── astro.config.mjs          # Configuración Astro
├── tailwind.config.mjs       # Configuración Tailwind
├── tsconfig.json             # Configuración TypeScript
├── vitest.config.ts          # Configuración de tests
├── package.json              # Dependencias y scripts
├── .env.example              # Variables de entorno ejemplo
├── README.md                 # Documentación principal
└── README.es.md              # Documentación en español
```

## 🎯 Patrones Arquitectónicos Aplicados

### 1. **Arquitectura de Capas (Layered Architecture)**
```
┌─────────────────────┐
│   Presentation     │ ← React Components, Astro Pages
├─────────────────────┤
│   API Layer        │ ← API Routes, Middleware
├─────────────────────┤
│   Business Logic   │ ← Services, Validation
├─────────────────────┤
│   Data Access      │ ← Database, External APIs
└─────────────────────┘
```

### 2. **Patrón Repository (Implícito)**
- Abstracción de acceso a datos en `src/lib/database.ts`
- Soporte dual SQLite/Turso sin cambios en la lógica de negocio
- Funciones específicas para cada entidad (usuarios, notas)

### 3. **Middleware Pattern**
- Middleware de autenticación centralizado
- Rate limiting aplicado transversalmente
- Validación de datos en capa intermedia

### 4. **Factory Pattern**
- Configuración de clientes de base de datos
- Instanciación de servicios según entorno
- Creación de mocks para testing

### 5. **Strategy Pattern**
- Diferentes estrategias de almacenamiento (local vs cloud)
- Múltiples formatos de exportación (futuro)
- Variaciones en procesamiento de IA

### 6. **Observer Pattern (React)**
- Estados reactivos en componentes
- Actualizaciones automáticas del dashboard
- Notificaciones de cambios de estado

## 👤 Diagramas de Flujo de Usuario

### 1. Flujo de Autenticación

```mermaid
flowchart TD
    Start([Usuario accede a la app]) --> CheckAuth{¿Autenticado?}
    
    CheckAuth -->|Sí| Dashboard[Dashboard de Notas]
    CheckAuth -->|No| Landing[Página Principal]
    
    Landing --> LoginChoice{¿Tiene cuenta?}
    LoginChoice -->|Sí| Login[Formulario Login]
    LoginChoice -->|No| Register[Formulario Registro]
    
    Login --> LoginSubmit[Enviar credenciales]
    Register --> RegisterSubmit[Crear cuenta]
    
    LoginSubmit --> LoginValid{¿Válido?}
    RegisterSubmit --> RegisterValid{¿Válido?}
    
    LoginValid -->|Sí| Dashboard
    LoginValid -->|No| LoginError[Mostrar error]
    RegisterValid -->|Sí| Dashboard
    RegisterValid -->|No| RegisterError[Mostrar error]
    
    LoginError --> Login
    RegisterError --> Register
    
    Dashboard --> RecordChoice{¿Primera vez?}
    RecordChoice -->|Sí| FirstRecord[Grabar primera nota]
    RecordChoice -->|No| NotesList[Ver lista de notas]
    
    FirstRecord --> RecordFlow[Flujo de Grabación]
    NotesList --> RecordFlow
```

### 2. Flujo de Grabación y Transcripción

```mermaid
flowchart TD
    Start([Iniciar Grabación]) --> CheckPerms{¿Permisos de micrófono?}
    
    CheckPerms -->|No| RequestPerms[Solicitar permisos]
    CheckPerms -->|Sí| StartRecord[Iniciar grabación]
    
    RequestPerms --> PermsGranted{¿Concedidos?}
    PermsGranted -->|No| PermsError[Error: Sin permisos]
    PermsGranted -->|Sí| StartRecord
    
    StartRecord --> Recording[Grabando...]
    Recording --> ShowWave[Mostrar ondas de audio]
    Recording --> ShowTimer[Mostrar contador]
    
    ShowTimer --> TimeUp{¿Tiempo agotado?}
    TimeUp -->|Sí| AutoStop[Parar automáticamente]
    TimeUp -->|No| UserAction{Acción del usuario}
    
    UserAction -->|Pausa| PauseRecord[Pausar]
    UserAction -->|Parar| StopRecord[Parar]
    UserAction -->|Continuar| Recording
    
    PauseRecord --> UserAction
    AutoStop --> StopRecord
    
    StopRecord --> AudioReady[Audio listo]
    AudioReady --> ShowOptions[Mostrar opciones]
    
    ShowOptions --> UserChoice{¿Qué hacer?}
    UserChoice -->|Reproducir| PlayAudio[Reproducir audio]
    UserChoice -->|Descargar| DownloadAudio[Descargar archivo]
    UserChoice -->|Transcribir| SendTranscribe[Enviar a transcribir]
    UserChoice -->|Regrabar| Start
    
    PlayAudio --> ShowOptions
    DownloadAudio --> ShowOptions
    
    SendTranscribe --> ShowLoading[Mostrar cargando]
    ShowLoading --> TranscribeAPI[Llamar API transcripción]
    
    TranscribeAPI --> TranscribeResult{¿Éxito?}
    TranscribeResult -->|No| TranscribeError[Error de transcripción]
    TranscribeResult -->|Sí| ShowModal[Modal con transcripción]
    
    TranscribeError --> ShowOptions
    ShowModal --> EditText[Usuario edita texto]
    EditText --> SaveNote[Guardar nota]
    
    SaveNote --> GenerateMetadata[IA genera título/tags]
    GenerateMetadata --> SaveToDB[Guardar en BD]
    SaveToDB --> Success[Nota guardada]
    Success --> Dashboard[Volver al dashboard]
```

### 3. Flujo de Gestión de Notas

```mermaid
flowchart TD
    Start([Dashboard de Notas]) --> LoadNotes[Cargar notas del usuario]
    LoadNotes --> ShowNotes[Mostrar lista de notas]
    
    ShowNotes --> UserAction{Acción del usuario}
    
    UserAction -->|Buscar| SearchNotes[Aplicar búsqueda]
    UserAction -->|Filtrar| FilterNotes[Aplicar filtros]
    UserAction -->|Ver nota| ViewNote[Modal de visualización]
    UserAction -->|Editar| EditNote[Modal de edición]
    UserAction -->|Eliminar| ConfirmDelete[Confirmar eliminación]
    UserAction -->|Nueva nota| NewRecord[Ir a grabación]
    
    SearchNotes --> UpdateList[Actualizar lista]
    FilterNotes --> UpdateList
    UpdateList --> ShowNotes
    
    ViewNote --> ViewOptions{¿Qué hacer?}
    ViewOptions -->|Cerrar| ShowNotes
    ViewOptions -->|Editar| EditNote
    ViewOptions -->|Eliminar| ConfirmDelete
    
    EditNote --> SaveChanges[Guardar cambios]
    SaveChanges --> SaveResult{¿Éxito?}
    SaveResult -->|Sí| ShowNotes
    SaveResult -->|No| ShowError[Mostrar error]
    ShowError --> EditNote
    
    ConfirmDelete --> DeleteConfirm{¿Confirmar?}
    DeleteConfirm -->|No| ShowNotes
    DeleteConfirm -->|Sí| DeleteNote[Eliminar de BD]
    DeleteNote --> ShowNotes
    
    NewRecord --> RecordFlow[Flujo de grabación]
    RecordFlow --> ShowNotes
```

### 4. Flujo de Estados de Error y Recuperación

```mermaid
flowchart TD
    Start([Error detectado]) --> ErrorType{Tipo de error}
    
    ErrorType -->|401 Auth| AuthError[Error de autenticación]
    ErrorType -->|429 Rate| RateError[Rate limit excedido]
    ErrorType -->|500 Server| ServerError[Error del servidor]
    ErrorType -->|Network| NetworkError[Error de red]
    
    AuthError --> Logout[Cerrar sesión]
    Logout --> LoginPage[Redirigir a login]
    
    RateError --> ShowRateMsg[Mostrar mensaje rate limit]
    ShowRateMsg --> WaitRetry[Esperar y reintentar]
    WaitRetry --> RetryAction[Reintentar acción]
    
    ServerError --> ShowServerMsg[Mostrar error servidor]
    NetworkError --> ShowNetworkMsg[Mostrar error conexión]
    
    ShowServerMsg --> RetryOption{¿Reintentar?}
    ShowNetworkMsg --> RetryOption
    
    RetryOption -->|Sí| RetryAction
    RetryOption -->|No| StayOnPage[Permanecer en página]
    
    RetryAction --> Success{¿Éxito?}
    Success -->|Sí| ContinueFlow[Continuar flujo normal]
    Success -->|No| Start
    
    StayOnPage --> UserContinue[Usuario continúa]
    ContinueFlow --> UserContinue
```

---

## 📚 Referencias y Documentación Relacionada

- **[Especificaciones Técnicas](project-specs.md)**: Requisitos detallados del proyecto
- **[Plan de Desarrollo](project-plan.md)**: Progreso y tareas completadas
- **[Guía de Despliegue](deployment.md)**: Configuración para producción
- **[Configuración de BetterAuth](betterauth.md)**: Setup de autenticación

---

*Documentación generada para el Reto Estrategas de la IA de Web Reactiva*
