BEGIN;
-- Save the whole syllabus atomically. Reject stale, duplicate or foreign IDs.
CREATE OR REPLACE FUNCTION public.admin_reorder_curriculum(p_formation_id uuid, p_modules jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; lesson jsonb; module_ids uuid[]; lesson_ids uuid[]; actual_modules uuid[]; actual_lessons uuid[]; position integer := 0; lesson_position integer;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 PERFORM 1 FROM formations WHERE id = p_formation_id FOR UPDATE;
 IF NOT FOUND OR COALESCE(jsonb_typeof(p_modules),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid formation'; END IF;
 SELECT array_agg((v->>'id')::uuid ORDER BY (v->>'id')::uuid) INTO module_ids FROM jsonb_array_elements(p_modules) v;
 SELECT array_agg((v#>>'{}')::uuid ORDER BY (v#>>'{}')::uuid) INTO lesson_ids FROM jsonb_array_elements(p_modules) m CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') v;
 SELECT array_agg(id ORDER BY id) INTO actual_modules FROM modules WHERE formation_id = p_formation_id;
 SELECT array_agg(l.id ORDER BY l.id) INTO actual_lessons FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id = p_formation_id;
 IF module_ids IS DISTINCT FROM actual_modules OR lesson_ids IS DISTINCT FROM actual_lessons THEN RAISE EXCEPTION 'El temario ha cambiado. Recarga antes de ordenar.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_modules) LOOP
  UPDATE modules SET sort_order = position WHERE id = (item->>'id')::uuid;
  position := position + 1; lesson_position := 0;
  FOR lesson IN SELECT value FROM jsonb_array_elements(item->'lessons') LOOP
   UPDATE lessons SET module_id = (item->>'id')::uuid, sort_order = lesson_position WHERE id = (lesson#>>'{}')::uuid;
   lesson_position := lesson_position + 1;
  END LOOP;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.admin_reorder_curriculum(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reorder_curriculum(uuid,jsonb) TO authenticated;

-- Quiz and options are one transaction. Existing attempt records remain attached.
CREATE OR REPLACE FUNCTION public.admin_save_quiz(p_id uuid, p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE quiz_id uuid; question_id uuid; question jsonb; option jsonb; qi integer := 0; oi integer;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF COALESCE(jsonb_typeof(p_data),'null') <> 'object' OR COALESCE(jsonb_typeof(p_data->'questions'),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid quiz'; END IF;
 IF NOT EXISTS(SELECT 1 FROM lessons WHERE id=(p_data->>'lessonId')::uuid AND content_type='quiz')
 OR char_length(btrim(COALESCE(p_data->>'title',''))) NOT BETWEEN 1 AND 200
 OR COALESCE((p_data->>'passing_score')::integer,0) NOT BETWEEN 1 AND 100
 OR COALESCE((p_data->>'xp_reward')::integer,-1) NOT BETWEEN 0 AND 10000
 OR jsonb_array_length(p_data->'questions') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid quiz'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO quizzes(lesson_id,title,description,passing_score,xp_reward) VALUES((p_data->>'lessonId')::uuid,p_data->>'title',p_data->>'description',(p_data->>'passing_score')::integer,(p_data->>'xp_reward')::integer) RETURNING id INTO quiz_id;
 ELSE
  UPDATE quizzes SET title=p_data->>'title',description=p_data->>'description',passing_score=(p_data->>'passing_score')::integer,xp_reward=(p_data->>'xp_reward')::integer,updated_at=now()
   WHERE id=p_id AND lesson_id=(p_data->>'lessonId')::uuid RETURNING id INTO quiz_id;
  IF quiz_id IS NULL THEN RAISE EXCEPTION 'Quiz unavailable'; END IF;
  DELETE FROM quiz_options WHERE quiz_options.question_id IN (SELECT id FROM quiz_questions WHERE quiz_questions.quiz_id=p_id);
  DELETE FROM quiz_questions WHERE quiz_questions.quiz_id=p_id;
 END IF;
 FOR question IN SELECT value FROM jsonb_array_elements(p_data->'questions') LOOP
  IF COALESCE(jsonb_typeof(question->'options'),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid options'; END IF;
  IF char_length(btrim(COALESCE(question->>'question',''))) NOT BETWEEN 1 AND 2000 OR COALESCE(question->>'type','') NOT IN ('multiple_choice','true_false')
  OR jsonb_array_length(question->'options') NOT BETWEEN 2 AND 6
  OR (question->>'type'='true_false' AND jsonb_array_length(question->'options')<>2)
  OR (SELECT count(*) FROM jsonb_array_elements(question->'options') o WHERE (o->>'is_correct')::boolean) <> 1 THEN RAISE EXCEPTION 'Invalid question'; END IF;
  INSERT INTO quiz_questions(quiz_id,question,type,explanation,sort_order) VALUES(quiz_id,question->>'question',question->>'type',question->>'explanation',qi) RETURNING id INTO question_id;
  qi := qi+1; oi := 0;
  FOR option IN SELECT value FROM jsonb_array_elements(question->'options') LOOP
   IF char_length(btrim(COALESCE(option->>'option_text',''))) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid option'; END IF;
   INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order) VALUES(question_id,option->>'option_text',(option->>'is_correct')::boolean,oi);
   oi := oi+1;
  END LOOP;
 END LOOP;
 RETURN quiz_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_save_quiz(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_quiz(uuid,jsonb) TO authenticated;
COMMIT;
