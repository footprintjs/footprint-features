# footprint-features

**Beta — APIs may change. Not published on npm; use the source setup below.**

A TypeScript feature-module registry for school platforms. Define modules and school types once, then derive enabled features, dependency trees, terminology, role declarations and seed blueprints for each school profile.

For developers configuring variants such as K–12, dance and music schools. This package exposes school-oriented names (`defineSchoolType`, `resolveSchoolConfig`). For the consolidated, domain-agnostic framework, see [footprint-blueprint](https://github.com/footprintjs/footprint-blueprint) and its release status; the APIs are not interchangeable.

**Source-only package:** there is currently no npm registry publication. Build this checkout to try it.

## Build from source

```sh
git clone https://github.com/footprintjs/footprint-features.git
cd footprint-features
npm ci
npm run build
```

The package declares ESM exports and TypeScript types from `dist/`. The example below uses the package import after installation; when trying it inside this checkout, import from `./dist/index.js` instead.

## A small configuration

```ts
import {
  defineModule, defineSchoolType, createModuleRegistry,
  resolveSchoolConfig, createFeatureGate, createTermResolver,
} from 'footprint-features';

const students = defineModule({ id: 'students', name: 'Students', domain: 'people' });
const attendance = defineModule({
  id: 'attendance', name: 'Attendance', domain: 'academics',
  requires: ['students'],
  terminology: { session: { default: 'Session', dance: 'Check-in' } },
});
const dance = defineSchoolType({
  type: 'dance', displayName: 'Dance school', modules: ['attendance'],
});
const registry = createModuleRegistry({ modules: [students, attendance], schoolTypes: [dance] });
if (registry.validate().length) throw new Error('Invalid module configuration');

const config = resolveSchoolConfig(registry, 'dance');
createFeatureGate(config).isEnabled('students'); // true: attendance requires students
createTermResolver(config.terminology)('session'); // 'Check-in'
```

The public exports and a fuller example are in [src/index.ts](src/index.ts). [Core types](src/types.ts) describe modules, profiles and resolved configuration; [source tests](src/__tests__) exercise the contracts. Run them with `npm test`.

## Boundaries

This is configuration logic, not a workflow executor, remote feature-flag service or authorization system. Role lists describe configuration; the application must enforce access. Seed values are blueprints for the application to apply, not executed database changes. Validate the registry explicitly: configuration resolution can filter unknown modules instead of failing.

[FootPrint](https://github.com/footprintjs/footPrint) provides workflow execution. [footprint-blueprint](https://github.com/footprintjs/footprint-blueprint) combines features with tenancy, adapters, actions and retained execution evidence. This package does not add those runtime layers automatically.
