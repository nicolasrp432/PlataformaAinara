import { createClient } from '@/lib/supabase/server';
import { CreateFormationInput, UpdateFormationInput, CreateModuleInput, UpdateModuleInput } from '@/lib/validations/content';

/**
 * FORMATIONS
 */
export async function getFormations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formations')
    .select(`
      *,
      modules:modules(count),
      lessons:modules(lessons(count))
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return (data || []).map((f: any) => ({
    ...f,
    modules_count: f.modules?.[0]?.count || 0,
    lessons_count: f.lessons?.reduce((acc: number, m: any) => acc + (m.lessons?.[0]?.count || 0), 0) || 0
  }));
}

export async function getFormationById(id: string) {
  const supabase = await createClient();
  
  // Load formation
  const { data: formationData, error: formationError } = await supabase
    .from('formations')
    .select('*')
    .eq('id', id)
    .single();

  if (formationError) {
    if (formationError.code === 'PGRST116') return null; // Not found
    throw new Error(formationError.message);
  }

  // Load modules with lessons
  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select(`
      *,
      lessons(*)
    `)
    .eq('formation_id', id)
    .order('order_index', { ascending: true });

  if (modulesError) throw new Error(modulesError.message);
  
  // Sort lessons within each module
  const sortedModules = (modulesData || []).map((m: any) => ({
    ...m,
    lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
  }));
  
  return { ...formationData, modules: sortedModules };
}

export async function createFormation(input: CreateFormationInput) {
  const supabase = await createClient();
  
  // Si no viene slug, lo generamos del titulo solo para tener un base.
  let payload = { ...input };
  if (!payload.slug && payload.title) {
    payload.slug = payload.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const { data, error } = await supabase
    .from('formations')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateFormation(id: string, input: UpdateFormationInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('formations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFormation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('formations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * MODULES
 */
export async function createModule(input: CreateModuleInput) {
  const supabase = await createClient();
  
  const slug = input.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
  
  const { data, error } = await supabase
    .from('modules')
    .insert({ ...input, slug })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('modules')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteModule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}
