'use server'

import { revalidatePath, revalidateTag } from 'next/cache';
import {
  createFormationSchema,
  updateFormationSchema,
  CreateFormationInput,
  UpdateFormationInput,
  createModuleSchema,
  CreateModuleInput
} from '@/lib/validations/content';
import * as formationService from '@/lib/services/formationService';
import { CACHE_TAGS } from '@/lib/cache';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Invalida la caché cross-request del catálogo (lista de /library) tras
 * cualquier cambio de contenido. El siguiente request reconstruye la base 1 vez.
 */
function invalidateCatalog() {
  revalidateTag(CACHE_TAGS.formations);
}

export async function createFormationAction(data: CreateFormationInput) {
  try {
    const validated = createFormationSchema.parse(data);
    const result = await formationService.createFormation(validated);
    invalidateCatalog();
    revalidatePath('/admin/content/formations');
    revalidatePath('/formations', 'layout');
    revalidatePath('/library', 'layout');
    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Error creating formation:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateFormationAction(id: string, data: UpdateFormationInput) {
  try {
    const validated = updateFormationSchema.parse(data);
    const result = await formationService.updateFormation(id, validated);
    invalidateCatalog();
    revalidatePath('/admin/content/formations');
    revalidatePath(`/admin/content/formations/${id}`);
    // Revalidar rutas públicas para que los usuarios vean los cambios inmediatamente
    revalidatePath('/formations', 'layout');
    revalidatePath('/library', 'layout');
    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Error updating formation:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteFormationAction(id: string) {
  try {
    await formationService.deleteFormation(id);
    invalidateCatalog();
    revalidatePath('/admin/content/formations');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting formation:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createModuleAction(data: CreateModuleInput) {
  try {
    const validated = createModuleSchema.parse(data);
    const result = await formationService.createModule(validated);
    invalidateCatalog();
    revalidatePath(`/admin/content/formations/${data.formation_id}`);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Error creating module:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteModuleAction(id: string, formationId: string) {
  try {
    await formationService.deleteModule(id);
    invalidateCatalog();
    revalidatePath(`/admin/content/formations/${formationId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting module:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
