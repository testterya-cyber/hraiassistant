# HR AI Assistant + Supabase

## Что уже добавлено
- Подключение к Supabase через `lib/supabaseClient.js`
- Новый основной экран `components/AssistantSupabase.js`
- SQL-схема для таблиц в `supabase/schema.sql`
- Переменные окружения в `.env.example`

## Что нужно сделать в Supabase
1. Создай новый проект в Supabase.
2. Открой SQL Editor.
3. Вставь и выполни содержимое `supabase/schema.sql`.
4. В Project Settings -> API скопируй:
   - `Project URL`
   - `anon public key`

## Что нужно добавить в Vercel
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Что уже умеет приложение
- Парсить резюме и сохранять его в таблицу `resumes`
- Создавать и редактировать профили должностей и сохранять их в `job_profiles`
- Оценивать кандидата по выбранному резюме и профилю, сохранять в `candidate_evaluations`
- Генерировать вопросы для интервью по сохранённому профилю и кандидату, сохранять в `interview_sets`

## Важно
Сейчас проект рассчитан на общий доступ без авторизации пользователей Supabase. Для продакшена лучше следующим шагом добавить нормальную авторизацию и RLS-политики под конкретных HR.
