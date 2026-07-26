import { Redirect } from 'expo-router';

/** Legacy Tindouf shortcut — publish as local tindouf→rabouni on the main screen. */
export default function TindoufRedirect() {
  return <Redirect href={'/transport?scope=local&origin=tindouf&dest=rabouni' as '/transport'} />;
}
