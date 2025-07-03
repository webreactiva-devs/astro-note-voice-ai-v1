import type { APIRoute } from "astro";
import {
  authenticateRequest,
  createUnauthorizedResponse,
  createBadRequestResponse,
  createServerErrorResponse,
} from "@/lib/middleware";
import {
  validateNoteContent,
  validateNoteId,
  sanitizeContent,
} from "@/lib/validation";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { database } from "@/lib/database";

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);

    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, "notes", RATE_LIMITS.notes);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait before updating notes.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitResult.headers,
          },
        }
      );
    }

    const noteId = params.id;

    // Validate note ID
    const idValidation = validateNoteId(noteId);
    if (!idValidation.isValid) {
      return createBadRequestResponse(idValidation.error!);
    }

    const { title, content, organizedContent, tags } = await request.json();

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return createBadRequestResponse("Title is required");
    }

    if (title.trim().length > 200) {
      return createBadRequestResponse(
        "Title too long. Maximum 200 characters allowed."
      );
    }

    // Validate content
    const contentValidation = validateNoteContent(content);
    if (!contentValidation.isValid) {
      return createBadRequestResponse(contentValidation.error!);
    }

    // Validate tags
    if (!Array.isArray(tags)) {
      return createBadRequestResponse("Tags must be an array");
    }

    if (tags.length > 10) {
      return createBadRequestResponse(
        "Too many tags. Maximum 10 tags allowed."
      );
    }

    // Validate individual tags
    for (const tag of tags) {
      if (typeof tag !== "string" || tag.trim().length === 0) {
        return createBadRequestResponse("All tags must be non-empty strings");
      }
      if (tag.length > 50) {
        return createBadRequestResponse(
          "Tag too long. Maximum 50 characters per tag."
        );
      }
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeContent(title.trim());
    const sanitizedContent = sanitizeContent(content);
    const sanitizedTags = tags
      .map((tag) => sanitizeContent(tag.trim()))
      .filter((tag) => tag.length > 0);

    // Verify note exists and belongs to the user
    const existingNote = await database.execute({
      sql: "SELECT id, userId FROM notes WHERE id = ?",
      args: [noteId],
    });

    if (existingNote.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingNote.rows[0].userId !== user.id) {
      return new Response(
        JSON.stringify({
          error: "Access denied: You can only edit your own notes",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update note
    await database.execute({
      sql: `UPDATE notes 
            SET title = ?, content = ?, organizedContent = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [
        sanitizedTitle,
        sanitizedContent,
        organizedContent,
        JSON.stringify(sanitizedTags),
        noteId,
      ],
    });

    // Fetch updated note
    const updatedNote = await database.execute({
      sql: "SELECT id, title, content, organizedContent, tags, createdAt, updatedAt FROM notes WHERE id = ?",
      args: [noteId],
    });

    const note = updatedNote.rows[0];

    return new Response(
      JSON.stringify({
        success: true,
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          organizedContent: note.organizedContent,
          tags: JSON.parse((note.tags as string) || "[]"),
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitResult.headers,
        },
      }
    );
  } catch (error) {
    console.error("Error in PUT /api/notes/[id]:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return createUnauthorizedResponse();
    }

    return createServerErrorResponse("Internal server error");
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);

    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, "notes", RATE_LIMITS.notes);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait before deleting notes.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitResult.headers,
          },
        }
      );
    }

    const noteId = params.id;

    // Validate note ID
    const idValidation = validateNoteId(noteId);
    if (!idValidation.isValid) {
      return createBadRequestResponse(idValidation.error!);
    }

    // Verify note exists and belongs to the user
    const existingNote = await database.execute({
      sql: "SELECT id, userId FROM notes WHERE id = ?",
      args: [noteId],
    });

    if (existingNote.rows.length === 0) {
      return new Response(JSON.stringify({ error: "Note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingNote.rows[0].userId !== user.id) {
      return new Response(
        JSON.stringify({
          error: "Access denied: You can only delete your own notes",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete note
    await database.execute({
      sql: "DELETE FROM notes WHERE id = ?",
      args: [noteId],
    });

    return new Response(
      JSON.stringify({ success: true, message: "Note deleted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitResult.headers,
        },
      }
    );
  } catch (error) {
    console.error("Error in DELETE /api/notes/[id]:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message === "Unauthorized") {
      return createUnauthorizedResponse();
    }

    return createServerErrorResponse("Internal server error");
  }
};
