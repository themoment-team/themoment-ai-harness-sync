---
name: the-sdk
description: Usage guide for the-sdk 2.0 common library (Spring Boot 4.0.x) — HTTP request/response logging with UUID Log-ID, CommonApiResponse wrapping, ExpectedException handling, Swagger auto-configuration, and 1.x → 2.0 migration notes.
---

# the-sdk Usage Guide

`io.github.themoment-team:the-sdk:2.0` — the core common library for this project (Maven Central).  
Controlled via `sdk.*` settings in `application.yml`. Package name is `team.themoment.sdk`.

## Requirements

- Java 17+, Spring Boot 4.0.x (Spring Framework 7, Jackson 3). Spring Boot 3.x projects must stay on 1.x
- The SDK no longer propagates Spring Boot dependencies or the BOM — declare them in the consuming project:
  - Spring Boot version management: `org.springframework.boot` plugin or `spring-boot-dependencies` BOM
  - `org.springframework.boot:spring-boot-starter-web`
  - Kotlin: `tools.jackson.module:jackson-module-kotlin` (Jackson 3; the Jackson 2 module from 1.x is gone)
- The SDK still brings `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3` (Spring Boot 4.0.x line) as an `api` dependency — no separate springdoc declaration is needed
- Resolved from `mavenCentral()` only — no JitPack repository needed

```kotlin
plugins {
    id("org.springframework.boot") version "4.0.9" // version the-sdk 2.0 is built and tested against
}

repositories {
    mavenCentral() // remove the JitPack repository used by 1.x
}

dependencies {
    // The Spring Boot plugin alone does not manage dependency versions; import the BOM
    implementation(platform(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES))
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("tools.jackson.module:jackson-module-kotlin") // Kotlin projects only
    implementation("io.github.themoment-team:the-sdk:2.0")
}
```

## Features

- **Logging**: Assigns a UUID `Log-ID` to every HTTP request/response; automatic logging
- **Response Wrapper**: Automatically wraps controller return values in `CommonApiResponse`. Use `success()` / `created()` / `error()` factory methods
  - HTTP status set via `@ResponseStatus` or `ResponseEntity` is preserved, and the body's `status`/`code`/`message` follow it
  - Returning `null` with the default 200 becomes 204; 204/205/304 responses have no body
- **Exception Handler**: Throwing `ExpectedException(message, HttpStatus)` returns a standard error response automatically
- **Swagger**: Auto-configured at `/v3/api-docs` and `/swagger-ui`. Only `/v1/**` paths are documented
  - For an API that may return DTO or `null` (default 200), declare both `200` and body-less `204` in `@ApiResponses`

## Migrating from 1.x

- Upgrading to 2.0 means upgrading the project to Spring Boot 4.0.x — swapping the coordinate alone does not work on Spring Boot 3.x. Either migrate to Spring Boot 4 (Jackson 2 `com.fasterxml.jackson.databind` → Jackson 3 `tools.jackson`, Kotlin module coordinate, Boot 4 configuration changes) or stay on 1.x
- Coordinate change: `com.github.themoment-team:the-sdk:1.x` (JitPack) → `io.github.themoment-team:the-sdk:2.0` (Maven Central); remove the JitPack repository. SDK package (`team.themoment.sdk`) and API signatures are unchanged
- `CommonApiResponse.status` now follows the application's Jackson settings. Jackson 3 enables `EnumFeature.WRITE_ENUMS_USING_TO_STRING` by default, so it serializes as `HttpStatus.toString()`, e.g. `"OK"` → `"200 OK"`, `"NOT_FOUND"` → `"404 NOT_FOUND"` (verified by the-sdk 2.0 integration tests). Check clients and tests that parse `status`
- Plain DTO responses no longer force 200: 1.x always returned 200 even with `@ResponseStatus(HttpStatus.CREATED)`, while 2.0 returns the declared status (e.g. 201) with matching `status`/`code`/`message`. Check tests and clients that assert 200 on such endpoints. Returning `null` still yields 204 by default, as in 1.x
