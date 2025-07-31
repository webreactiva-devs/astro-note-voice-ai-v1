# 🎙️ Astro Note Voice AI - Proyecto del Reto Estrategas de la IA

> **Aplicación desarrollada durante el [Reto Estrategas de la IA](https://webreactiva.com) de Web Reactiva**

Este repositorio contiene el proyecto completo desarrollado paso a paso en el Reto Estrategas de la IA, donde construimos una aplicación de notas de voz con transcripción automática usando inteligencia artificial.

## 🎯 Contexto del Proyecto

Esta aplicación fue creada como **proyecto formativo** para aprender y practicar la integración de IA en aplicaciones web modernas. No es un producto comercial, sino una demostración práctica de cómo implementar funcionalidades de IA en un stack tecnológico actual.

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico Principal
- **Framework**: Astro 5 con integración React 19
- **Lenguaje**: TypeScript (configuración estricta)
- **Estilos**: Tailwind CSS 4 (vía plugin de Vite)
- **Base de datos**: libSQL (SQLite local + Turso para producción)
- **Autenticación**: Better Auth
- **IA**: API de Groq para transcripción y procesamiento de texto
- **UI**: Radix UI + Shadcn/ui
- **Testing**: Vitest + React Testing Library

### Estructura de la Aplicación
```
src/
├── components/           # Componentes React y Astro
│   ├── ui/              # Componentes base (Shadcn/ui)
│   └── ...              # Componentes específicos de la app
├── lib/                 # Utilidades y configuración
│   ├── database.ts      # Cliente de base de datos dual
│   ├── config.ts        # Configuración centralizada
│   └── auth.ts          # Configuración de Better Auth
├── pages/               # Rutas y API endpoints
│   ├── api/             # Endpoints de la API
│   └── ...              # Páginas de la aplicación
└── styles/              # Estilos globales
```

## 📋 Evolution del Desarrollo

### Fase 1: Fundamentos (Completado ✅)
- **Configuración inicial**: Astro + TypeScript + Tailwind
- **Base de datos**: Sistema dual local/cloud con migraciones incrementales
- **Autenticación**: Better Auth con formularios de registro/login
- **Dashboard básico**: Estructura inicial para usuarios autenticados

### Fase 2: Grabación de Audio (Completado ✅)
- **Interfaz de grabación**: Botones de control intuitivos
- **Visualización en tiempo real**: Ondas de audio durante la grabación
- **Límites inteligentes**: Máximo 2 minutos con contador regresivo
- **Controles de reproducción**: Preview del audio grabado antes de transcribir

### Fase 3: Transcripción con IA (Completado ✅)
- **Endpoint `/api/transcribe`**: Procesamiento de audio con Groq
- **Modal de edición**: Interfaz para revisar y corregir transcripciones
- **Estados de carga**: Feedback visual durante el procesamiento
- **Manejo de errores**: Gestión robusta de fallos en la API

### Fase 4: Gestión de Notas (Completado ✅)
- **Endpoint `/api/notes`**: CRUD completo de notas
- **Generación automática**: Títulos y tags con IA
- **Campo `organizedContent`**: Contenido procesado por IA para mejor organización
- **Búsqueda y filtros**: Por título, contenido, tags y fecha

### Fase 5: Dashboard Avanzado (Completado ✅)
- **Lista organizada**: Notas ordenadas cronológicamente
- **Modal de visualización**: Vista completa con soporte Markdown
- **Acciones CRUD**: Editar, eliminar con validación de permisos
- **Navegación fluida**: Redirecciones inteligentes para nuevos usuarios

### Fase 6: Seguridad y Validación (Completado ✅)
- **Middleware de autenticación**: Protección centralizada de rutas
- **Rate limiting**: Control de llamadas API (5/min transcripción, 30/min notas)
- **Validación de datos**: Sanitización contra XSS, validación de MIME types
- **Gestión de permisos**: Solo el propietario puede modificar sus notas

### Fase 7: Testing y Calidad (Completado ✅)
- **Configuración Vitest**: Testing unitario e integración
- **Mocks avanzados**: MediaRecorder, AudioContext, APIs externas
- **Cobertura completa**: Endpoints, flujos críticos, manejo de errores
- **Testing de seguridad**: Rate limiting, autenticación, validaciones

### Fase 8: Optimización y Despliegue (Completado ✅)
- **Bundle optimization**: Reducción a 406KB con lazy loading
- **Code splitting**: Separación estratégica de chunks
- **Variables de entorno**: Sistema robusto con validación Zod
- **Herramientas de análisis**: Scripts para monitoreo de performance

## 🚀 Características Técnicas Implementadas

### Sistema de Base de Datos
- **Dual mode**: SQLite local (desarrollo) + Turso (producción)
- **Migraciones incrementales**: Sistema automático con tracking
- **Herramientas de gestión**: Scripts para estado y limpieza de migraciones

### Integración con IA
- **Transcripción**: Whisper via Groq API
- **Procesamiento de texto**: Generación de títulos y tags
- **Rate limiting**: Protección contra sobrecarga de API
- **Fallbacks**: Manejo robusto de errores de IA

### Performance
- **Bundle size**: 406KB total (límite 500KB)
- **Lazy loading**: Componentes modales y notificaciones
- **Code splitting**: 26 chunks bien distribuidos
- **Caching**: Estrategias de cache para assets

### Seguridad
- **Autenticación**: Better Auth con sesiones seguras
- **Rate limiting**: En memoria con limpieza automática
- **Validación**: Zod schemas para todos los inputs
- **Sanitización**: Protección XSS en contenido de usuario

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run preview         # Preview del build

# Base de datos
npm run migrate         # Ejecutar migraciones
npm run migrate:status  # Estado de migraciones

# Testing
npm test               # Tests unitarios
npm run test:ui        # Tests con interfaz
npm run test:coverage  # Tests con cobertura

# Análisis
npm run build:analyze  # Análisis de bundle
npm run size-check     # Verificar tamaños
```

## 🤖 Prompts de IA

La aplicación utiliza prompts estructurados para el procesamiento de IA ubicados en `src/lib/prompts/`:
- **[Generación de Títulos](src/lib/prompts/title-generation.md)** - Genera títulos concisos para las notas de voz
- **[Generación de Etiquetas](src/lib/prompts/tags-generation.md)** - Crea etiquetas relevantes para categorización
- **[Organización de Ideas](src/lib/prompts/idea-organization.md)** - Organiza el contenido para mejor legibilidad

## 📚 Documentación del Proyecto

Documentación completa disponible en la carpeta **[docs/](docs/)** que incluye arquitectura, especificaciones, plan de desarrollo y guías de despliegue.

## 🎓 Aprendizajes Clave del Reto

### Integración de IA
- Uso práctico de APIs de transcripción (Groq/Whisper)
- Procesamiento de texto con modelos de lenguaje
- Manejo de límites y costos en APIs de IA
- Estrategias de fallback para servicios externos

### Desarrollo Full-Stack Moderno
- Astro como framework híbrido (SSG + API Routes)
- TypeScript estricto en todo el stack
- Arquitectura de componentes con React 19
- Sistema de base de datos dual (local/cloud)

### Buenas Prácticas
- Testing completo (unitario + integración)
- Optimización de bundle y performance
- Seguridad (rate limiting, validación, sanitización)
- DevEx (herramientas de desarrollo, debugging)

### Gestión de Proyecto
- Desarrollo incremental por fases
- Documentación técnica detallada
- Sistema de migraciones automático
- Configuración robusta de entornos

---

**¿Completaste el Reto Estrategas de la IA?** Este proyecto muestra la implementación final con todas las mejores prácticas aplicadas. ¡Explora el código y continúa aprendiendo! 🚀