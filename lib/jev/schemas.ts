import { z } from 'zod';

export const RiskProfileSchema = z.enum(['Bajo', 'Medio', 'Alto']);
export type RiskProfile = z.infer<typeof RiskProfileSchema>;

export const JevSuggestedBetSchema = z.object({
  matchId: z.string(),
  matchName: z.string(),
  selection: z.string(),
  market: z.string(),
  odds: z.number(),
});
export type JevSuggestedBet = z.infer<typeof JevSuggestedBetSchema>;

export const JevBetResponseSchema = z.object({
  queryIntent: z.string(),
  riskProfile: RiskProfileSchema,
  confidenceScore: z.number().min(0).max(100),
  suggestedBets: z.array(JevSuggestedBetSchema),
});
export type JevBetResponse = z.infer<typeof JevBetResponseSchema>;

export const JevPromptRequestSchema = z.object({
  prompt: z.string().min(1, 'El prompt no puede estar vacio'),
});
export type JevPromptRequest = z.infer<typeof JevPromptRequestSchema>;
