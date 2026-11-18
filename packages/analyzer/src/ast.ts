import ts from 'typescript';

export interface AstSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'method';
  file: string;
  line: number;
  exported: boolean;
}

export interface AstDependency {
  from: string;
  to: string;
}

export interface AstModuleGraph {
  symbols: AstSymbol[];
  dependencies: AstDependency[];
  symbolIndex: Map<string, AstSymbol[]>;
}

export interface RelevantCodeLocation {
  path: string;
  matchedSymbols: string[];
  score: number;
  reason: string;
}

export class AstCodebaseAnalyzer {
  /**
   * Checks whether the file extension is supported for TypeScript/JavaScript AST parsing.
   */
  isSupportedFile(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(filePath) && !filePath.endsWith('.d.ts');
  }

  /**
   * Parses a single source file into an AST and extracts defined symbols and imports.
   */
  analyzeSourceCode(
    filePath: string,
    code: string
  ): { symbols: AstSymbol[]; dependencies: AstDependency[] } {
    const symbols: AstSymbol[] = [];
    const dependencies: AstDependency[] = [];

    const sourceFile = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const visit = (node: ts.Node) => {
      // 1. Detect Import Declarations
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          dependencies.push({
            from: filePath,
            to: node.moduleSpecifier.text,
          });
        }
      }

      // Check for export modifier
      const isExported = Boolean(
        ts.canHaveModifiers(node) &&
        ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      );

      // 2. Functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        symbols.push({
          name: node.name.text,
          kind: 'function',
          file: filePath,
          line,
          exported: isExported,
        });
      }

      // 3. Classes & Methods
      if (ts.isClassDeclaration(node) && node.name) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        symbols.push({
          name: node.name.text,
          kind: 'class',
          file: filePath,
          line,
          exported: isExported,
        });

        // Scan member methods
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
            const memberLine = sourceFile.getLineAndCharacterOfPosition(member.getStart()).line + 1;
            symbols.push({
              name: member.name.text,
              kind: 'method',
              file: filePath,
              line: memberLine,
              exported: isExported,
            });
          }
        }
      }

      // 4. Interfaces
      if (ts.isInterfaceDeclaration(node) && node.name) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        symbols.push({
          name: node.name.text,
          kind: 'interface',
          file: filePath,
          line,
          exported: isExported,
        });
      }

      // 5. Type Aliases
      if (ts.isTypeAliasDeclaration(node) && node.name) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        symbols.push({
          name: node.name.text,
          kind: 'type',
          file: filePath,
          line,
          exported: isExported,
        });
      }

      // 6. Exported Variables / Arrow Functions
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            const line = sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1;
            symbols.push({
              name: decl.name.text,
              kind: 'variable',
              file: filePath,
              line,
              exported: isExported,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return { symbols, dependencies };
  }

  /**
   * Builds an indexed module graph across multiple files.
   */
  buildModuleGraph(files: Map<string, string>): AstModuleGraph {
    const allSymbols: AstSymbol[] = [];
    const allDependencies: AstDependency[] = [];
    const symbolIndex = new Map<string, AstSymbol[]>();

    for (const [filePath, content] of files.entries()) {
      if (!this.isSupportedFile(filePath)) continue;
      const { symbols, dependencies } = this.analyzeSourceCode(filePath, content);
      allSymbols.push(...symbols);
      allDependencies.push(...dependencies);

      for (const sym of symbols) {
        const lowerName = sym.name.toLowerCase();
        if (!symbolIndex.has(lowerName)) {
          symbolIndex.set(lowerName, []);
        }
        symbolIndex.get(lowerName)!.push(sym);
      }
    }

    return {
      symbols: allSymbols,
      dependencies: allDependencies,
      symbolIndex,
    };
  }

  /**
   * Connects issue descriptions (title, body, error messages) to relevant code locations.
   */
  findRelevantCodeLocations(queryText: string, graph: AstModuleGraph): RelevantCodeLocation[] {
    // Extract potential code identifiers (CamelCase, snake_case, alphanumeric identifier tokens)
    const tokens = new Set<string>();
    const matches = queryText.match(/[a-zA-Z_$][a-zA-Z0-9_$]{2,}/g) || [];
    for (const m of matches) {
      tokens.add(m.toLowerCase());
    }

    const fileScores = new Map<string, { matchedSymbols: Set<string>; score: number }>();

    for (const token of tokens) {
      const directHits = graph.symbolIndex.get(token) || [];
      const partialHits: AstSymbol[] = [];

      if (token.length >= 4) {
        for (const [symKey, symList] of graph.symbolIndex.entries()) {
          if (symKey !== token && (symKey.includes(token) || token.includes(symKey))) {
            partialHits.push(...symList);
          }
        }
      }

      const allHits = [...directHits, ...partialHits];
      for (const hit of allHits) {
        if (!fileScores.has(hit.file)) {
          fileScores.set(hit.file, { matchedSymbols: new Set(), score: 0 });
        }
        const rec = fileScores.get(hit.file)!;
        rec.matchedSymbols.add(hit.name);
        rec.score += hit.exported ? 10 : 5;
      }
    }

    const results: RelevantCodeLocation[] = [];
    for (const [filePath, data] of fileScores.entries()) {
      const symbolsArr = Array.from(data.matchedSymbols);
      results.push({
        path: filePath,
        matchedSymbols: symbolsArr,
        score: data.score,
        reason: `AST analysis matched ${symbolsArr.length} referenced symbols (${symbolsArr.slice(0, 3).join(', ')}${symbolsArr.length > 3 ? '...' : ''})`,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

export const defaultAstAnalyzer = new AstCodebaseAnalyzer();
