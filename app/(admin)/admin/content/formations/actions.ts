'use server'

import { revalidatePath } from 'next/cache';
import { 
  createFormationSchema, 
  updateFormationSchema, 
  CreateFormationInput, 
  UpdateFormationInput,
  createModuleSchema,
  CreateModuleInput
} from '@/lib/validations/content';
import * as formationService from '@/lib/services/formationService';

export async function createFormationAction(data: CreateFormationInput) {
  try {
    const validated = createFormationSchema.parse(data);
    const result = await formationService.createFormation(validated);
    revalidatePath('/admin/content/formations');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating formation:', error);
    return { success: false, error: error.message };
  }
}

export async function updateFormationAction(id: string, data: UpdateFormationInput) {
  try {
    const validated = updateFormationSchema.parse(data);
    const result = await formationService.updateFormation(id, validated);
    revalidatePath('/admin/content/formations');
    revalidatePath(`/admin/content/formations/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating formation:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFormationAction(id: string) {
  try {
    await formationService.deleteFormation(id);
    revalidatePath('/admin/content/formations');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting formation:', error);
    return { success: false, error: error.message };
  }
}

export async function createModuleAction(data: CreateModuleInput) {
  try {
    const validated = createModuleSchema.parse(data);
    const result = await formationService.createModule(validated);
    revalidatePath(`/admin/content/formations/${data.formation_id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating module:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteModuleAction(id: string, formationId: string) {
  try {
    await formationService.deleteModule(id);
    revalidatePath(`/admin/content/formations/${formationId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting module:', error);
    return { success: false, error: error.message };
  }
}
