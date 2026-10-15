import { z } from 'zod';

export interface ValidationMessages {
    urlRequired: string;
    urlInvalid: string;
    invalidUrl: string;
    titleRequired: string;
    titleWords: string;
    descriptionRequired: string;
    descriptionWords: string;
}

export const createVideoUrlInputSchema = (messages: ValidationMessages) =>
    z.string()
        .min(1, messages.urlRequired)
        .url(messages.urlInvalid);

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

const metadadosFormSchema = z.object({
    pessoas: z.array(pessoaSchema),
    elementos_cenario: z.string(),
    audio: audioInfoSchema,
});

export const createVideoMetadataFormSchema = (messages: ValidationMessages) => z.object({
    titulo_sugerido: z.string()
        .min(1, messages.titleRequired)
        .refine(
            (text) => countWords(text) >= 5,
            messages.titleWords
        ),

    descricao_completa: z.string()
        .min(1, messages.descriptionRequired)
        .refine(
            (text) => countWords(text) >= 20,
            messages.descriptionWords
        ),

    url_original: z.string().optional(),

    metadados_estruturados: metadadosFormSchema,
});

export type VideoMetadataForm = z.infer<ReturnType<typeof createVideoMetadataFormSchema>>;
