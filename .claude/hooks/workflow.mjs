// Hooks del flujo de trabajo de Claude Code para TesloShop.
// Uso: node workflow.mjs <session-start|prompt-submit|pre-edit|pre-bash>
//      node workflow.mjs smoke-ok "<qué se validó>"   (comando manual, no es un hook)
// Los hooks leen el JSON del evento por stdin. Ante cualquier error inesperado dejan pasar (fail-open).

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONTEXT_DIR = path.join(PROJECT_DIR, '.claude', 'context');
const CONTEXT_FILE = path.join(CONTEXT_DIR, 'project-context.md');
const REVIEW_FILE = path.join(CONTEXT_DIR, 'review-approved.json');
const SMOKE_FILE = path.join(CONTEXT_DIR, 'smoke-approved.json');
const SRC_DIR = 'src';
const MAIN = 'main';

// ---------- utilidades ----------

function git(args, timeout = 5000) {
  const result = spawnSync('git', args, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    timeout,
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

/** Rama actual; '' si HEAD está detached; null si git falla. */
function currentBranch() {
  return git(['branch', '--show-current']);
}

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function deny(reason) {
  return { decision: 'deny', reason };
}

function ask(reason) {
  return { decision: 'ask', reason };
}

function emitPreToolDecision({ decision, reason }) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
}

// ---------- session-start ----------

function readLastCommit() {
  if (!existsSync(CONTEXT_FILE)) return null;
  const match = readFileSync(CONTEXT_FILE, 'utf8').match(/^last_commit:\s*([0-9a-f]{7,40})\s*$/m);
  return match ? match[1] : null;
}

function sessionStart() {
  git(['fetch', 'origin', MAIN, '--quiet'], 8000);
  const ref = git(['rev-parse', '--verify', '--quiet', `origin/${MAIN}`]) ? `origin/${MAIN}` : MAIN;
  const tip = git(['rev-parse', ref]);
  if (!tip) return;

  const branch = currentBranch() || '(HEAD detached)';
  const lastCommit = readLastCommit();
  if (!lastCommit) {
    console.log(
      'No existe el contexto del proyecto: ejecuta el sub-agente git-context antes de planear o cambiar algo.',
    );
    return;
  }

  const last = git(['rev-parse', '--verify', '--quiet', `${lastCommit}^{commit}`]);
  if (last === tip) {
    console.log(`Contexto del proyecto al día con ${ref} (${tip.slice(0, 7)}). Rama actual: ${branch}.`);
    return;
  }

  const count = last ? git(['rev-list', '--count', `${last}..${ref}`]) : null;
  const detail = count
    ? `Hay ${count} commit${count === '1' ? '' : 's'} nuevo${count === '1' ? '' : 's'} en ${MAIN}`
    : `El historial de ${MAIN} cambió`;
  console.log(
    `${detail} desde ${lastCommit.slice(0, 7)}: ejecuta el sub-agente git-context antes de planear o cambiar algo. Rama actual: ${branch}.`,
  );
}

// ---------- prompt-submit ----------

function promptSubmit(input) {
  if (input.permission_mode !== 'plan') return;
  console.log(
    'Modo plan: usa la skill grilling para las decisiones abiertas (cada pregunta con respuesta recomendada; AskUserQuestion si las opciones son cerradas), ' +
      'angular-developer para el enfoque Angular (v20.3, Karma + Jasmine; ignora Vitest y Signal Forms) y frontend-design si la feature toca UI. ' +
      'Antes de planear, confirma que git-context se ejecutó.',
  );
}

// ---------- pre-edit ----------

function normalize(p) {
  const resolved = path.resolve(PROJECT_DIR, p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isInside(dir, target) {
  const rel = path.relative(normalize(dir), normalize(target));
  return rel === '' || (rel.split(path.sep)[0] !== '..' && !path.isAbsolute(rel));
}

function preEdit(input) {
  if (process.env.CLAUDE_ALLOW_MAIN_EDITS === '1') return;
  const target = input.tool_input?.file_path || input.tool_input?.notebook_path;
  if (!target) return;
  if (!isInside(PROJECT_DIR, target) || isInside(CONTEXT_DIR, target)) return;
  if (currentBranch() !== MAIN) return; // otra rama, HEAD detached ('') o git falló (null)
  emitPreToolDecision(
    deny('Estás en main: ejecuta el sub-agente git-branch para crear la rama de trabajo antes de editar.'),
  );
}

// ---------- smoke en navegador ----------

/**
 * Huella del contenido de `src/`: incluye archivos versionados y sin versionar (no ignorados),
 * así que no cambia cuando git-review hace stage de las rutas entre el smoke y el commit.
 * null si git falla.
 */
function srcDigest() {
  const listed = git(['ls-files', '-c', '-o', '--exclude-standard', '--', SRC_DIR], 10000);
  if (listed === null) return null;

  const digest = createHash('sha256');
  for (const file of listed.split('\n').map((line) => line.trim()).filter(Boolean).sort()) {
    digest.update(`${file}\0`);
    try {
      digest.update(createHash('sha256').update(readFileSync(path.join(PROJECT_DIR, file))).digest('hex'));
    } catch {
      digest.update('ausente'); // p. ej. versionado pero borrado del working tree
    }
    digest.update('\0');
  }
  return digest.digest('hex');
}

/** Registra que el smoke en navegador pasó para el estado actual de `src/`. */
function smokeOk() {
  const digest = srcDigest();
  if (!digest) {
    console.log('No se pudo calcular la huella de src/: comprueba que git funcione en el proyecto.');
    return;
  }

  const record = {
    branch: currentBranch(),
    src_digest: digest,
    checked_at: new Date().toISOString(),
    notes: process.argv.slice(3).join(' ').trim() || null,
  };
  mkdirSync(CONTEXT_DIR, { recursive: true });
  writeFileSync(SMOKE_FILE, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  console.log(
    `Smoke registrado para ${record.branch || '(HEAD detached)'} (src ${digest.slice(0, 12)}) en ${SMOKE_FILE}.`,
  );
}

/** true si el índice tiene cambios en `src/` respecto de HEAD. */
function indexTouchesSrc() {
  return Boolean(git(['diff', '--cached', '--name-only', 'HEAD', '--', SRC_DIR]));
}

function smokeMatchesSrc() {
  try {
    if (!existsSync(SMOKE_FILE)) return false;
    const smoke = JSON.parse(readFileSync(SMOKE_FILE, 'utf8'));
    return smoke.branch === currentBranch() && smoke.src_digest === srcDigest();
  } catch {
    return true; // fail-open: no poder leer la marca no debe bloquear el commit
  }
}

function checkSmoke() {
  if (process.env.CLAUDE_SKIP_SMOKE === '1') return null;
  if (!indexTouchesSrc() || smokeMatchesSrc()) return null;
  return deny(
    'Los cambios de src/ no pasaron el smoke en navegador: levanta la app, valídala con la extensión de Chrome ' +
      'y ejecuta `node .claude/hooks/workflow.mjs smoke-ok "<qué validaste>"` antes de commitear.',
  );
}

// ---------- pre-bash ----------

const GIT_COMMIT_OR_PUSH = /\bgit((?:\s+-[Cc]\s+\S+|\s+--[\w-]+(?:=\S+)?)*)\s+(commit|push)\b(.*)$/;

// Flags de `git commit` que toman un valor como token siguiente.
const COMMIT_VALUE_FLAGS = new Set([
  '-m', '-F', '-C', '-c', '-t', '--message', '--file', '--reuse-message', '--reedit-message',
  '--template', '--author', '--date', '--cleanup', '--fixup', '--squash', '--trailer',
]);
const COMMIT_FORBIDDEN = new Set([
  '--amend', '--all', '--no-verify', '--only', '--include', '--patch', '--interactive',
]);
const COMMIT_FORBIDDEN_SHORT = /^-[A-Za-z]*[anoip]/; // -a, -am, -n, -o, -i, -p

const PUSH_FORBIDDEN = new Set([
  '--force', '--force-with-lease', '--force-if-includes', '--mirror', '--all', '--branches',
  '--delete', '--prune',
]);
const PUSH_FORBIDDEN_SHORT = /^-[A-Za-z]*[fd]/; // -f, -d, -uf

/** Quita heredocs, here-strings y textos entre comillas para no confundir mensajes con comandos. */
function stripLiterals(command) {
  return command
    .replace(/<<-?[ \t]*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*\r?(?=\n|$)/g, ' $3')
    .replace(/@(['"])[ \t]*\r?\n[\s\S]*?\r?\n\1@/g, ' ')
    .replace(/"((?:[^"\\`]|\\[\s\S]|`[\s\S])*)"/g, (_, text) => (/\s/.test(text) ? '""' : text))
    .replace(/'([^']*)'/g, (_, text) => (/\s/.test(text) ? "''" : text));
}

function splitSegments(command) {
  return stripLiterals(command).split(/&&|\|\||[;|\n]/);
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function forbiddenCommitArg(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const flag = arg.split('=')[0];
    if (COMMIT_VALUE_FLAGS.has(arg)) {
      i++; // salta el valor
      continue;
    }
    if (arg === '--') return '-- <pathspec>';
    if (COMMIT_FORBIDDEN.has(flag)) return flag;
    if (!arg.startsWith('--') && COMMIT_FORBIDDEN_SHORT.test(arg)) return arg;
    if (!arg.startsWith('-') && arg !== '""' && arg !== "''") return `con pathspec (${arg})`;
  }
  return null;
}

function reviewMatchesIndex() {
  try {
    if (!existsSync(REVIEW_FILE)) return false;
    const review = JSON.parse(readFileSync(REVIEW_FILE, 'utf8'));
    return (
      review.branch === currentBranch() &&
      review.head === git(['rev-parse', 'HEAD']) &&
      review.tree === git(['write-tree'])
    );
  } catch {
    return false;
  }
}

function checkCommit(args) {
  if (process.env.CLAUDE_SKIP_REVIEW === '1') return null;
  const problem = forbiddenCommitArg(args);
  if (problem) {
    return deny(`git commit ${problem} no está permitido: el commit lo hace git-review con el índice revisado.`);
  }
  const smokeVerdict = checkSmoke();
  if (smokeVerdict) return smokeVerdict;
  if (!reviewMatchesIndex()) {
    return deny('El índice no pasó por git-review: invoca el sub-agente git-review (modo commit) antes de commitear.');
  }
  return null;
}

function targetsMain(refspec) {
  const destination = refspec.includes(':') ? refspec.split(':').pop() : refspec;
  if (destination === 'HEAD') return currentBranch() === MAIN;
  return destination === MAIN || destination === `refs/heads/${MAIN}`;
}

function checkPush(args, segment) {
  const badFlag = args.find(
    (arg) =>
      PUSH_FORBIDDEN.has(arg.split('=')[0]) || (!arg.startsWith('--') && PUSH_FORBIDDEN_SHORT.test(arg)),
  );
  if (badFlag) {
    return deny(`git push ${badFlag} no está permitido: force, mirror y borrado de ramas están bloqueados.`);
  }

  const refspecs = args.filter((arg) => !arg.startsWith('-')).slice(1); // [0] es el remoto
  if (refspecs.some((ref) => ref.startsWith('+') || ref.startsWith(':'))) {
    return deny('Los refspecs con + (force) o : (borrado) no están permitidos.');
  }
  if (refspecs.some(targetsMain) || (refspecs.length === 0 && currentBranch() === MAIN)) {
    return deny('El push directo a main está bloqueado: sube una rama de trabajo y abre un PR.');
  }
  return ask(`Confirma el push: ${segment.trim()}`);
}

// Texto que otra capa ejecuta como comando (bash -c, pwsh -Command, eval/iex, $(...), heredocs y
// here-strings pasados a un shell, -EncodedCommand): se analiza también su contenido.
// Es best-effort: no cubre alias de git, scripts en archivos ni Start-Process; ahí la última
// barrera es el prompt de permisos.

const MAX_WRAP_DEPTH = 3;
const BEFORE_WORD = String.raw`(?:^|[\s;&|(])`;
const QUOTED = String.raw`(?:"((?:[^"\\\x60]|\\[\s\S]|\x60[\s\S])*)"|'([^']*)')`;
const WRAPPED_QUOTED = [
  new RegExp(String.raw`${BEFORE_WORD}(?:ba|z|da|k)?sh(?:\.exe)?[^\n;&|"']*?\s-[A-Za-z]*c[A-Za-z]*\s+${QUOTED}`, 'g'),
  new RegExp(String.raw`${BEFORE_WORD}(?:pwsh|powershell)(?:\.exe)?[^\n;&|"']*?\s-c[a-z]*\s+${QUOTED}`, 'gi'),
  new RegExp(String.raw`${BEFORE_WORD}(?:eval|Invoke-Expression|iex)(?:\s+-Command)?\s+${QUOTED}`, 'gi'),
];
const ENCODED_COMMAND = new RegExp(
  String.raw`${BEFORE_WORD}(?:pwsh|powershell)(?:\.exe)?[^\n;&|"']*?\s-e(?:c|nc[a-z]*)?\s+([A-Za-z0-9+/=]{8,})`,
  'gi',
);
const SUBSHELL = /\$\(([^()]*)\)|`([^`\n]*)`/g;
const HEREDOC = /([^\n]*)<<-?[ \t]*(['"]?)(\w+)\2([^\n]*)\n([\s\S]*?)\n[ \t]*\3[ \t]*\r?(?=\n|$)/g;
const HERE_STRING = /([^\n]*)@(['"])[ \t]*\r?\n([\s\S]*?)\r?\n\2@([^\n]*)/g;
const SHELL_RUNNER = /(?:^|[\s;&|(])(?:(?:ba|z|da|k)?sh|pwsh|powershell)(?:\.exe)?(?=[\s;&|)]|$)/i;
const EXPRESSION_RUNNER = /(?:^|[\s;&|(])(?:iex|Invoke-Expression|pwsh|powershell)(?:\.exe)?(?=[\s;&|)]|$)/i;

function unescapeDoubleQuoted(text) {
  return text.replace(/\\(["\\$`])/g, '$1').replace(/`(["`$])/g, '$1');
}

function wrappedCommands(command) {
  const inner = [];
  for (const pattern of WRAPPED_QUOTED) {
    for (const [, doubleQuoted, singleQuoted] of command.matchAll(pattern)) {
      inner.push(doubleQuoted !== undefined ? unescapeDoubleQuoted(doubleQuoted) : singleQuoted);
    }
  }
  for (const [, dollar, backtick] of command.matchAll(SUBSHELL)) inner.push(dollar ?? backtick);
  for (const [, encoded] of command.matchAll(ENCODED_COMMAND)) {
    inner.push(Buffer.from(encoded, 'base64').toString('utf16le'));
  }
  for (const [, before, , , after, body] of command.matchAll(HEREDOC)) {
    if (SHELL_RUNNER.test(`${before} ${after}`)) inner.push(body);
  }
  for (const [, before, , body, after] of command.matchAll(HERE_STRING)) {
    if (EXPRESSION_RUNNER.test(`${before} ${after}`)) inner.push(body);
  }
  return inner;
}

function collectCommands(command, depth = 0) {
  if (depth >= MAX_WRAP_DEPTH) return [command];
  return [command, ...wrappedCommands(command).flatMap((inner) => collectCommands(inner, depth + 1))];
}

function analyzeCommand(command) {
  const verdicts = [];
  for (const segment of splitSegments(command)) {
    const match = segment.match(GIT_COMMIT_OR_PUSH);
    if (!match) continue;
    const args = tokenize(match[3]);
    const verdict = match[2] === 'commit' ? checkCommit(args) : checkPush(args, segment);
    if (verdict) verdicts.push(verdict);
  }
  return verdicts;
}

function preBash(input) {
  const command = input.tool_input?.command;
  if (typeof command !== 'string') return;

  const verdicts = collectCommands(command).flatMap(analyzeCommand);
  const verdict = verdicts.find((v) => v.decision === 'deny') ?? verdicts.find((v) => v.decision === 'ask');
  if (verdict) emitPreToolDecision(verdict);
}

// ---------- main ----------

// Handlers de hook: reciben el JSON del evento por stdin.
const HANDLERS = {
  'session-start': sessionStart,
  'prompt-submit': promptSubmit,
  'pre-edit': preEdit,
  'pre-bash': preBash,
};

// Comandos que invoca el agente a mano: no leen stdin (bloquearía sin redirección).
const COMMANDS = {
  'smoke-ok': smokeOk,
};

const command = COMMANDS[process.argv[2]];
try {
  if (command) command();
  else HANDLERS[process.argv[2]]?.(readStdinJson());
} catch (error) {
  // fail-open: un hook roto nunca debe bloquear la sesión. Los comandos sí reportan el fallo.
  if (command) {
    console.error(`${process.argv[2]} falló: ${error.message}`);
    process.exitCode = 1;
  }
}
