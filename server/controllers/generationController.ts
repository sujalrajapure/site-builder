import prisma from '../lib/prisma.js';
import gemini from '../configs/gemini.js';
import type { Response } from 'express';

export const COMPONENTS = [
  { type: 'navbar',   label: 'Navigation Bar' },
  { type: 'hero',     label: 'Hero Section' },
  { type: 'features', label: 'Features Section' },
  { type: 'about',    label: 'About Section' },
  { type: 'pricing',  label: 'Pricing Section' },
  { type: 'cta',      label: 'Call to Action' },
  { type: 'footer',   label: 'Footer' },
];

/** Clean markdown fences from AI output */
const clean = (text: string) =>
  text.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();

/**
 * Generate a website one component at a time (sequential).
 * Calls `onProgress` after each component is ready.
 */
export const generateModularProject = async (
  projectId: string,
  prompt: string,
  onProgress?: (event: { type: string; label: string; index: number; total: number; html: string; mergedSoFar: string }) => void
) => {
  const project = await prisma.websiteProject.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  // Step 1: Enhance the prompt once
  const enhancedResult = await gemini.model.generateContent(
    `You are a web design strategist. Enhance the following request into a concise, detailed brief suitable for building a complete, modern website with sections: navbar, hero, features, about, pricing, CTA, footer. Return ONLY the enhanced brief (2-3 sentences), no extra text.\n\nRequest: "${prompt}"`
  );
  const basePrompt = clean(enhancedResult.response.text()) || prompt;

  const builtSections: string[] = [];
  const total = COMPONENTS.length;

  // Step 2: Generate each component one at a time (sequential for stability)
  for (let i = 0; i < total; i++) {
    const { type, label } = COMPONENTS[i];

    const componentResult = await gemini.model.generateContent(
      `You are an expert frontend developer.

Generate ONLY a single, self-contained HTML snippet for the "${type}" section of a website.

Rules:
- Use Tailwind CSS classes only (no <style> tags, no custom CSS)
- No full HTML document wrapper (no <!DOCTYPE>, <html>, <head>, <body> tags)
- Modern, attractive, responsive design
- Use placeholder images from https://placehold.co/ when needed
- Return ONLY the HTML for this section, nothing else

Website brief: ${basePrompt}`
    );

    const html = clean(componentResult.response.text());
    builtSections.push(html);

    // Build the merged page so far (with all sections generated up to this point)
    const mergedSoFar = wrapInPage(builtSections);

    // Save progress to DB so polling also works
    await prisma.websiteProject.update({
      where: { id: projectId },
      data: { current_code: mergedSoFar }
    });

    // Notify caller (SSE)
    if (onProgress) {
      onProgress({ type, label, index: i, total, html, mergedSoFar });
    }
  }

  // Step 3: Final save with complete page
  const finalCode = wrapInPage(builtSections);
  const version = await prisma.version.create({
    data: { code: finalCode, description: 'AI generated (modular)', projectId }
  });
  await prisma.websiteProject.update({
    where: { id: projectId },
    data: { current_code: finalCode, current_version_index: version.id }
  });

  return finalCode;
};

/** Wrap component HTML snippets into a full standalone page */
function wrapInPage(sections: string[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Generated Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900 antialiased">
${sections.join('\n')}
</body>
</html>`;
}

/**
 * SSE handler: streams component-by-component generation progress to the client.
 * Usage: GET /api/user/generate-stream/:projectId
 */
export const streamGeneration = async (projectId: string, prompt: string, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Force flush for Node streams
    if ((res as any).flush) (res as any).flush();
  };

  send({ event: 'start', total: COMPONENTS.length });

  try {
    await generateModularProject(projectId, prompt, (progress) => {
      send({
        event: 'component',
        type: progress.type,
        label: progress.label,
        index: progress.index,
        total: progress.total,
        html: progress.html,
        mergedSoFar: progress.mergedSoFar,
      });
    });

    send({ event: 'done' });
  } catch (err: any) {
    send({ event: 'error', message: err.message || 'Generation failed' });
  } finally {
    res.end();
  }
};
