import { warn } from "codemod:runtime";
import type { Codemod, SgNode } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

const LEGACY = "react-router-dom";
const CORE = "react-router";
const DOM = "react-router/dom";
const DOM_EXPORTS = new Set(["RouterProvider", "HydratedRouter"]);

type Declaration = {
  node: SgNode<TSX>;
  source: string;
  kind: "import_statement" | "export_statement";
};

function warnAt(root: Parameters<Codemod<TSX>>[0], message: string): void {
  warn(`${root.relativeFilename()}: ${message}`);
}

function moduleName(node: SgNode<TSX> | null): string | null {
  if (!node) return null;
  try {
    const text = node.text();
    if (text.startsWith('"')) return JSON.parse(text) as string;
    if (text.startsWith("'")) return text.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    return null;
  } catch {
    return null;
  }
}

function importedName(specifier: SgNode<TSX>): string {
  return specifier.text().replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.replace(/^['"]|['"]$/g, "") ?? "";
}

function localName(specifier: SgNode<TSX>): string {
  const parts = specifier.text().replace(/^type\s+/, "").split(/\s+as\s+/);
  return (parts[1] ?? parts[0] ?? "").replace(/^['"]|['"]$/g, "");
}

function overlapsBinding(
  specifier: SgNode<TSX>,
  targetBindings: Set<string>,
): boolean {
  const local = localName(specifier);
  return targetBindings.has(local);
}

function renderDeclaration(
  declaration: Declaration,
  container: SgNode<TSX>,
  specifiers: SgNode<TSX>[],
  target: string,
): string {
  const original = declaration.node.text();
  const named = container.text();
  const start = original.indexOf(named);
  if (start < 0) return original;

  const end = start + named.length;
  const originalInside = named.slice(1, -1);
  const multiline = originalInside.includes("\n");
  const firstLine = originalInside.match(/\n([\t ]*)\S/)?.[1] ?? "  ";
  const closingIndent = originalInside.match(/\n([\t ]*)\s*$/)?.[1] ?? "";
  const separator = multiline ? `,\n${firstLine}` : ", ";
  const trailingComma = multiline && /,\s*$/.test(originalInside);
  const body = specifiers.map((specifier) => specifier.text()).join(separator);
  const replacement = multiline
    ? `{\n${firstLine}${body}${trailingComma ? "," : ""}\n${closingIndent}}`
    : `{ ${body} }`;
  const withSource = `${original.slice(0, start)}${replacement}${original.slice(end)}`;
  const source = declaration.node.field("source");
  if (!source) return withSource;
  const oldSource = source.text();
  const sourceInText = withSource.lastIndexOf(oldSource);
  if (sourceInText < 0) return withSource;
  return `${withSource.slice(0, sourceInText)}${oldSource[0]}${target}${oldSource[oldSource.length - 1]}${withSource.slice(sourceInText + oldSource.length)}`;
}

function callSource(node: SgNode<TSX>): string | null {
  const fn = node.field("function");
  if (!fn || (!fn.is("import") && fn.text() !== "require")) return null;
  const args = node.field("arguments");
  const first = args?.child(0);
  return first?.is("string") ? moduleName(first) : null;
}

const codemod: Codemod<TSX> = async (root) => {
  const ast = root.root();
  const declarations: Declaration[] = [];
  const targetBindings = new Set<string>();

  for (const node of ast.children()) {
    if (node.kind() !== "import_statement") continue;
    const source = moduleName(node.field("source"));
    if (source !== CORE && source !== DOM) continue;
    const clause = node.find({ rule: { kind: "import_clause" } });
    if (clause?.children().some((child) => child.kind() === "identifier" || child.kind() === "namespace_import")) {
      continue;
    }
    for (const specifier of clause?.findAll({ rule: { kind: "import_specifier" } }) ?? []) {
      targetBindings.add(localName(specifier));
    }
  }

  for (const node of ast.children()) {
    if (node.kind() !== "import_statement" && node.kind() !== "export_statement") continue;
    const source = moduleName(node.field("source"));
    if (!source) continue;
    if (source === LEGACY || source === CORE) {
      declarations.push({
        node,
        source,
        kind: node.kind() as Declaration["kind"],
      });
    }
  }

  const edits = [];
  for (const declaration of declarations) {
    const node = declaration.node;
    const source = declaration.source;
    const clauseField = declaration.kind === "import_statement" ? "import_clause" : "export_clause";
    const clause = node.find({ rule: { kind: clauseField } });
    if (!clause) {
      if (source === LEGACY) warnAt(root, `side-effect import from ${LEGACY} was not changed; keep the dependency until reviewed.`);
      continue;
    }

    const named = clause.find({ rule: { kind: "named_imports" } }) ?? clause.find({ rule: { kind: "export_clause" } });
    if (!named) {
      if (source === LEGACY) warnAt(root, `default or namespace import from ${LEGACY} was not changed; keep the dependency until reviewed.`);
      continue;
    }

    const specifiers = named.children().filter((child) => child.kind() === "import_specifier" || child.kind() === "export_specifier");
    if (specifiers.length === 0) continue;
    if (declaration.kind === "import_statement" && clause.children().some((child) => child.kind() !== "named_imports")) {
      warnAt(root, `default or namespace binding alongside named imports from ${source} was not changed; keep the dependency until reviewed.`);
      continue;
    }
    if (/\/\*|\/\//.test(named.text())) {
      warnAt(root, `commented named specifiers from ${source} were left unchanged to preserve comments.`);
      continue;
    }

    const core: SgNode<TSX>[] = [];
    const dom: SgNode<TSX>[] = [];
    const stays: SgNode<TSX>[] = [];
    let unsafe = false;
    for (const specifier of specifiers) {
      const name = importedName(specifier);
      const destination = DOM_EXPORTS.has(name) ? DOM : CORE;
      const shouldMove = source === LEGACY || (source === CORE && destination === DOM);
      if (!shouldMove) {
        stays.push(specifier);
        continue;
      }

      const local = localName(specifier);
      if (source === LEGACY && declaration.kind === "import_statement" && overlapsBinding(specifier, targetBindings)) {
        warnAt(root, `binding ${local} already exists from ${CORE} or ${DOM}; left ${name} in ${LEGACY} to avoid a duplicate binding.`);
        stays.push(specifier);
        unsafe = true;
        continue;
      }
      (destination === DOM ? dom : core).push(specifier);
    }

    if (source === LEGACY && unsafe && stays.length === specifiers.length) continue;
    if (core.length === 0 && dom.length === 0) continue;

    if (source === LEGACY && declaration.kind === "import_statement") {
      for (const specifier of [...core, ...dom]) targetBindings.add(localName(specifier));
    }

    const statements: string[] = [];
    if (stays.length > 0) statements.push(renderDeclaration(declaration, named, stays, source));
    if (core.length > 0) statements.push(renderDeclaration(declaration, named, core, CORE));
    if (dom.length > 0) statements.push(renderDeclaration(declaration, named, dom, DOM));
    edits.push(node.replace(statements.join("\n")));
  }

  for (const call of ast.findAll({ rule: { kind: "call_expression" } })) {
    const source = callSource(call);
    if (source === LEGACY) warnAt(root, `CommonJS or dynamic import from ${LEGACY} was not changed; keep the dependency until reviewed.`);
  }

  return edits.length > 0 ? ast.commitEdits(edits) : null;
};

export default codemod;
