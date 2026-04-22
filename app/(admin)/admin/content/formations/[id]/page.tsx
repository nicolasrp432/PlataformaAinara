import { getFormationById } from '@/lib/services/formationService';
import FormationEditorClientPage from './client-page';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FormationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const isNew = resolvedParams.id === 'new';
  
  let formationData = null;
  
  if (!isNew) {
    const rawData = await getFormationById(resolvedParams.id);
    if (!rawData) {
      notFound();
    }
    formationData = JSON.parse(JSON.stringify(rawData));
  }

  return <FormationEditorClientPage isNew={isNew} initialData={formationData} />;
}
