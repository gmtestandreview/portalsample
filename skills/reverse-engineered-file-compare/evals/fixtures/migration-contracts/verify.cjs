/* Fixture oracle verifier only. Run with compiled fixture directory as argv[2]. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const dir = path.resolve(process.argv[2]);
const A = require(path.join(dir, 'latest-original.js'));
const bad = require(path.join(dir, 'candidate-regressed.js'));
const adapted = require(path.join(dir, 'candidate-adapted.js'));
const doc = (id, category = 'Manual', locked = false) => ({
  id,
  category,
  locked,
});
const initial = () => [doc('a'), doc('b'), doc('c', 'Manual', true)];
function port(kind, value) {
  let current = value;
  return {
    kind,
    get values() {
      return { form: { docs: current } };
    },
    setDocs(v) {
      current = v;
    },
    getValues() {
      return current;
    },
    setValue(p, v) {
      assert.equal(p, 'form.docs');
      current = v;
    },
  };
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log(`PASS ${name}`);
}
async function main() {
  for (const [name, mod, kind] of [
    ['A', A, 'formik'],
    ['bad', bad, 'rhf'],
    ['adapted', adapted, 'rhf'],
  ]) {
    await check(`${name}: public exports`, () =>
      assert.deepEqual(Object.keys(mod).sort(), [
        'bind',
        'categoryPath',
        'options',
        'read',
        'remove',
        'save',
      ]),
    );
    await check(`${name}: empty representations`, () => {
      assert.deepEqual(mod.read(null), []);
      assert.deepEqual(mod.read(undefined), []);
    });
    await check(
      `${name}: scalar ${name === 'bad' ? 'loss' : 'preservation'}`,
      () =>
        assert.deepEqual(mod.read(doc('a')), name === 'bad' ? [] : [doc('a')]),
    );
    await check(`${name}: ordered array`, () =>
      assert.deepEqual(mod.read(initial()), initial()),
    );
    await check(`${name}: nested binding read/write`, () => {
      const f = port(kind, initial());
      const b = mod.bind(f);
      assert.deepEqual(b.read(), initial());
      b.write([doc('z')]);
      assert.deepEqual(f.getValues(), [doc('z')]);
      assert.equal(mod.categoryPath(2), 'form.docs.2.category');
    });
    await check(`${name}: persisted taxonomy`, () => {
      assert.deepEqual(
        mod.options.map((o) => o.label),
        ['Photo or diagram', 'Manual'],
      );
      assert.deepEqual(
        mod.options.map((o) => o.value),
        name === 'bad'
          ? ['Photos or diagrams', 'Manuals']
          : ['Photo or Diagram', 'Manual'],
      );
    });
    await check(`${name}: deletion payload and target`, async () => {
      const f = port(kind, initial());
      let args;
      await mod.remove(f, 'a', async (...a) => {
        args = a;
      });
      assert.deepEqual(args, ['a', name === 'bad' ? 0 : 1]);
      assert.deepEqual(f.getValues(), initial().slice(1));
    });
    await check(
      `${name}: deletion rejection ${name === 'A' ? 'defect' : 'correction'}`,
      async () => {
        const f = port(kind, initial());
        await assert.rejects(
          mod.remove(f, 'a', async () => {
            throw Error('reject');
          }),
        );
        assert.deepEqual(
          f.getValues(),
          name === 'A' ? initial().slice(1) : initial(),
        );
      },
    );
    await check(`${name}: successful category save`, async () => {
      const f = port(kind, initial());
      let args;
      await mod.save(f, 'b', 'Photo or Diagram', async (...a) => {
        args = a;
      });
      assert.deepEqual(args, ['b', 'Photo or Diagram']);
      assert.equal(f.getValues()[1].category, 'Photo or Diagram');
    });
    await check(`${name}: save rejection preserves`, async () => {
      const f = port(kind, initial());
      await assert.rejects(
        mod.save(f, 'a', 'new', async () => {
          throw Error('reject');
        }),
      );
      assert.deepEqual(f.getValues(), initial());
    });
    await check(`${name}: external addition during save`, async () => {
      const f = port(kind, initial());
      const d = deferred();
      const pending = mod.save(f, 'a', 'new', () => d.promise);
      f.setDocs([...f.getValues(), doc('z')]);
      d.resolve();
      await pending;
      assert.equal(
        f.getValues().some((x) => x.id === 'z'),
        name !== 'bad',
      );
    });
    await check(`${name}: external addition during deletion`, async () => {
      const f = port(kind, initial());
      const d = deferred();
      const pending = mod.remove(f, 'a', () => d.promise);
      f.setDocs([...f.getValues(), doc('z')]);
      d.resolve();
      await pending;
      assert.equal(
        f.getValues().some((x) => x.id === 'z'),
        name !== 'bad',
      );
    });
    await check(
      `${name}: reverse completion exposes latest-intent defect`,
      async () => {
        const f = port(kind, initial());
        const first = deferred(),
          second = deferred();
        const p1 = mod.save(f, 'a', 'older', () => first.promise);
        const p2 = mod.save(f, 'a', 'newer', () => second.promise);
        second.resolve();
        await p2;
        assert.equal(f.getValues()[0].category, 'newer');
        first.resolve();
        await p1;
        assert.equal(f.getValues()[0].category, 'older');
      },
    );
  }
  console.log(
    `Fixture oracle checks: ${passed} passed; these include expected defect reproductions, not candidate acceptance.`,
  );
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
