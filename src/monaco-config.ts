import {AppConfig} from "./environments/environment";

const MonacoConfig: any = {
  baseUrl: AppConfig.production ? './assets' : '',
  defaultOptions: {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    glyphMargin: true
  },
  onMonacoLoad: function () {

    // Register a new language
    (window as any).monaco.languages.register({id: 'thumderLanguage'});

    // Register a tokens provider for the language
    (window as any).monaco.languages.setMonarchTokensProvider('thumderLanguage', {
      tokenizer: {
        root: [
          [/\b(R0|R1|R2|R3|R4|R5|R6|R7|R8|R9|R10|R11|R12|R13|R14|R15|R16|R17|R18|R19|R20|R21|R22|R23|R24|R25|R26|R27|R28|R29|R30|R31)\b/i, "custom-register.integer"],
          [/\b(F0|F1|F2|F3|F4|F5|F6|F7|F8|F9|F10|F11|F12|F13|F14|F15|F16|F17|F18|F19|F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F30|F31)\b/i, "custom-register.float"],
          [/\b(D0|D2|D4|D6|D8|D10|D12|D14|D16|D18|D20|D22|D24|D26|D28|D30)\b/i, "custom-register.double"],
          [/(pc|imar|ir|a|ahi|b|bhi|bta|alu|aluhi|fpsr|dmar|sdr|sdrhi|ldr|ldrhi|PC|IMAR|IR|A|AHI|B|BHI|BTA|ALU|ALUHI|FPSR|DMAR|SDR|SDRHI|LDR|LDRHI)/, "custom-register.words"],
          [/\.(align|ascii|asciiz|byte|double|float|global|space|word|data|text)/, "custom-words"],
          [/#[0-9]+/, "custom-numbers"],
          [/^\S+:$/, "custom-function"],
          [/(;|(^|\s)#\s).*$/, "custom-comment.line"],
          [/\(.*\)/, "custom-iterator"],
        ]
      }
    });

    // Define a new theme that contains only rules that match this language
    (window as any).monaco.editor.defineTheme('thumderTheme', {
      colors: undefined,
      encodedTokensColors: [],
      base: 'vs',
      inherit: false,
      rules: [
        {foreground: 'a08000', token: 'custom-register.integer'},
        {foreground: 'a08400', token: 'custom-register.float'},
        {foreground: 'a08800', token: 'custom-register.double'},
        // {foreground: '008800', token: 'custom-register.words' },
        {foreground: '008800', token: 'custom-comment.line'},
        {foreground: '990000', token: 'custom-function'},
        {foreground: '686868', token: 'custom-numbers'},
        {foreground: 'ffa500', token: 'custom-iterator'},
        {foreground: 'ffa500', token: 'custom-words'},
      ]
    });

    // Register a completion item provider for the new language
    (window as any).monaco.languages.registerCompletionItemProvider('thumderLanguage', {
      provideCompletionItems: (model, position, context, token) => {

        const completionListItem: any[] = [
          {
            label: 'add',
            kind: (window as any).monaco.languages.CompletionItemKind.Text,
            insertText: 'add R0, R1, R2',
            insertTextRules: (window as any).monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Suma R1 y R2 y lo guarda en R0'
          },
          {
            label: 'function',
            kind: (window as any).monaco.languages.CompletionItemKind.Function,
            insertText: '${1:pattern}:',
            insertTextRules: (window as any).monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: ''
          },
          {
            label: 'jump',
            kind: (window as any).monaco.languages.CompletionItemKind.Keyword,
            insertText: 'j ${1:condition}',
            insertTextRules: (window as any).monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          },
          {
            label: 'ifelse',
            kind: (window as any).monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'if (${1:condition}) {',
              '\t$0',
              '} else {',
              '\t',
              '}'
            ].join('\n'),
            insertTextRules: (window as any).monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'If-Else Statement'
          }
        ];

        return {
          suggestions: completionListItem
        };
      }
    });

    const legend = {
      tokenTypes: [
        'ADD',
      ],
      tokenModifiers: []
    };

    /** @type {(type: string)=>number} */
    function getType(type) {
      return legend.tokenTypes.indexOf(type);
    }

    /** @type {(modifier: string[]|string|null)=>number} */
    function getModifier(modifiers) {
      if (typeof modifiers === 'string') {
        modifiers = [modifiers];
      }
      if (Array.isArray(modifiers)) {
        let nModifiers = 0;
        let nModifier = 0;
        for (const modifier of modifiers) {
          nModifier = legend.tokenModifiers.indexOf(modifier);
          if (nModifier > -1) {
            nModifiers |= (1 << nModifier) >>> 0;
          }
        }
        return nModifiers;
      } else {
        return 0;
      }
    }

    const tokenPattern = new RegExp('([a-zA-Z]+)((?:\\.[a-zA-Z]+)*)', 'g');

    (window as any).monaco.languages.registerDocumentSemanticTokensProvider('plaintext', {
      getLegend: () => {
        return legend;
      },
      provideDocumentSemanticTokens: (model, lastResultId, token) => {
        const lines = model.getLinesContent();

        /** @type {number[]} */
        const data = [];

        let prevLine = 0;
        let prevChar = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (let match = null; match = tokenPattern.exec(line);) {
            // translate token and modifiers to number representations
            let type = getType(match[1]);
            if (type === -1) {
              continue;
            }
            let modifier = match[2].length
              ? getModifier(match[2].split('.').slice(1))
              : 0;

            data.push(
              // translate line to deltaLine
              i - prevLine,
              // for the same line, translate start to deltaStart
              prevLine === i ? match.index - prevChar : match.index,
              match[0].length,
              type,
              modifier
            );

            prevLine = i;
            prevChar = match.index;
          }
        }
        return {
          data: new Uint32Array(data),
          resultId: null
        };
      },
      releaseDocumentSemanticTokens: (resultId) => {
      }
    });
  }
};

export default MonacoConfig;
