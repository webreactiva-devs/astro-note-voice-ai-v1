import type { APIRoute } from 'astro';
import { authenticateRequest, createUnauthorizedResponse, createBadRequestResponse, createServerErrorResponse, createRateLimitResponse } from '@/lib/middleware';
import { validateAudioFile } from '@/lib/validation';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, 'transcription', RATE_LIMITS.transcription);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many transcription requests. Please wait before trying again.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          } 
        }
      );
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return createBadRequestResponse('Content-Type must be multipart/form-data');
    }

    // Get FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return createBadRequestResponse('No audio file found');
    }

    // Validate audio file
    const validation = validateAudioFile(audioFile);
    if (!validation.isValid) {
      return createBadRequestResponse(validation.error!);
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
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          } 
        }
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
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedResponse();
    }
    
    return createServerErrorResponse('Error interno del servidor');
  }
};