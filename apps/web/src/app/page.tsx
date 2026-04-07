import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('last_notebook_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefs?.last_notebook_id) {
    redirect(`/notebook/${prefs.last_notebook_id}`);
  }

  redirect('/notebook/unclassified');
}
