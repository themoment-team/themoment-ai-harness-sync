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
- Resolved from `mavenCentral()` only — no JitPack repository needed

```kotlin
plugins {
    id("org.springframework.boot") version "4.0.9"
}

dependencies {
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

- Coordinate change: `com.github.themoment-team:the-sdk:1.x` (JitPack) → `io.github.themoment-team:the-sdk:2.0` (Maven Central); remove the JitPack repository. No code changes needed (package unchanged)
- `CommonApiResponse.status` now follows the application's Jackson settings — Jackson 3 default is `HttpStatus.toString()`, e.g. `"OK"` → `"200 OK"`, `"NOT_FOUND"` → `"404 NOT_FOUND"`. Check clients and tests that parse `status`
