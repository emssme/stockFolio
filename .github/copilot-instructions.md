---
description: "Workspace instructions for StockFolio backend development, including build/test commands, conventions, and documentation links."
---

# StockFolio Workspace Instructions

This repository contains the StockFolio backend service implemented in Spring Boot.
The workspace root contains the `stockfolio/` Gradle project, which is the main module for all development tasks.

## What this project is

- Java 17 Spring Boot backend
- JWT login / refresh token auth
- JPA + MariaDB
- Redis caching
- WebSocket-based real-time quotes
- Flyway database migration
- Includes backend API documentation in `docs/API명세서.md`

## Where to run commands

Use the Gradle wrapper in `stockfolio/`.

- `./gradlew build`
- `./gradlew test`
- `./gradlew bootRun`

When referring to files or tasks, prefer the subfolder path `stockfolio/` as the project root.

## Key paths

- `stockfolio/build.gradle.kts`
- `stockfolio/src/main/java/com/stockfolio/`
- `stockfolio/src/main/resources/application.yaml`
- `stockfolio/src/main/resources/application-local.yaml`
- `stockfolio/src/main/resources/db/migration/V1__create_tables.sql`
- `docs/API명세서.md`
- `docs/ERD.md`
- `README.md`

## Project conventions

- `com.stockfolio` is the base package.
- Controllers, services, repositories, DTOs, and domain classes are separated by feature package.
- Validation uses Jakarta Validation annotations.
- Security is implemented with JWT and Spring Security.
- Use `ApiResponse` for standardized response payloads.
- Commit message style and branch strategy are documented in `README.md`.

## Notes for the agent

- This repo is effectively a backend service; do not assume frontend source code is present here.
- Prefer using existing API docs rather than inventing endpoints.
- When offering code changes, follow the repository's org structure and naming conventions.
- Avoid suggesting frontend React changes unless the user explicitly adds a frontend module.

## Useful documentation

- `README.md` — project overview, git conventions, branch strategy
- `docs/API명세서.md` — API contract and WebSocket details
- `docs/ERD.md` — database model
- `stockfolio/HELP.md` — Spring Boot and Gradle references

## When to use these instructions

Use this file for development tasks, bug fixes, feature work, and PR guidance for the StockFolio backend.
For more specific file-level or workflow instructions, prefer creating `*.instructions.md` or hooks in `.github/` later.
