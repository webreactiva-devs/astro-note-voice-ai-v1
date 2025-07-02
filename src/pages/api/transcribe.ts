import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el contenido sea FormData
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No se encontró archivo de audio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
    const fileType = audioFile.type.split(';')[0]; // Remove codecs part
    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de archivo no soportado. Use WAV, MP3 o WebM' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamaño (máximo 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Archivo demasiado grande. Máximo 25MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar FormData para Groq
    const groqFormData = new FormData();
    groqFormData.append('file', audioFile);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'es');
    groqFormData.append('response_format', 'json');

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    try {
      // Llamar a la API de Groq
      const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.GROQ_API_KEY}`,
        },
        body: groqFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error('Error de Groq API:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'Error en la transcripción', 
            details: groqResponse.status === 429 ? 'Límite de rate excedido' : 'Error del servicio'
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const transcriptionResult = await groqResponse.json();
      
      // Verificar que hay texto en la transcripción
      if (!transcriptionResult.text || transcriptionResult.text.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'No se pudo transcribir el audio' }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          transcription: transcriptionResult.text.trim(),
          success: true 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Timeout: La transcripción tardó demasiado' }),
          { status: 408, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error en fetch a Groq:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Error de conexión con el servicio de transcripción' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en /api/transcribe:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};