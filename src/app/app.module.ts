import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './__core/core.module';
import { SharedModule } from './__shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { UtilityService } from "./__core/utility.service";


import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor';


// _layouts
import { AdminComponent } from "./_layouts/admin/admin.component";
import { AuthComponent } from "./_layouts/auth/auth.component";

// _admin views

// _auth views
import { FileManagerComponent } from './views/_auth/file-manager/file-manager.component';
import { IDEComponent } from "./views/_auth/ide/ide.component";
import { ProfileComponent } from "./views/_auth/profile/profile.component";

// no _layouts views
import { LoginComponent } from "./views/login/login.component";
import { RegisterComponent } from "./views/register/register.component";
import { ForgotPasswordComponent } from "./views/forgot-password/forgot-passwordComponent";

// Index
import { IndexComponent } from "./views/_index/index.component";


import { LandingComponent } from "./views/landing/landing.component";

import { AdminNavbarComponent } from "./components/navbars/admin-navbar/admin-navbar.component";
import { AuthNavbarComponent } from "./components/navbars/auth-navbar/auth-navbar.component";
import { FooterAdminComponent } from "./components/footers/footer-admin/footer-admin.component";
import { FooterComponent } from "./components/footers/footer/footer.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";

import { PipelinePixiComponent } from './components/pipeline-pixi/pipeline-pixi.component';
import { MonacoEditorComponent } from './components/monaco-editor/monaco-editor.component';
import { XtermComponent } from './components/xterm/xterm.component';

import { AsideLeftComponent } from './components/aside/aside-left/aside-left.component';
import { AsideRightComponent } from './components/aside/aside-right/aside-right.component';

import { DxFileManagerModule, DxListModule, DxPopupModule, DxToolbarModule } from "devextreme-angular";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function myMonacoLoad() {

  // Register a new language
  (window as any).monaco.languages.register({id: 'thumderLanguage'});

  // Register a tokens provider for the language
  (window as any).monaco.languages.setMonarchTokensProvider('thumderLanguage', {
    tokenizer: {
      root: [
        [/(r[0-9]{1,2}|R[0-9]{1,2})/, "custom-register.integer"],
        [/(f[0-9]{1,2}|F[0-9]{1,2})/, "custom-register.float"],
        [/(d0|d2|d4|d6|d8|d10|d12|d14|d16|d18|d20|d22|d24|d26|d28|d30|D0|D2|D4|D6|D8|D10|D12|D14|D16|D18|D20|D22|D24|D26|D28|D30)/, "custom-register.decimal"],
        [/(pc|imar|ir|a|ahi|b|bhi|bta|alu|aluhi|fpsr|dmar|sdr|sdrhi|ldr|ldrhi|PC|IMAR|IR|A|AHI|B|BHI|BTA|ALU|ALUHI|FPSR|DMAR|SDR|SDRHI|LDR|LDRHI)/, "custom-register.words"],
        [/\.(data|text|word|space)/, "custom-words"],
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
      {foreground: 'a08800', token: 'custom-register.decimal'},
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
      for (let modifier of modifiers) {
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

const monacoConfig: NgxMonacoEditorConfig = {
  defaultOptions: {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    glyphMargin: true
  },
  onMonacoLoad: myMonacoLoad
};

@NgModule({
  declarations: [
    AppComponent,

    SidebarComponent,
    FooterComponent,
    FooterAdminComponent,

    AuthNavbarComponent,
    AdminNavbarComponent,

    AdminComponent,
    AuthComponent,

    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    IndexComponent,
    LandingComponent,
    ProfileComponent,

    IDEComponent,
    MonacoEditorComponent,
    XtermComponent,
    FileManagerComponent,
    AsideLeftComponent,
    AsideRightComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,

    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MonacoEditorModule.forRoot(monacoConfig),


    DxToolbarModule,
    DxListModule,
    DxFileManagerModule,
    DxPopupModule,
    // use forRoot() in main app module only.
  ],
  providers: [AppComponent, UtilityService],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
