// Moved to app/edit-profile.tsx — registered in the root Stack as a modal.
import { Redirect } from 'expo-router';
export default function EditProfileRedirect() {
  return <Redirect href="/edit-profile" />;
}
