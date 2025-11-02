'use server';
/**
 * @fileoverview This file contains the Genkit configuration for the app.
 * It is used by the Next.js server to interact with the Genkit API.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { genkitEval } from 'genkit/eval';
import { defineFlow, run, startFlow } from 'genkit/flow';
import { NextjsPlugin } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY as string,
    }),
    NextjsPlugin(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
