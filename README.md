# 2026-6302-2-ai-video-agent
AI-агент для генерации видео и публикации в VK сообщества (VK Video/VK Clips).
## Текущее состояние
- Публикация оставлена только в VK.
- Поддерживается несколько VK сообществ на одного пользователя.
- Есть ручная публикация готового видео кнопкой `Опубликовать` в `Dashboard -> Videos`.
- Реализована полноценная загрузка видео в VK (не просто ссылка): `video.save` -> upload -> `wall.post` c `attachments=video...`.
- Обновлен Docker-режим для локального запуска приложения и Inngest.

## Стек
- Next.js (App Router), React, TypeScript
- Supabase (БД + storage)
- Inngest (фоновые пайплайны)
- Remotion (рендер MP4)
- Clerk (auth)

## Ключевые части проекта
- `app/api/videos/[id]/publish/route.ts` - ручная публикация видео в активные VK сообщества.
- `lib/inngest.ts` - генерация и автопубликация после рендера (VK-only).
- `lib/social/vk.ts` - VK API интеграция: `video.save`, upload, `wall.post`.
- `app/dashboard/settings/page.tsx` - управление VK сообществами и токенами.
- `app/dashboard/videos/videos-client.tsx` - кнопка ручной публикации и вывод результата.
- `app/api/social/connections/*` - CRUD для настроек VK сообществ.
- `supabase/migrations/*vk_communities*.sql` - схема таблицы VK сообществ.

## Запуск
### Вариант 1: Docker Compose (рекомендуется)
1. Скопируйте переменные:
```bash
cp .env.example .env.local
```
2. Заполните `.env.local` (Clerk, Supabase, VK, AI ключи).
3. Поднимите стек:
```bash
docker compose up --build
```
4. Откройте:
- App: [http://localhost:3000](http://localhost:3000)
- Inngest UI: [http://localhost:8288](http://localhost:8288)

Если есть `ECONNREFUSED`/`Failed to register` для Inngest:
- проверьте, что сервис `inngest` запущен;
- перезапустите: `docker compose down && docker compose up --build`;
- убедитесь, что заданы `INNGEST_DEV` и `INNGEST_BASE_URL=http://inngest:8288`.

### Вариант 2: Локально без Docker
```bash
npm install
npm run dev
npx inngest-cli@latest dev
```

## Важный шаг после обновлений БД
После pull новых изменений примените миграции Supabase, включая добавление `user_access_token`:
- `supabase/migrations/20260508_create_vk_communities.sql`
- `supabase/migrations/20260508_add_user_access_token_to_vk_communities.sql`

## Настройка публикации в VK сообщества
В `Settings` добавьте сообщество через `Add community` и заполните:
- `Community ID` - ID сообщества (число, без `club`/`public`);
- `Community name` - опционально;
- `Community token (for wall access)` - токен сообщества;
- `User access token (required for video upload)` - пользовательский токен администратора сообщества.

Почему нужны два токена:
- `User access token` используется для `video.save` и загрузки файла видео в VK.
- `Community token` используется для публикации поста от имени сообщества (`wall.post`, `from_group=1`).

Без `user access token` загрузка embedded-видео невозможна.

## Как работает публикация
1. Видео рендерится и получает `video_url`.
2. При ручной публикации (`Опубликовать`) система проходит по всем `Active` VK сообществам.
3. Для каждого сообщества:
   - вызывает `video.save` (с `group_id`);
   - отправляет mp4 на `upload_url`;
   - публикует пост с вложением `video{owner_id}_{video_id}`.
4. В UI показывается итог: сколько сообществ успешно опубликовано и первая ошибка при фейле.

## Ограничения и заметки
- Сейчас канал публикации только VK.
- Для публикации требуется статус видео `rendered` и наличие `video_url`.
- Токены в интерфейсе отображаются только в маскированном виде.