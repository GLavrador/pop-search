import { z } from 'zod';

export const videoUrlInputSchema = z.string()
    .min(1, "Please enter a URL")
    .url("Please enter a valid URL");

export type VideoUrlInput = z.infer<typeof videoUrlInputSchema>;

const countWords = (text: string): number =>
    text.trim().split(/\s+/).filter(Boolean).length;


const pessoaSchema = z.object({
    descricao: z.string(),
    papel: z.string().nullable(),
});

const audioInfoSchema = z.object({
    transcricao: z.string(),
    musica: z.string().nullable(),
    artista: z.string().nullable(),
});

const metadadosEstruturadosSchema = z.object({
    pessoas: z.array(pessoaSchema),
    elementos_cenario: z.array(z.string()),
    audio: audioInfoSchema,
});

export const videoMetadataSchema = z.object({
    titulo_sugerido: z.string()
        .min(1, "Title is required")
        .refine(
            (text) => countWords(text) >= 5,
            "The title must have at least 5 words"
        ),

    descricao_completa: z.string()
        .min(1, "Description is required")
        .refine(
            (text) => countWords(text) >= 20,
            "The description must be at least 20 words long"
        ),

    url_original: z.string()
        .url("Invalid URL")
        .optional()
        .or(z.literal('')),

    metadados_estruturados: metadadosEstruturadosSchema,
});

export type VideoMetadataValidated = z.infer<typeof videoMetadataSchema>;

const metadadosFormSchema = z.object({
    pessoas: z.array(pessoaSchema),
    elementos_cenario: z.string(),
    audio: audioInfoSchema,
});

export const videoMetadataFormSchema = z.object({
    titulo_sugerido: z.string()
        .min(1, "Title is required")
        .refine(
            (text) => countWords(text) >= 5,
            "Title must have at least 5 words"
        ),

    descricao_completa: z.string()
        .min(1, "Description is required")
        .refine(
            (text) => countWords(text) >= 20,
            "Description must be at least 20 words long"
        ),

    url_original: z.string().optional(),

    metadados_estruturados: metadadosFormSchema,
});

export type VideoMetadataForm = z.infer<typeof videoMetadataFormSchema>;