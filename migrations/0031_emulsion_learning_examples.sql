BEGIN;
-- Four editable learning steps inserted in the middle of an existing module.
-- Preserve all existing lesson IDs/content and their relative order. Never create
-- an unrelated formation, republish a draft module or overwrite edited examples.
DO $$
DECLARE course uuid; target_module uuid; existing_ids uuid[]; new_ids uuid[] := ARRAY[]::uuid[]; ordered_ids uuid[]:=ARRAY[]::uuid[]; lesson_id uuid; quiz_id uuid; question_id uuid; item jsonb; question jsonb; option jsonb; idx integer; qi integer; oi integer; anchor integer; total integer;
BEGIN
 SELECT id INTO course FROM formations
 WHERE translate(lower(slug),'áéíóúü','aeiouu') LIKE 'emulsi%energ%'
 OR translate(lower(title),'áéíóúü','aeiouu') LIKE 'emulsi%energ%'
 ORDER BY is_published DESC,id LIMIT 1;
 IF course IS NULL THEN RAISE NOTICE 'Emulsión Energética no existe: no se insertan ejemplos.'; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id=course AND l.slug LIKE 'emulsion-ejemplo-%') THEN RETURN; END IF;
 SELECT m.id INTO target_module FROM modules m WHERE m.formation_id=course AND EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id)
 ORDER BY m.is_published DESC,m.sort_order,m.id
 OFFSET (SELECT count(*)/2 FROM modules m WHERE m.formation_id=course AND m.is_published AND EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id)) LIMIT 1;
 IF target_module IS NULL THEN RAISE NOTICE 'La formación no tiene lecciones: añade un módulo antes de cargar los ejemplos.'; RETURN; END IF;
 PERFORM 1 FROM formations WHERE id=course FOR UPDATE;
 SELECT array_agg(id ORDER BY sort_order,id) INTO existing_ids FROM lessons WHERE module_id=target_module;
 total:=cardinality(existing_ids); anchor:=GREATEST(1,total/2);
 FOR item IN SELECT value FROM jsonb_array_elements($json$[
 {"slug":"emulsion-ejemplo-pausa","title":"Pausa de integración: reconocer tu punto de partida","type":"text","body":"## Una pausa para observar\n\nAntes de avanzar, dedica unos minutos a reconocer cómo llegas a esta parte de la formación. No necesitas sentirte de una manera concreta: empieza por lo que puedes observar.\n\n### Tres preguntas para tu cuaderno\n\n- ¿Qué sensaciones noto ahora mismo?\n- ¿Qué situaciones han ocupado mi atención hoy?\n- ¿Qué necesito para seguir aprendiendo con calma?\n\n### Separa observación e interpretación\n\n**Observación:** hoy he cambiado de tarea varias veces.\n\n**Interpretación:** no soy capaz de concentrarme.\n\nLa primera describe algo concreto; la segunda añade un juicio. Prueba a reformular una frase de tu cuaderno como una observación.\n\n### Integra lo aprendido\n\nElige una acción pequeña: cerrar una pestaña, beber agua o hacer una pausa breve. Anota qué eliges y continúa a tu ritmo.\n\n*Lectura de ejemplo para explorar el recorrido de Emulsión Energética.*"},
 {"slug":"emulsion-ejemplo-observar","title":"Comprueba lo aprendido: observar sin juzgar","type":"quiz","questions":[{"text":"¿Cuál de estas frases describe una observación concreta?","explanation":"Una observación describe un hecho específico, sin convertirlo en un juicio sobre tu identidad.","options":["Hoy he cambiado de tarea tres veces.","Nunca soy capaz de concentrarme.","Todo me sale mal."]},{"text":"¿Qué propone la pausa de integración?","explanation":"La propuesta es reconocer el punto de partida y elegir una acción pequeña que puedas realizar.","options":["Reconocer cómo llego y elegir una acción pequeña.","Forzarme a sentir una emoción concreta.","Resolver todos mis problemas antes de continuar."]}]},
 {"slug":"emulsion-ejemplo-practica","title":"Del aprendizaje a una práctica cotidiana","type":"text","body":"## Un paso que cabe en tu día\n\nAprender también consiste en probar una idea en una situación real. Elige algo de las lecciones anteriores que quieras explorar esta semana.\n\n### Diseña tu práctica\n\n- **Situación:** ¿en qué momento concreto lo vas a intentar?\n- **Acción:** ¿qué harás durante dos o tres minutos?\n- **Recordatorio:** ¿qué te ayudará a acordarte?\n\nPor ejemplo: al terminar mi jornada, escribiré una observación y una necesidad en el cuaderno que dejo sobre la mesa.\n\n### Revisa sin castigarte\n\nDespués de tres días, revisa qué ocurrió. Si la práctica no encaja, reduce su duración o cambia el momento. No se trata de cumplir una rutina perfecta, sino de descubrir qué puedes sostener.\n\n### Tu siguiente paso\n\nEscribe una frase: **Cuando termine…, dedicaré dos minutos a…**. Puedes guardar tu reflexión en tu diario personal y volver a ella cuando lo necesites.\n\n*Lectura de ejemplo para explorar el recorrido de Emulsión Energética.*"},
 {"slug":"emulsion-ejemplo-integrar","title":"Comprueba lo aprendido: integrar y ajustar","type":"quiz","questions":[{"text":"¿Qué hace que una práctica sea concreta?","explanation":"Relacionar una situación, una acción breve y un recordatorio permite llevar la intención al día a día.","options":["Definir un momento, una acción y un recordatorio.","Proponerse cambiar todo de inmediato.","Esperar a tener motivación perfecta."]},{"text":"Si la práctica no encaja en tu día, ¿qué puedes hacer?","explanation":"Ajustar el momento o la duración ayuda a encontrar una práctica sostenible.","options":["Revisar lo ocurrido y ajustar el momento o la duración.","Considerarlo un fracaso definitivo.","Aumentar siempre su dificultad."]}]}
]$json$::jsonb) LOOP
  INSERT INTO lessons(module_id,title,slug,description,transcript,content_type,duration_seconds,sort_order,is_published,is_free,xp_reward)
  VALUES(target_module,item->>'title',item->>'slug','Contenido de integración de ejemplo, editable desde administración.',item->>'body',item->>'type',180,0,true,false,25) RETURNING id INTO lesson_id;
  new_ids:=array_append(new_ids,lesson_id);
  IF item->>'type'='quiz' THEN
   INSERT INTO quizzes(lesson_id,title,description,passing_score,xp_reward) VALUES(lesson_id,item->>'title','Responde a dos preguntas para integrar la lectura. Puedes volver a intentarlo.',100,50) RETURNING id INTO quiz_id;
   qi:=0;
   FOR question IN SELECT value FROM jsonb_array_elements(item->'questions') LOOP
    INSERT INTO quiz_questions(quiz_id,question,type,explanation,sort_order) VALUES(quiz_id,question->>'text','multiple_choice',question->>'explanation',qi) RETURNING id INTO question_id;
    qi:=qi+1; oi:=0;
    FOR option IN SELECT value FROM jsonb_array_elements(question->'options') LOOP
     INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order) VALUES(question_id,option#>>'{}',oi=0,oi);
     oi:=oi+1;
    END LOOP;
   END LOOP;
  END IF;
 END LOOP;
 FOR idx IN 1..total LOOP
  ordered_ids:=array_append(ordered_ids,existing_ids[idx]);
  IF idx=anchor THEN ordered_ids:=ordered_ids||new_ids[1:2]; END IF;
  IF idx=LEAST(total,anchor+1) THEN ordered_ids:=ordered_ids||new_ids[3:4]; END IF;
 END LOOP;
 FOR idx IN 1..cardinality(ordered_ids) LOOP UPDATE lessons SET sort_order=idx-1 WHERE id=ordered_ids[idx]; END LOOP;
END $$;
COMMIT;
