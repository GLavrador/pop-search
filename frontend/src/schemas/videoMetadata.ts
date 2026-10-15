import { z } from 'zod';

export const MIN_TITLE_CHARS = 5;

export interface ValidationMessages {
    urlRequired: string;
    urlInvalid: string;
    invalidUrl: string;
    titleRequired: string;
    titleLength: string;
    descriptionRequired: string;
    descriptionLength: string;
    textLength: (min: number, max: number) => string;
    itemLimit: (max: number) => string;
}

export const createVideoUrlInputSchema = (messages: ValidationMessages) =>
    z.string().trim()
        .min(1, messages.urlRequired)
        .max(2048, messages.urlInvalid)
        .pipe(z.url({ protocol: /^https?$/, error: messages.urlInvalid }));

export const createVideoMetadataFormSchema = (messages: ValidationMessages) => {
    const text = (min: number, max: number) => z.string()
        .refine((value) => Array.from(value).length >= min && Array.from(value).length <= max,
            messages.textLength(min, max));
    const scenario = z.array(text(0, 500)).max(50, messages.itemLimit(50));

    return z.object({
        titulo_sugerido: z.string().trim()
            .min(1, messages.titleRequired)
            .refine((value) => Array.from(value).length >= MIN_TITLE_CHARS && Array.from(value).length <= 200,
                messages.titleLength),
        descricao_completa: z.string().trim()
            .min(1, messages.descriptionRequired)
            .refine((value) => Array.from(value).length >= 20 && Array.from(value).length <= 5000,
                messages.descriptionLength),
        url_original: createVideoUrlInputSchema(messages).optional(),
        metadados_estruturados: z.object({
            pessoas: z.array(z.object({
                descricao: text(3, 500),
                papel: text(0, 100).nullable(),
            })).max(20, messages.itemLimit(20)),
            elementos_cenario: z.string().superRefine((value, ctx) => {
                const result = scenario.safeParse(value.split(',').map((item) => item.trim()).filter(Boolean));
                if (!result.success) {
                    for (const issue of result.error.issues) {
                        ctx.addIssue({ code: 'custom', message: issue.message });
                    }
                }
            }),
            audio: z.object({
                transcricao: text(0, 5000),
                musica: text(0, 200).nullable(),
                artista: text(0, 200).nullable(),
            }),
        }),
    });
};

export type VideoMetadataForm = z.infer<ReturnType<typeof createVideoMetadataFormSchema>>;
