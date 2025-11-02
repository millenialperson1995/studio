/**
 * @fileoverview This file is used to configure the Genkit developer UI.
 *   It is not included in the production build.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  // Log developer-friendly errors to the console
  logLevel: 'debug',
  // Perform OpenTelemetry instrumentation and enable exporting traces.
  enableTracing: true,
});
