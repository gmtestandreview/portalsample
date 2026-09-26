# Classification evidence

Load when classification confidence affects an executable plan.

Independent evidence classes:

- lexical: filename and extension together;
- internal package structure;
- version/product metadata;
- signature/publisher identity;
- contextual placement.

High confidence requires at least two independent relevant classes. Signature identity supports identity, not safety.

Format-specific examples:

- VSIX: ZIP/container magic alone is insufficient; inspect `extension.vsixmanifest` or equivalent package structure.
- CRX: validate CRX header/version and embedded package structure when subtype confidence matters.
- MSI: inspect MSI/package metadata rather than relying only on OLE/container magic.
- EXE: corroborate installer purpose with relevant version/product metadata or other independent package indicators.
- ISO: container/image evidence supports "disk image"; do not infer installation-media purpose without corroboration.
