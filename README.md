# sophia-tmlanguage

TextMate grammar for the **Sophia** smart contract language of the
[aeternity](https://aeternity.com) blockchain, with full coverage of the
**v6.1.0** syntax specification.

Used by Linguist (GitHub syntax highlighting) via the `vendor/grammars/sophia`
submodule.

## Coverage

- Comments: `//` line comments and nestable `/* */` block comments
- Keywords: control (`if`, `elif`, `else`, `switch`), declaration
  (`contract`, `namespace`, `type`, `record`, `datatype`, `entrypoint`,
  `function`, `let`, `include`, `import`), modifiers (`payable`, `stateful`,
  `private`), constants (`true`, `false`, `unit`)
- Identifiers: lowercase `Id`, uppercase `Con` constructors, qualified
  `QId`/`QCon` (`Map.member`, `AELib.Token`), type variables (`'a`)
- Literals: integers (decimal with `_` separators, `0x` hex), byte arrays
  (`#00abc123`), strings with the full escape set (`\b \t \n \v \f \r \e
  \xHex`), char literals, base58 chain identifiers (`ak_`, `ct_`, `ok_`,
  `oq_`)
- Declaration scoping: contract/namespace/type/record/datatype/entrypoint/
  function/let bindings highlighted at line start per Sophia's layout rules
- Operators with correct scope separation: `=>`, `<-`, comparison, logical,
  list (`::`, `++`), arithmetic, range (`..`), tuple (`*`)

## Files

- `grammars/sophia.tmLanguage.json` — the grammar (JSON TextMate format)

## License

MIT
