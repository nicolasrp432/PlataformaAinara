-- Plataforma Ainara - Indexes and Triggers (Part C)
-- Run this AFTER 003b

-- Indexes for performance (only on columns that definitely exist)
CREATE INDEX IF NOT EXISTS idx_formations_slug ON public.formations(slug);
CREATE INDEX IF NOT EXISTS idx_formations_published ON public.formations(is_published);
CREATE INDEX IF NOT EXISTS idx_modules_formation ON public.modules(formation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_formation ON public.enrollments(formation_id);

-- Triggers for updated_at (drop if exists to avoid conflicts)
DROP TRIGGER IF EXISTS on_formations_updated ON public.formations;
DROP TRIGGER IF EXISTS on_modules_updated ON public.modules;
DROP TRIGGER IF EXISTS on_lessons_updated ON public.lessons;
DROP TRIGGER IF EXISTS on_progress_updated ON public.user_progress;

CREATE TRIGGER on_formations_updated BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_modules_updated BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_lessons_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_progress_updated BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
