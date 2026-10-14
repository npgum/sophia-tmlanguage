#!/usr/bin/env node
// Grammar validation: tokenize sample.aes through the real TextMate engine
// and assert key scopes appear. Exits non-zero on failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

// vscode-textmate is CJS
const textmate = require('vscode-textmate');
const { Registry, INITIAL } = textmate;

// vscode-oniguruma: load WASM first, then use its scanner factories
const oniguruma = require('vscode-oniguruma');
const wasmBin = readFileSync(join(HERE, '..', 'node_modules/vscode-oniguruma/release/onig.wasm'));
await oniguruma.loadWASM(wasmBin);

const grammarContent = readFileSync(join(HERE, '..', 'grammars/sophia.tmLanguage.json'), 'utf8');

const registry = new Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (s) => oniguruma.createOnigScanner(s),
    createOnigString: (s) => oniguruma.createOnigString(s),
  }),
  loadGrammar: async () => JSON.parse(grammarContent),
});

const g = await registry.loadGrammar('source.sophia');
if (!g) { console.error('FAIL: grammar did not load'); process.exit(1); }

const source = readFileSync(join(HERE, 'sample.aes'), 'utf8');
const lines = source.split('\n');

const scopesFound = new Map();
let ruleStack = INITIAL;
for (const line of lines) {
  const tokenized = g.tokenizeLine(line, ruleStack);
  ruleStack = tokenized.ruleStack;
  for (const tok of tokenized.tokens) {
    const sc = tok.scopes.join(' ');
    scopesFound.set(sc, (scopesFound.get(sc) || 0) + 1);
  }
}

const allScopes = [...scopesFound.keys()].join('\n');

const checks = [
  ['comment.line.double-slash.sophia', 'line comments'],
  ['comment.block.sophia', 'block comments (nested handled by grammar)'],
  ['keyword.declaration.contract.sophia', 'contract declaration'],
  ['entity.name.type.contract.sophia', 'contract name'],
  ['entity.name.type.sophia', 'type alias name'],
  ['keyword.declaration.type.sophia', 'type/record/datatype declarations'],
  ['entity.name.function.sophia', 'function names'],
  ['keyword.declaration.function.sophia', 'function keyword'],
  ['storage.modifier.sophia', 'payable/stateful/private modifiers'],
  ['keyword.declaration.let.sophia', 'let bindings'],
  ['variable.other.type.sophia', "type variables ('a)"],
  ['entity.name.type.constructor.sophia', 'constructors (uppercase)'],
  ['variable.other.qualified.sophia', 'qualified identifiers (Map.member)'],
  ['constant.numeric.hex.sophia', 'hex literals'],
  ['constant.numeric.integer.sophia', 'decimal literals with _ separators'],
  ['constant.numeric.bytes.sophia', 'byte literals (#hex)'],
  ['string.quoted.double.sophia', 'strings'],
  ['constant.character.escape.sophia', 'string escapes'],
  ['string.quoted.single.sophia', 'char literals'],
  ['constant.other.address.account.sophia', 'ak_ addresses'],
  ['constant.other.address.contract.sophia', 'ct_ addresses'],
  ['constant.other.address.oracle.sophia', 'ok_ addresses'],
  ['constant.other.oracle-query-id.sophia', 'oq_ addresses'],
  ['keyword.control.sophia', 'if/elif/else/switch'],
  ['keyword.operator.arrow.sophia', '=> and <-'],
  ['keyword.operator.comparison.sophia', 'comparison operators'],
  ['keyword.operator.arithmetic.sophia', 'arithmetic operators'],
  ['keyword.operator.list.sophia', ':: and ++'],
  ['keyword.operator.range.sophia', '.. range'],
  ['keyword.operator.assignment.sophia', '= assignment'],
  ['keyword.operator.logical.sophia', 'logical operators'],
  ['constant.language.sophia', 'true/false/unit'],
];

let failed = 0;
for (const [scope, label] of checks) {
  const ok = allScopes.includes(scope);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42)} ${scope}`);
  if (!ok) failed++;
}

const totalTokens = [...scopesFound.values()].reduce((a, b) => a + b, 0);
console.log(`\ntotal tokens: ${totalTokens}, distinct scope stacks: ${scopesFound.size}`);
if (totalTokens < 100) { console.error('FAIL: suspiciously few tokens'); failed++; }

console.log(failed === 0 ? '\nALL GRAMMAR CHECKS PASS' : `\n${failed} CHECKS FAILED`);
process.exit(failed === 0 ? 0 : 1);
