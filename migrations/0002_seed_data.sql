-- =====================================================
-- Leader Blueprint - Datos Iniciales
-- =====================================================

-- Insertar planes de suscripción
INSERT OR IGNORE INTO subscription_plans (id, name, slug, description, price_monthly, price_yearly, features, is_active) VALUES
  ('plan_free', 'Plan Gratuito', 'free', 'Acceso a contenido gratuito', 0, 0, '["Lecciones de preview", "Comunidad básica"]', 1),
  ('plan_premium', 'Plan Premium', 'premium', 'Acceso completo a toda la plataforma', 29.99, 249.99, '["Todas las formaciones", "Mentoría grupal", "Comunidad VIP", "Recursos descargables"]', 1),
  ('plan_elite', 'Plan Elite', 'elite', 'Acceso premium + mentoría individual', 99.99, 899.99, '["Todo de Premium", "Mentoría individual mensual", "Acceso anticipado", "Soporte prioritario"]', 1);

-- Insertar configuración del sistema
INSERT OR IGNORE INTO system_config (key, value, description) VALUES
  ('site_name', 'Leader Blueprint', 'Nombre del sitio'),
  ('xp_per_lesson', '50', 'XP por completar una lección'),
  ('xp_per_module', '200', 'XP bonus por completar un módulo'),
  ('xp_per_streak_day', '25', 'XP bonus por día de racha'),
  ('xp_level_multiplier', '1000', 'XP necesario por nivel'),
  ('mentorship_session_price', '150', 'Precio por sesión de mentoría'),
  ('mentorship_session_duration', '60', 'Duración de sesión en minutos');

-- Insertar formación inicial: Mindset Mastery
INSERT OR IGNORE INTO formations (id, title, slug, description, short_description, level, duration_minutes, is_premium, is_published, sort_order) VALUES
  ('form_mindset', 'Mindset Mastery', 'mindset-mastery', 
   'Transforma tu mentalidad y desbloquea tu máximo potencial. Este programa te guiará a través de técnicas probadas de neurociencia y psicología positiva.',
   'Domina tu mente, domina tu vida.',
   'beginner', 180, 1, 1, 1);

-- Insertar módulos para Mindset Mastery
INSERT OR IGNORE INTO modules (id, formation_id, title, slug, description, sort_order, is_published) VALUES
  ('mod_intro', 'form_mindset', 'Introducción al Mindset', 'introduccion', 'Comprende los fundamentos de la mentalidad de crecimiento.', 1, 1),
  ('mod_ritual', 'form_mindset', 'El Ritual Matutino', 'ritual-matutino', 'Establece una rutina matutina transformadora.', 2, 1),
  ('mod_neural', 'form_mindset', 'Recableado Neural', 'recableado-neural', 'Aprende a reprogramar tus patrones de pensamiento.', 3, 1),
  ('mod_frequency', 'form_mindset', 'Alineación de Frecuencia', 'alineacion-frecuencia', 'Sintoniza tu energía con tus objetivos.', 4, 1);

-- Insertar lecciones para módulo Introducción
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, description, content_type, video_duration_seconds, sort_order, is_free_preview, is_published) VALUES
  ('les_intro_1', 'mod_intro', 'Bienvenida al Programa', 'bienvenida', 'Conoce lo que aprenderás en esta formación.', 'video', 300, 1, 1, 1),
  ('les_intro_2', 'mod_intro', 'La Ciencia del Mindset', 'ciencia-mindset', 'Base científica de la mentalidad de crecimiento.', 'video', 480, 2, 0, 1),
  ('les_intro_3', 'mod_intro', 'Tu Primera Reflexión', 'primera-reflexion', 'Ejercicio práctico de autoconocimiento.', 'exercise', 600, 3, 0, 1);

-- Insertar lecciones para módulo Ritual Matutino
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, description, content_type, video_duration_seconds, sort_order, is_free_preview, is_published) VALUES
  ('les_ritual_1', 'mod_ritual', 'Por Qué Importa la Mañana', 'importancia-manana', 'El poder de las primeras horas del día.', 'video', 420, 1, 0, 1),
  ('les_ritual_2', 'mod_ritual', 'Diseñando Tu Ritual', 'disenando-ritual', 'Crea tu rutina matutina personalizada.', 'video', 720, 2, 0, 1),
  ('les_ritual_3', 'mod_ritual', 'Meditación Matutina Guiada', 'meditacion-matutina', 'Práctica de meditación de 10 minutos.', 'audio', 600, 3, 0, 1),
  ('les_ritual_4', 'mod_ritual', 'Journaling Transformador', 'journaling', 'Técnicas de escritura reflexiva.', 'video', 540, 4, 0, 1);

-- Insertar lecciones para módulo Recableado Neural
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, description, content_type, video_duration_seconds, sort_order, is_free_preview, is_published) VALUES
  ('les_neural_1', 'mod_neural', 'Neuroplasticidad Básica', 'neuroplasticidad', 'Cómo el cerebro puede cambiar a cualquier edad.', 'video', 600, 1, 0, 1),
  ('les_neural_2', 'mod_neural', 'Identificando Patrones Limitantes', 'patrones-limitantes', 'Reconoce los pensamientos que te frenan.', 'video', 540, 2, 0, 1),
  ('les_neural_3', 'mod_neural', 'Técnicas de Reprogramación', 'reprogramacion', 'Métodos prácticos para nuevos hábitos mentales.', 'video', 720, 3, 0, 1),
  ('les_neural_4', 'mod_neural', 'El Crítico Interior', 'critico-interior', 'Transforma tu voz interna negativa.', 'exercise', 480, 4, 0, 1);

-- Insertar lecciones para módulo Alineación de Frecuencia
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, description, content_type, video_duration_seconds, sort_order, is_free_preview, is_published) VALUES
  ('les_freq_1', 'mod_frequency', 'Introducción a las Frecuencias', 'intro-frecuencias', 'La ciencia detrás de las frecuencias solfeggio.', 'video', 480, 1, 0, 1),
  ('les_freq_2', 'mod_frequency', 'Meditación 432Hz', 'meditacion-432hz', 'Sesión de meditación con frecuencia Alpha.', 'audio', 900, 2, 0, 1),
  ('les_freq_3', 'mod_frequency', 'Integración Diaria', 'integracion-diaria', 'Cómo incorporar las frecuencias en tu rutina.', 'video', 420, 3, 0, 1);

-- Insertar segunda formación: Resiliencia Estoica
INSERT OR IGNORE INTO formations (id, title, slug, description, short_description, level, duration_minutes, is_premium, is_published, sort_order) VALUES
  ('form_stoic', 'Resiliencia Estoica', 'resiliencia-estoica', 
   'Aplica la sabiduría estoica milenaria para enfrentar los desafíos modernos con claridad y fortaleza interior.',
   'Filosofía práctica para el mundo moderno.',
   'intermediate', 150, 1, 1, 2);

-- Insertar módulos para Resiliencia Estoica
INSERT OR IGNORE INTO modules (id, formation_id, title, slug, description, sort_order, is_published) VALUES
  ('mod_stoic_intro', 'form_stoic', 'Fundamentos Estoicos', 'fundamentos', 'Los pilares de la filosofía estoica.', 1, 1),
  ('mod_stoic_practice', 'form_stoic', 'Prácticas Diarias', 'practicas-diarias', 'Ejercicios estoicos para cada día.', 2, 1);

-- Insertar lecciones para Fundamentos Estoicos
INSERT OR IGNORE INTO lessons (id, module_id, title, slug, description, content_type, video_duration_seconds, sort_order, is_free_preview, is_published) VALUES
  ('les_stoic_1', 'mod_stoic_intro', 'Historia del Estoicismo', 'historia', 'Desde Marco Aurelio hasta hoy.', 'video', 600, 1, 1, 1),
  ('les_stoic_2', 'mod_stoic_intro', 'Dicotomía del Control', 'dicotomia-control', 'Lo que puedes y no puedes controlar.', 'video', 540, 2, 0, 1),
  ('les_stoic_3', 'mod_stoic_intro', 'Amor Fati', 'amor-fati', 'Amar tu destino.', 'video', 480, 3, 0, 1);

-- Insertar mentor: Ainara
INSERT OR IGNORE INTO mentors (id, name, title, bio, specialties, session_price, session_duration_minutes, is_active) VALUES
  ('mentor_ainara', 'Ainara Sterling', 'Life Coach & Mentora de Transformación',
   'Con más de 10 años de experiencia en coaching de vida y desarrollo personal, Ainara ha guiado a cientos de personas hacia su mejor versión. Su enfoque combina neurociencia, filosofía práctica y técnicas de mindfulness.',
   '["Mindset de crecimiento", "Gestión emocional", "Propósito de vida", "Liderazgo personal", "Productividad consciente"]',
   150, 60, 1);

-- Insertar disponibilidad de Ainara (Lun-Vie 9:00-17:00)
INSERT OR IGNORE INTO mentor_availability (id, mentor_id, day_of_week, start_time, end_time, is_active) VALUES
  ('avail_1', 'mentor_ainara', 1, '09:00', '17:00', 1), -- Lunes
  ('avail_2', 'mentor_ainara', 2, '09:00', '17:00', 1), -- Martes
  ('avail_3', 'mentor_ainara', 3, '09:00', '17:00', 1), -- Miércoles
  ('avail_4', 'mentor_ainara', 4, '09:00', '17:00', 1), -- Jueves
  ('avail_5', 'mentor_ainara', 5, '09:00', '13:00', 1); -- Viernes (medio día)

-- =====================================================
-- Usuarios de Prueba
-- =====================================================
-- Admin password: Admin123! (hash: 3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121)
-- User password: User1234! (hash: 0ac8adfad468b363de01d0556d4239831b654eab5d732cf7564b8e975853c22c)

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, status, email_verified) VALUES
  ('user_admin', 'admin@leaderblueprint.com', '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', 'Administrador', 'admin', 'active', 1),
  ('user_demo', 'demo@leaderblueprint.com', '0ac8adfad468b363de01d0556d4239831b654eab5d732cf7564b8e975853c22c', 'Usuario Demo', 'user', 'active', 1),
  ('user_premium', 'premium@leaderblueprint.com', '0ac8adfad468b363de01d0556d4239831b654eab5d732cf7564b8e975853c22c', 'Usuario Premium', 'user', 'active', 1);

-- Acceso para usuarios de prueba
INSERT OR IGNORE INTO user_access (id, user_id, plan_id, access_type, access_granted_by, access_reason, is_active) VALUES
  ('access_admin', 'user_admin', 'plan_elite', 'manual', 'system', 'Administrador del sistema', 1),
  ('access_demo', 'user_demo', 'plan_free', 'free', 'system', 'Cuenta de demostración', 1),
  ('access_premium', 'user_premium', 'plan_premium', 'paid', 'system', 'Suscripción premium activa', 1);

-- Rachas para usuarios de prueba
INSERT OR IGNORE INTO user_streaks (id, user_id, current_streak, longest_streak, total_xp, level, last_activity_date) VALUES
  ('streak_admin', 'user_admin', 45, 60, 25000, 25, date('now')),
  ('streak_demo', 'user_demo', 3, 7, 500, 1, date('now')),
  ('streak_premium', 'user_premium', 14, 21, 12450, 12, date('now'));

-- Progreso de usuario premium (para mostrar en dashboard)
INSERT OR IGNORE INTO user_progress (id, user_id, lesson_id, status, progress_percent, last_position_seconds) VALUES
  ('prog_1', 'user_premium', 'les_intro_1', 'completed', 100, 300),
  ('prog_2', 'user_premium', 'les_intro_2', 'completed', 100, 480),
  ('prog_3', 'user_premium', 'les_intro_3', 'completed', 100, 600),
  ('prog_4', 'user_premium', 'les_ritual_1', 'completed', 100, 420),
  ('prog_5', 'user_premium', 'les_ritual_2', 'in_progress', 65, 468);

-- Reflexiones de ejemplo para La Taberna
INSERT OR IGNORE INTO reflections (id, user_id, lesson_id, content, is_public) VALUES
  ('ref_1', 'user_premium', 'les_intro_2', 'Hoy aprendí sobre la neuroplasticidad y cómo nuestro cerebro puede cambiar a cualquier edad. Es increíble pensar que cada pensamiento que tenemos está literalmente esculpiendo nuestro cerebro. Me comprometo a ser más consciente de mis patrones de pensamiento.', 1),
  ('ref_2', 'user_demo', NULL, 'Primera semana completada. El ritual matutino está empezando a sentirse natural. La meditación de 10 minutos antes de revisar el teléfono ha cambiado completamente mi energía por las mañanas.', 1),
  ('ref_3', 'user_admin', 'les_neural_4', 'El ejercicio del crítico interior fue revelador. Nunca había notado cuánto me hablaba negativamente a mí mismo. Darle un nombre y externalizarlo me ayuda a no identificarme con esa voz.', 1);

-- Reacciones a reflexiones
INSERT OR IGNORE INTO reflection_reactions (id, reflection_id, user_id, reaction_type) VALUES
  ('react_1', 'ref_1', 'user_demo', 'resonate'),
  ('react_2', 'ref_1', 'user_admin', 'resonate'),
  ('react_3', 'ref_2', 'user_premium', 'support'),
  ('react_4', 'ref_3', 'user_demo', 'resonate'),
  ('react_5', 'ref_3', 'user_premium', 'support');
