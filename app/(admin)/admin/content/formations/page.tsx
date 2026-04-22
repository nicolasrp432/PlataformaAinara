import { getFormations } from '@/lib/services/formationService';
import FormationsClientPage from './client-page';

export const dynamic = 'force-dynamic';

export default async function FormationsPage() {
  const formations = await getFormations();
  return <FormationsClientPage initialData={formations} />;
}
