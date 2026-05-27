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

모든 엔티티 테이블에 포함:

```sql
id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
```

## Index Strategy

- 조회 조건으로 자주 쓰이는 단일 컬럼: 단순 인덱스
- WHERE + ORDER BY 조합: 복합 인덱스 (WHERE 컬럼 먼저)
- 카디널리티 낮은 컬럼(`is_active` 등)은 인덱스 효과 없음

```sql
-- 복합 인덱스 예시
CREATE INDEX idx_posts_user_created ON posts (user_id, created_at DESC);
```

## Flyway Migration

파일명 형식: `V{version}__{description}.sql`

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

## JPA Entity 매핑

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
