// generate-repo.js
// Usage: node generate-repo.js
// Writes a complete Peace AI Studio scaffold into the current directory.

const fs = require('fs');
const path = require('path');

function write(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Wrote', filePath);
}

const files = {
  // package & config
  'package.json': `{
  "name": "peace-ai-studio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@supabase/supabase-js": "^2.10.0",
    "@supabase/auth-helpers-nextjs": "^0.6.0",
    "axios": "^1.4.0",
    "zod": "^3.22.2",
    "clsx": "^1.2.1",
    "swr": "^2.2.0",
    "jszip": "^3.10.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "tailwindcss": "^3.5.4",
    "postcss": "^8.4.22",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.43.0",
    "eslint-config-next": "15.0.0"
  }
}
`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`,
  'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "replicate.delivery",
      "cdn.elevenlabs.io",
      "cdn.assemblyai.com",
      "lh3.googleusercontent.com"
    ]
  }
};
module.exports = nextConfig;
`,
  'tailwind.config.js': `module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef6ff",
          100: "#d9ecff",
          500: "#3b82f6"
        }
      }
    }
  },
  plugins: []
};
`,
  'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`,
  '.eslintrc.json': `{
  "extends": ["next/core-web-vitals", "eslint:recommended"],
  "rules": {
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
`,
  '.env.example': `# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage bucket
SUPABASE_STORAGE_BUCKET=peace-stories-media

# OpenAI / LLMs
OPENAI_API_KEY=
GEMINI_API_KEY=

# Image & Video providers
# Replicate is PAID (billed per generation-second). It is OFF by default.
# Set ENABLE_PAID_PROVIDERS=true only if you want to allow it as a fallback.
REPLICATE_API_TOKEN=
ENABLE_PAID_PROVIDERS=false
FAL_KEY=
REMOVEBG_API_KEY=

# Voice
ELEVENLABS_API_KEY=

# Transcription
ASSEMBLYAI_API_KEY=

# App
NEXT_PUBLIC_APP_NAME=PeaceStories Studio

# Hugging Face (free tier - primary provider for image & video generation)
# Free Inference API has rate limits, cold-start delays, and not every model
# is available on the free serverless tier. This is the default, no-cost path.
HUGGINGFACE_API_KEY=
LOCAL_AI_URL=

# Admin emails comma-separated
ADMIN_EMAILS=

# Do not commit real secrets. Use .env.local for local development.
`,

  '.gitignore': `# dependencies
node_modules/

# next.js build output
.next/
out/

# env files - NEVER commit real API keys
.env
.env.local
.env.*.local

# misc
.DS_Store
*.log
`,

  // DB schema
  'db/schema.sql': `-- Supabase schema for Peace AI Studio
create extension if not exists "pgcrypto";

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade,
  title text not null,
  description text,
  metadata jsonb default '{}',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  owner_id uuid references auth.users on delete cascade,
  kind text not null,
  provider text,
  provider_payload jsonb,
  storage_path text,
  filename text,
  mime_type text,
  width int,
  height int,
  duration numeric,
  size bigint,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Generation jobs
create table if not exists gen_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  owner_id uuid references auth.users on delete cascade,
  kind text not null,
  status text default 'pending',
  provider text,
  provider_job_id text,
  progress numeric default 0,
  error_text text,
  input jsonb,
  output jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exports
create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  owner_id uuid references auth.users on delete cascade,
  format text,
  resolution text,
  provider text,
  storage_path text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade,
  title text,
  body text,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

-- User consents
create table if not exists user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  age_verified boolean default false,
  consented boolean default false,
  accepted_at timestamptz default now()
);

-- Row Level Security: without this, anyone using the public anon key
-- (which the browser client uses) could read or write any user's rows.
alter table projects enable row level security;
alter table assets enable row level security;
alter table gen_jobs enable row level security;
alter table exports enable row level security;
alter table notifications enable row level security;
alter table user_consents enable row level security;

create policy "Users manage their own projects"
  on projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own assets"
  on assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own gen_jobs"
  on gen_jobs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own exports"
  on exports for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own notifications"
  on notifications for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own consents"
  on user_consents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Server-side code uses the service role key (serverSupabase), which
-- bypasses RLS entirely, so the API routes above still work as expected.
`,

  // lib
  'lib/supabaseClient.ts': `import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase public keys are not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  {
    auth: { persistSession: true, detectSessionInUrl: true },
  }
);
`,
  'lib/serverSupabase.ts': `import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing. Server-only operations will be disabled until configured.');
}

export const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } }
);
`,
  'lib/moderation.ts': `/**
 * Minimal moderation module.
 * Uses OpenAI moderation if OPENAI_API_KEY present (server-side).
 * Otherwise uses a lightweight keyword fallback.
 */

export async function moderatePrompt(prompt: string) {
  const text = (prompt || '').toLowerCase();

  const explicit = [
    'porn','pornography','nude','naked','sex','sexual','oral sex','blowjob','anal','hardcore','incest','rape','underage','minor','child','teen'
  ];
  const romantic = ['kiss','kissing','romantic','affection','embrace','cuddle','couple','holding hands'];

  // Try OpenAI moderation if available
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: prompt, model: 'omni-moderation-latest' })
      });
      if (res.ok) {
        const json = await res.json();
        const r = json.results?.[0];
        const cats = r?.categories ?? {};
        if (cats['sexual/minors'] || cats['sexual/explicit']) {
          return { allowed: false, sensitive: false, disallowed: true, reasons: ['explicit by moderation'] };
        }
        if (cats['sexual']) {
          return { allowed: true, sensitive: true, disallowed: false, reasons: ['sensitive by moderation'] };
        }
        return { allowed: true, sensitive: false, disallowed: false, reasons: [] };
      }
    } catch (e) {
      console.warn('OpenAI moderation failed', e);
    }
  }

  for (const k of explicit) {
    if (text.includes(k)) return { allowed: false, sensitive: false, disallowed: true, reasons: ['explicit: ' + k] };
  }
  for (const k of romantic) {
    if (text.includes(k)) return { allowed: true, sensitive: true, disallowed: false, reasons: ['romantic: ' + k] };
  }
  return { allowed: true, sensitive: false, disallowed: false, reasons: [] };
}
`,

  'lib/ai/huggingface.ts': `/**
 * Minimal Hugging Face adapter using global fetch
 */

const HF_API = 'https://api-inference.huggingface.co/models';

function requireKey() {
  if (!process.env.HUGGINGFACE_API_KEY) throw new Error('HUGGINGFACE_API_KEY not configured.');
}

async function callModel(model, body, accept = 'application/json') {
  requireKey();
  const res = await fetch(\`\${HF_API}/\${encodeURIComponent(model)}\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${process.env.HUGGINGFACE_API_KEY}\`,
      Accept: accept,
      'Content-Type': accept === 'application/json' ? 'application/json' : 'application/octet-stream'
    },
    body: accept === 'application/json' ? JSON.stringify(body) : body
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return { ok: res.ok, contentType, json, raw: null };
  } else {
    const arrayBuffer = await res.arrayBuffer();
    return { ok: res.ok, contentType, json: null, raw: Buffer.from(arrayBuffer) };
  }
}

export async function textToImage(model, prompt, options = {}) {
  const body = { inputs: prompt, parameters: options, options: { wait_for_model: true } };
  const out = await callModel(model, body, 'application/json');
  if (!out.ok) throw new Error('HuggingFace image generation failed: ' + JSON.stringify(out.json || out.contentType));
  const json = out.json;
  const buffers = [];
  if (!json) throw new Error('HF returned no json for image generation.');
  if (Array.isArray(json)) {
    for (const item of json) {
      if (typeof item === 'string' && item.startsWith('data:image')) {
        buffers.push(Buffer.from(item.split(',')[1], 'base64'));
      } else if (item?.image_base64) {
        buffers.push(Buffer.from(item.image_base64, 'base64'));
      }
    }
  } else if (json.images && Array.isArray(json.images)) {
    for (const img of json.images) {
      if (typeof img === 'string' && img.startsWith('data:image')) {
        buffers.push(Buffer.from(img.split(',')[1], 'base64'));
      } else if (typeof img === 'string') {
        buffers.push(Buffer.from(img, 'base64'));
      }
    }
  }
  return buffers;
}

export async function textToVideo(model, prompt, options = {}) {
  const body = { inputs: prompt, parameters: options, options: { wait_for_model: true } };
  const out = await callModel(model, body, 'application/json');
  if (!out.ok) {
    throw new Error(
      'HuggingFace video generation failed: ' + JSON.stringify(out.json || out.contentType) +
      '. Note: free-tier text-to-video models are limited, often cold, and may be unavailable.'
    );
  }
  // Some HF video models return raw video bytes instead of JSON
  if (out.raw) return out.raw;
  const json = out.json;
  if (json?.video_base64) return Buffer.from(json.video_base64, 'base64');
  if (Array.isArray(json) && json[0]?.video_base64) return Buffer.from(json[0].video_base64, 'base64');
  throw new Error('HuggingFace returned an unexpected response shape for video generation.');
}
`,

  'lib/ai/replicate.ts': `/**
 * Minimal Replicate adapter using global fetch
 */
const API = 'https://api.replicate.com/v1';

function ensureKey() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured.');
  }
}

export async function replicateCreatePrediction(version, input) {
  ensureKey();
  const res = await fetch(\`\${API}/predictions\`, {
    method: 'POST',
    headers: {
      Authorization: \`Token \${process.env.REPLICATE_API_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version, input })
  });
  if (!res.ok) throw new Error('Replicate create failed: ' + (await res.text()));
  return res.json();
}

export async function replicateGetPrediction(id) {
  ensureKey();
  const res = await fetch(\`\${API}/predictions/\${id}\`, {
    headers: { Authorization: \`Token \${process.env.REPLICATE_API_TOKEN}\` }
  });
  if (!res.ok) throw new Error('Replicate get failed: ' + (await res.text()));
  return res.json();
}
`,

  'lib/ai/local.ts': `/**
 * Local adapter: forwards requests to a self-hosted LOCAL_AI_URL
 */
const LOCAL = process.env.LOCAL_AI_URL;

export async function localTextToImage(model, prompt, options = {}) {
  if (!LOCAL) throw new Error('LOCAL_AI_URL not configured.');
  const res = await fetch(\`\${LOCAL}/image-generation\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, options })
  });
  if (!res.ok) throw new Error('Local image generation failed: ' + (await res.text()));
  return res.json();
}

export async function localTextToVideo(model, prompt, options = {}) {
  if (!LOCAL) throw new Error('LOCAL_AI_URL not configured.');
  const res = await fetch(\`\${LOCAL}/video-generation\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, options })
  });
  if (!res.ok) throw new Error('Local video generation failed: ' + (await res.text()));
  const json = await res.json();
  const b64 = json?.video_base64;
  if (!b64) throw new Error('Local server returned no video_base64 field.');
  return Buffer.from(b64, 'base64');
}
`,

  'lib/ai/elevenlabs.ts': `export async function synthesizeEleven(voiceId, text, model = 'eleven_multilingual_v1') {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured.');
  }
  const res = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, model })
  });
  if (!res.ok) throw new Error('ElevenLabs synth failed: ' + (await res.text()));
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}
`,

  'lib/ai/assemblyai.ts': `export async function createAssemblyTranscript(url) {
  if (!process.env.ASSEMBLYAI_API_KEY) throw new Error('ASSEMBLYAI_API_KEY not configured.');
  const res = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ audio_url: url, auto_chapters: false })
  });
  if (!res.ok) throw new Error('Assembly create failed: ' + (await res.text()));
  return res.json();
}

export async function getAssemblyTranscript(id) {
  if (!process.env.ASSEMBLYAI_API_KEY) throw new Error('ASSEMBLYAI_API_KEY not configured.');
  const res = await fetch(\`https://api.assemblyai.com/v2/transcript/\${id}\`, {
    headers: { Authorization: process.env.ASSEMBLYAI_API_KEY }
  });
  if (!res.ok) throw new Error('Assembly get failed: ' + (await res.text()));
  return res.json();
}
`,

  // app layout & globals
  'app/layout.tsx': `import './globals.css';
import React from 'react';

export const metadata = {
  title: 'PeaceStories Studio',
  description: 'AI-powered creative production platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-slate-100 antialiased">
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800">
          <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
        </div>
      </body>
    </html>
  );
}
`,
  'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --glass-bg: rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.06);
}

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(6px);
  border-radius: 12px;
}
`,

  // middleware
  'middleware.ts': `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient({ req, res, cookies });
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const pathname = req.nextUrl.pathname;

  if (!session && (pathname.startsWith('/dashboard') || pathname.startsWith('/studio'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/studio/:path*']
};
`,

  // basic pages
  'app/page.tsx': `import Link from 'next/link';

export default function Home() {
  return (
    <main className="grid gap-8">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">PeaceStories Studio</h1>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 rounded bg-blue-600 text-white">Sign In</Link>
          <Link href="/register" className="px-4 py-2 rounded border border-neutral-700">Get Started</Link>
        </nav>
      </header>

      <section className="card p-8">
        <h2 className="text-2xl font-semibold">Create professional videos, images, scripts and more using AI</h2>
        <p className="mt-2 text-neutral-300">Generate assets, manage projects, and render exports — all saved to your Supabase account.</p>

        <div className="mt-6 flex gap-4 flex-wrap">
          <Link href="/studio" className="px-4 py-3 bg-blue-600 rounded text-white">Open AI Studio</Link>
          <Link href="/dashboard" className="px-4 py-3 border border-neutral-700 rounded">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
`,

  // auth layout + pages
  'app/(auth)/layout.tsx': `import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-bold">PeaceStories Studio</Link>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  );
}
`,
  'app/(auth)/login/page.tsx': `'use client';
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: (typeof window !== 'undefined' && window.location.origin) ? window.location.origin + '/dashboard' : '/' } });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-semibold">Sign in</h2>
      <p className="text-sm text-neutral-400">Sign in with email. Magic link will be sent to your inbox.</p>

      <label className="block">
        <span className="text-sm">Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full p-2 rounded bg-neutral-900 border border-neutral-700" required />
      </label>

      <div className="flex items-center gap-2">
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 rounded text-white">
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
        <a href="/register" className="text-sm text-neutral-400">Create an account</a>
      </div>

      {error && <div className="text-red-400">{error}</div>}
    </form>
  );
}
`,
  'app/(auth)/register/page.tsx': `'use client';
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: (typeof window !== 'undefined' && window.location.origin) ? window.location.origin + '/dashboard' : '/' } });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-xl font-semibold">Create account</h2>
      <label className="block">
        <span className="text-sm">Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full p-2 rounded bg-neutral-900 border border-neutral-700" required />
      </label>
      <label className="block">
        <span className="text-sm">Password</span>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 block w-full p-2 rounded bg-neutral-900 border border-neutral-700" required />
      </label>
      <div>
        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 rounded text-white">
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
`,

  // simple studio & generation
  'app/studio/page.tsx': `import Link from 'next/link';
import React from 'react';

export default function StudioHome() {
  const tools = [
    { slug: 'image', title: 'AI Image Generator', desc: 'Text-to-image' },
    { slug: 'video', title: 'AI Video Generator', desc: 'Text-to-video (free tier, short clips)' },
    { slug: 'script', title: 'AI Script Generator', desc: 'Movie & short scripts' },
    { slug: 'story', title: 'AI Story Generator', desc: 'Stories for projects' },
    { slug: 'voice', title: 'AI Voice Generator', desc: 'Text-to-speech' },
    { slug: 'music', title: 'AI Music Generator', desc: 'AI music (queued)' },
  ];

  return (
    <main className="grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Studio</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.slug} href={\`/studio/\${t.slug}\`} className="card p-4 hover:scale-[1.01] transition-transform">
            <h3 className="font-semibold">{t.title}</h3>
            <p className="text-neutral-400 mt-1 text-sm">{t.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
`,

  'app/studio/image/page.tsx': `import React from 'react';
import GenerationPanel from '../../../components/GenerationPanel';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function ImageStudio() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="card p-6">Please <a href="/login" className="text-blue-400">sign in</a> to use the Image Generator.</div>;
  }

  return (
    <main>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Image Generator</h1>
      </header>

      <GenerationPanel projectId="unsaved" userId={user.id} />
    </main>
  );
}
`,

  'app/studio/video/page.tsx': `import React from 'react';
import VideoGenerationPanel from '../../../components/VideoGenerationPanel';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function VideoStudio() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="card p-6">Please <a href="/login" className="text-blue-400">sign in</a> to use the Video Generator.</div>;
  }

  return (
    <main>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Video Generator</h1>
      </header>
      <p className="text-sm text-neutral-400 mb-4">
        Uses the free Hugging Face tier by default. Clips are short and can take a while to
        generate, especially on the first request (cold start).
      </p>

      <VideoGenerationPanel projectId="unsaved" userId={user.id} />
    </main>
  );
}
`,

  // generation panel & prompt checker components
  'components/GenerationPanel.tsx': `'use client';
import React, { useState } from 'react';
import PromptChecker from './PromptChecker';

export default function GenerationPanel({ projectId, userId }: { projectId: string; userId: string }) {
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState('1:1');
  const [count, setCount] = useState(1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [moderation, setModeration] = useState<any>(null);

  async function handleGenerateImage() {
    setRunning(true);
    setError(null);
    if (moderation?.disallowed) {
      setError('Prompt contains disallowed content. Please modify your prompt.');
      setRunning(false);
      return;
    }
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectId, ownerId: userId, aspect, count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Generation failed');
      setResult(data.uploaded);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold">Image Generator</h3>
      <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setModeration(null); }} placeholder="Describe your image..." className="w-full mt-2 p-2 bg-neutral-900 border border-neutral-700 rounded" rows={4} />
      <div className="mt-2">
        <PromptChecker prompt={prompt} onResult={(r) => setModeration(r)} />
      </div>

      <div className="flex gap-2 mt-2">
        <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="p-2 bg-neutral-900 border border-neutral-700 rounded">
          <option value="1:1">1:1</option>
          <option value="3:4">3:4</option>
          <option value="4:3">4:3</option>
          <option value="9:16">9:16</option>
          <option value="16:9">16:9</option>
          <option value="21:9">21:9</option>
        </select>
        <input type="number" min={1} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-20 p-2 bg-neutral-900 border border-neutral-700 rounded" />
        <button onClick={handleGenerateImage} disabled={running} className="px-4 py-2 bg-blue-600 rounded text-white">
          {running ? 'Generating...' : 'Generate Image'}
        </button>
      </div>

      {error && <div className="text-red-400 mt-2">{error}</div>}

      {result && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {result.map((r: any) => (
            <img key={r.asset.id} src={r.publicUrl} alt="generated" className="rounded w-full h-auto object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
`,

  'components/VideoGenerationPanel.tsx': `'use client';
import React, { useState } from 'react';
import PromptChecker from './PromptChecker';

export default function VideoGenerationPanel({ projectId, userId }: { projectId: string; userId: string }) {
  const [prompt, setPrompt] = useState('');
  const [seconds, setSeconds] = useState(4);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [moderation, setModeration] = useState<any>(null);

  async function handleGenerateVideo() {
    setRunning(true);
    setError(null);
    setResult(null);
    if (moderation?.disallowed) {
      setError('Prompt contains disallowed content. Please modify your prompt.');
      setRunning(false);
      return;
    }
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectId, ownerId: userId, seconds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Generation failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold">Video Generator</h3>
      <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setModeration(null); }} placeholder="Describe your video..." className="w-full mt-2 p-2 bg-neutral-900 border border-neutral-700 rounded" rows={4} />
      <div className="mt-2">
        <PromptChecker prompt={prompt} onResult={(r) => setModeration(r)} />
      </div>

      <div className="flex gap-2 mt-2 items-center">
        <label className="text-sm text-neutral-400">Length (seconds)</label>
        <input type="number" min={1} max={8} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="w-20 p-2 bg-neutral-900 border border-neutral-700 rounded" />
        <button onClick={handleGenerateVideo} disabled={running || !prompt} className="px-4 py-2 bg-blue-600 rounded text-white">
          {running ? 'Generating... (can take a minute on cold start)' : 'Generate Video'}
        </button>
      </div>

      {error && <div className="text-red-400 mt-2">{error}</div>}

      {result?.publicUrl && (
        <div className="mt-4">
          <video src={result.publicUrl} controls className="rounded w-full max-w-md" />
        </div>
      )}
    </div>
  );
}
`,

  'components/PromptChecker.tsx': `'use client';
import React, { useState } from 'react';

export default function PromptChecker({ prompt, onResult }: { prompt: string; onResult?: (r: any) => void }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    if (!prompt || prompt.trim().length === 0) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Moderation failed');
      setResult(json.result);
      if (onResult) onResult(json.result);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button onClick={check} disabled={checking || !prompt} className="px-3 py-1 bg-neutral-800 border rounded text-sm">
          {checking ? 'Checking…' : 'Check prompt'}
        </button>
        {result && result.disallowed && <span className="text-red-400 text-sm">Disallowed</span>}
        {result && result.sensitive && !result.disallowed && <span className="text-yellow-300 text-sm">Sensitive (needs consent)</span>}
        {result && !result.sensitive && !result.disallowed && <span className="text-green-400 text-sm">OK</span>}
      </div>
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
    </div>
  );
}
`,

  // API: moderate + image generation (minimal)
  'app/api/moderate/route.ts': `import { NextResponse } from 'next/server';
import { moderatePrompt } from '../../../lib/moderation';

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    const result = await moderatePrompt(prompt);
    return NextResponse.json({ result });
  } catch (err) {
    console.error('Moderation error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
`,

  'app/api/generate/image/route.ts': `import { NextResponse } from 'next/server';
import { serverSupabase } from '../../../../lib/serverSupabase';
import { textToImage as hfTextToImage } from '../../../../lib/ai/huggingface';
import { localTextToImage } from '../../../../lib/ai/local';
import { replicateCreatePrediction, replicateGetPrediction } from '../../../../lib/ai/replicate';
import { moderatePrompt } from '../../../../lib/moderation';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, projectId, ownerId, aspect = '1:1', count = 1 } = body;

    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'SUPABASE_STORAGE_BUCKET is not configured on the server.' }, { status: 500 });
    }

    const mod = await moderatePrompt(prompt);
    if (mod.disallowed) {
      return NextResponse.json({ error: 'Prompt disallowed.' }, { status: 403 });
    }
    if (mod.sensitive) {
      const { data: consents } = await serverSupabase.from('user_consents').select('*').eq('user_id', ownerId).limit(1);
      const consent = consents?.[0];
      if (!consent || !consent.age_verified || !consent.consented) {
        return NextResponse.json({ error: 'Sensitive content requires age verification and consent.' }, { status: 403 });
      }
    }

    const { data: job } = await serverSupabase.from('gen_jobs').insert([{
      project_id: projectId,
      owner_id: ownerId,
      kind: 'image',
      status: 'running',
      input: { prompt, aspect, count, moderation: mod }
    }]).select('*').single();

    const aspectMap = {
      '1:1': { w: 1024, h: 1024 },
      '3:4': { w: 768, h: 1024 },
      '4:3': { w: 1024, h: 768 },
      '9:16': { w: 540, h: 960 },
      '16:9': { w: 1920, h: 1080 },
      '21:9': { w: 2560, h: 1080 }
    };
    const dims = aspectMap[aspect] ?? aspectMap['1:1'];

    let imageBuffers = [];
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const hfModel = process.env.HF_IMAGE_MODEL ?? 'stabilityai/stable-diffusion-2';
        imageBuffers = await hfTextToImage(hfModel, prompt, { height: dims.h, width: dims.w, num_images: count });
      } catch (e) {
        console.warn('HF failed', e);
      }
    }

    if ((!imageBuffers || imageBuffers.length === 0) && process.env.LOCAL_AI_URL) {
      try {
        const localResp = await localTextToImage(process.env.LOCAL_IMAGE_MODEL ?? 'sd-v1', prompt, { height: dims.h, width: dims.w, num_images: count });
        if (localResp?.images) {
          imageBuffers = localResp.images.map((b) => {
            if (b.startsWith('data:')) b = b.split(',')[1];
            return Buffer.from(b, 'base64');
          });
        }
      } catch (e) {
        console.warn('Local failed', e);
      }
    }

    const paidProvidersEnabled = process.env.ENABLE_PAID_PROVIDERS === 'true';
    if ((!imageBuffers || imageBuffers.length === 0) && paidProvidersEnabled && process.env.REPLICATE_API_TOKEN) {
      const modelVersion = process.env.REPLICATE_SDXL_VERSION ?? 'stability-ai/stable-diffusion-xl';
      const prediction = await replicateCreatePrediction(modelVersion, { prompt, width: dims.w, height: dims.h, num_outputs: count });
      await serverSupabase.from('gen_jobs').update({ provider: 'replicate', provider_job_id: prediction.id }).eq('id', job.id);

      let pred = prediction;
      let tries = 0;
      while (pred.status !== 'succeeded' && pred.status !== 'failed' && tries < 120) {
        await new Promise((r) => setTimeout(r, 1500));
        pred = await replicateGetPrediction(prediction.id);
        const progress = typeof pred?.progress === 'number' ? pred.progress * 100 : 0;
        await serverSupabase.from('gen_jobs').update({ progress }).eq('id', job.id);
        tries++;
      }
      if (pred.status === 'failed') {
        await serverSupabase.from('gen_jobs').update({ status: 'failed', error_text: JSON.stringify(pred) }).eq('id', job.id);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
      }
      const outputs = pred.output || [];
      for (const url of outputs) {
        const r = await fetch(url);
        const buf = Buffer.from(await r.arrayBuffer());
        imageBuffers.push(buf);
      }
    }

    if (!imageBuffers || imageBuffers.length === 0) {
      await serverSupabase.from('gen_jobs').update({ status: 'failed', error_text: 'No free provider available. Set ENABLE_PAID_PROVIDERS=true to allow the paid Replicate fallback.' }).eq('id', job.id);
      return NextResponse.json({ error: 'No AI provider configured or the free tier is temporarily unavailable. Paid fallback is disabled by default (set ENABLE_PAID_PROVIDERS=true to enable it).' }, { status: 400 });
    }

    const uploaded = [];
    for (let i = 0; i < imageBuffers.length; i++) {
      const buf = imageBuffers[i];
      const filename = \`\${ownerId ?? 'guest'}/projects/\${projectId}/images/\${job.id}-\${Date.now()}-\${i}.png\`;
      const { data: upload, error } = await serverSupabase.storage.from(bucket).upload(filename, buf, { contentType: 'image/png' });
      if (error) throw error;
      const publicUrl = serverSupabase.storage.from(bucket).getPublicUrl(filename).publicUrl;
      const { data: asset } = await serverSupabase.from('assets').insert([{
        project_id: projectId,
        owner_id: ownerId,
        kind: 'image',
        provider: process.env.HUGGINGFACE_API_KEY ? 'huggingface' : (process.env.LOCAL_AI_URL ? 'local' : 'replicate'),
        provider_payload: { prompt, index: i, moderation: mod },
        storage_path: filename,
        filename,
        mime_type: 'image/png'
      }]).select('*').single();
      uploaded.push({ asset, publicUrl });
    }

    await serverSupabase.from('gen_jobs').update({ status: 'completed', progress: 100, output: { uploaded, moderation: mod } }).eq('id', job.id);
    return NextResponse.json({ success: true, uploaded });
  } catch (err) {
    console.error('Image generation error', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
`,

  'app/api/generate/video/route.ts': `import { NextResponse } from 'next/server';
import { serverSupabase } from '../../../../lib/serverSupabase';
import { textToVideo as hfTextToVideo } from '../../../../lib/ai/huggingface';
import { localTextToVideo } from '../../../../lib/ai/local';
import { moderatePrompt } from '../../../../lib/moderation';

// NOTE ON COST: this route defaults to the free Hugging Face Inference API.
// Free-tier text-to-video models are limited: short clips, low resolution,
// frequent cold-start delays, and occasional unavailability. There is
// currently no reliable, high-quality, fully-free video generation API.
// A paid provider (e.g. Replicate) can be wired in the same way as the
// image route, but it is intentionally left out here unless you opt in
// via ENABLE_PAID_PROVIDERS, since video generation is billed per second
// and can get expensive fast.

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, projectId, ownerId, seconds = 4 } = body;

    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: 'SUPABASE_STORAGE_BUCKET is not configured on the server.' }, { status: 500 });
    }

    const mod = await moderatePrompt(prompt);
    if (mod.disallowed) {
      return NextResponse.json({ error: 'Prompt disallowed.' }, { status: 403 });
    }
    if (mod.sensitive) {
      const { data: consents } = await serverSupabase.from('user_consents').select('*').eq('user_id', ownerId).limit(1);
      const consent = consents?.[0];
      if (!consent || !consent.age_verified || !consent.consented) {
        return NextResponse.json({ error: 'Sensitive content requires age verification and consent.' }, { status: 403 });
      }
    }

    const { data: job } = await serverSupabase.from('gen_jobs').insert([{
      project_id: projectId,
      owner_id: ownerId,
      kind: 'video',
      status: 'running',
      input: { prompt, seconds, moderation: mod }
    }]).select('*').single();

    if (!process.env.HUGGINGFACE_API_KEY && !process.env.LOCAL_AI_URL) {
      await serverSupabase.from('gen_jobs').update({ status: 'failed', error_text: 'No free video provider configured' }).eq('id', job.id);
      return NextResponse.json({ error: 'Video generation needs either HUGGINGFACE_API_KEY or a LOCAL_AI_URL (self-hosted GPU) configured. There is no paid fallback enabled by default.' }, { status: 400 });
    }

    let videoBuffer = null;

    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const hfModel = process.env.HF_VIDEO_MODEL ?? 'damo-vilab/text-to-video-ms-1.7b';
        videoBuffer = await hfTextToVideo(hfModel, prompt, { num_frames: Math.min(Math.max(seconds, 1), 8) * 8 });
      } catch (e) {
        console.warn('HF video generation failed, will try local fallback if configured', e);
      }
    }

    if (!videoBuffer && process.env.LOCAL_AI_URL) {
      try {
        videoBuffer = await localTextToVideo(process.env.LOCAL_VIDEO_MODEL ?? 'zeroscope', prompt, { seconds });
      } catch (e) {
        console.warn('Local video generation failed', e);
        await serverSupabase.from('gen_jobs').update({ status: 'failed', error_text: String(e) }).eq('id', job.id);
        return NextResponse.json({ error: 'Free-tier video generation is temporarily unavailable (Hugging Face and your self-hosted server both failed or are unreachable).' }, { status: 502 });
      }
    }

    if (!videoBuffer) {
      await serverSupabase.from('gen_jobs').update({ status: 'failed', error_text: 'No output' }).eq('id', job.id);
      return NextResponse.json({ error: 'Video generation returned no output.' }, { status: 500 });
    }

    const filename = \`\${ownerId ?? 'guest'}/projects/\${projectId}/videos/\${job.id}-\${Date.now()}.mp4\`;
    const { error: uploadError } = await serverSupabase.storage.from(bucket).upload(filename, videoBuffer, { contentType: 'video/mp4' });
    if (uploadError) throw uploadError;
    const publicUrl = serverSupabase.storage.from(bucket).getPublicUrl(filename).publicUrl;

    const { data: asset } = await serverSupabase.from('assets').insert([{
      project_id: projectId,
      owner_id: ownerId,
      kind: 'video',
      provider: 'huggingface',
      provider_payload: { prompt, moderation: mod },
      storage_path: filename,
      filename,
      mime_type: 'video/mp4'
    }]).select('*').single();

    await serverSupabase.from('gen_jobs').update({ status: 'completed', progress: 100, output: { asset, publicUrl, moderation: mod } }).eq('id', job.id);
    return NextResponse.json({ success: true, asset, publicUrl });
  } catch (err) {
    console.error('Video generation error', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
`,

  // README
  'README.md': `# Peace AI Studio (PeaceStories Studio)

Scaffold for an AI creative app built with Next.js (app router) and Supabase.

Quickstart:
1. Create a Supabase project and run db/schema.sql in SQL editor.
2. Create a storage bucket (name must match SUPABASE_STORAGE_BUCKET).
3. Create .env.local (use generate-env.js created by the generator).
4. npm ci
5. npm run dev

Do NOT commit .env.local or any secrets. See .env.example for required variables.

## API keys
Never put real API keys in your source code or commit them to GitHub.
- Local development: put them in .env.local (already covered by .gitignore).
- Production: set them as environment variables in your hosting platform's
  dashboard (Vercel, Netlify, etc.), not in a file in the repo.
- If a key is ever pushed to GitHub by mistake, rotate/regenerate it right
  away rather than just deleting the commit.

## Free image & video generation
This project defaults to the free Hugging Face Inference API for both
image and video generation (HUGGINGFACE_API_KEY). No other provider is
required to get started.

Realistic expectations:
- Free tier requests can be rate-limited or hit a "cold start" delay
  (the model has to spin up) on the first request.
- Free-tier video generation is genuinely limited industry-wide: expect
  short, low-resolution clips rather than cinematic quality. There is
  currently no fully-free provider that matches paid tools like Runway
  or Pika.
- A paid fallback (Replicate) exists in the code for images but is
  disabled by default. Set ENABLE_PAID_PROVIDERS=true only if you're
  comfortable being billed per generation.
`,

  // helper scripts that the generator will also create
  'generate-env.js': `#!/usr/bin/env node
// generate-env.js
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

async function main() {
  const examplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(examplePath)) {
    console.error('.env.example not found.');
    process.exit(1);
  }
  const content = fs.readFileSync(examplePath, 'utf8');
  const lines = content.split(/\\r?\\n/);
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      entries.push({ raw: line, type: 'comment' });
      continue;
    }
    const eq = line.indexOf('=');
    if (eq === -1) {
      entries.push({ raw: line, type: 'comment' });
      continue;
    }
    const key = line.slice(0, eq).trim();
    const exampleVal = line.slice(eq + 1);
    entries.push({ raw: line, type: 'env', key, exampleVal });
  }

  const rl = readline.createInterface({ input, output, terminal: true });
  const outLines = [];

  console.log('Generating .env.local from .env.example. Press Enter to leave blank.');

  for (const e of entries) {
    if (e.type === 'comment') {
      outLines.push(e.raw);
      continue;
    }
    const { key, exampleVal } = e;
    let prompt = \`Enter value for \${key}\`;
    if (exampleVal) prompt += \` (example: \${exampleVal.slice(0, 40)})\`;
    prompt += ': ';
    const answer = await rl.question(prompt);
    outLines.push(\`\${key}=\${answer}\`);
  }

  rl.close();
  const outPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(outPath, outLines.join('\\n'), 'utf8');
  console.log('.env.local written. Do NOT commit this file.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
`,

  'verify-local.js': `#!/usr/bin/env node
// verify-local.js
const base = process.argv[2] || 'http://localhost:3000';
const timeout = 20000;

async function okFetch(url, opts) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function run() {
  console.log('Verifying Peace AI Studio at', base);
  try {
    console.log('GET / ... ');
    let r = await okFetch(base + '/');
    console.log('status', r.status);

    console.log('GET /api/settings/providers ... ');
    r = await okFetch(base + '/api/settings/providers');
    console.log('status', r.status, 'body:', await r.text());

    console.log('POST /api/moderate (safe) ... ');
    r = await okFetch(base + '/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A scenic mountain at sunrise' })
    });
    console.log('status', r.status, 'body:', await r.text());

    console.log('POST /api/moderate (sensitive) ... ');
    r = await okFetch(base + '/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Two adults kissing at sunset' })
    });
    console.log('status', r.status, 'body:', await r.text());

    console.log('POST /api/generate/image (smoke) ... ');
    r = await okFetch(base + '/api/generate/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A colorful abstract painting', projectId: 'test', ownerId: null, aspect: '1:1', count: 1 })
    });
    console.log('status', r.status, 'body:', await r.text());

    console.log('\\nSmoke tests completed.');
  } catch (e) {
    console.error('Error during verification:', e.message || e);
    process.exit(1);
  }
}

run();`,

  // small supporting admin and projects endpoints (minimal)
  'app/api/settings/providers/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  const statuses = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
    local_ai: Boolean(process.env.LOCAL_AI_URL),
    replicate: Boolean(process.env.REPLICATE_API_TOKEN),
    paid_providers_enabled: process.env.ENABLE_PAID_PROVIDERS === 'true',
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    assemblyai: Boolean(process.env.ASSEMBLYAI_API_KEY)
  };
  return NextResponse.json({ statuses });
}
`,

  'app/api/projects/route.ts': `import { NextResponse } from 'next/server';
import { serverSupabase } from '../../../lib/serverSupabase';

export async function POST(req) {
  try {
    const { ownerId, title, description } = await req.json();
    if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    const { data } = await serverSupabase.from('projects').insert([{ owner_id: ownerId, title: title ?? 'Untitled Project', description: description ?? '' }]).select('*').single();
    return NextResponse.json({ success: true, project: data });
  } catch (err) {
    console.error('Create project error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get('ownerId');
    if (!ownerId) return NextResponse.json({ error: 'ownerId query required' }, { status: 400 });
    const { data } = await serverSupabase.from('projects').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false });
    return NextResponse.json({ projects: data });
  } catch (err) {
    console.error('List projects error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
`,

  'app/api/assets/route.ts': `import { NextResponse } from 'next/server';
import { serverSupabase } from '../../../lib/serverSupabase';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get('ownerId');
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 });
    const { data } = await serverSupabase.from('assets').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(200);
    return NextResponse.json({ assets: data });
  } catch (err) {
    console.error('List assets error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
`,

};

console.log('Creating project files...');
for (const [p, content] of Object.entries(files)) {
  write(p, content);
}

// create directories used by app that may be empty in map
['components', 'lib/ai', 'db', 'app/(auth)', 'app/studio', 'app/api'].forEach((d) => fs.mkdirSync(d, { recursive: true }));

console.log('\\nAll files created. Next steps:');
console.log('1) Run: node generate-env.js  (in the Codespace terminal) to create .env.local interactively.');
console.log('2) Run: npm ci');
console.log('3) Run: npm run dev  (open the forwarded port in Codespaces)');
console.log('4) Optionally run: node verify-local.js http://localhost:3000');
console.log('\\nDo NOT paste API keys into public chat. Place them in .env.local inside Codespaces as prompted.');
