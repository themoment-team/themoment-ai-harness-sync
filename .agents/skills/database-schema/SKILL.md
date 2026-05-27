---
name: database-schema
description: Database schema design guide — table naming, column conventions, index strategy, and Flyway migration file structure.
---

# Database Schema Design Guide

## Naming Conventions

- Tables: `snake_case`, plural (`users`, `api_keys`)
- Columns: `snake_case` (`created_at`, `is_active`)
- FK columns: `{referenced_table_singular}_id` (`user_id`, `club_id`)
- Index names: `idx_{table}_{columns}` (`idx_users_email`)
- UK names: `uq_{table}_{columns}` (`uq_users_email`)

## Standard Columns

Include in every entity table:

```sql
id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
```

## Index Strategy

- Single column used frequently in WHERE: simple index
- WHERE + ORDER BY combination: composite index (WHERE column first)
- Low-cardinality columns (`is_active`, `status` enum): indexing rarely helps

```sql
-- Composite index example
CREATE INDEX idx_posts_user_created ON posts (user_id, created_at DESC);
```

## Flyway Migration

File naming: `V{version}__{description}.sql`

```
db/migration/
  V1__create_users.sql
  V2__add_api_keys.sql
  V3__add_index_users_email.sql
```

```sql
-- V2__add_api_keys.sql
CREATE TABLE api_keys (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    key_value  VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_api_keys_value UNIQUE (key_value)
);
```

## JPA Entity Mapping

```kotlin
@Entity
@Table(name = "api_keys")
class ApiKey(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "key_value", nullable = false, unique = true, length = 64)
    val keyValue: String,
) : BaseEntity()
```
