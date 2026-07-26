import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy route — redirect to hub-based transport publish flow. */
export default function TransportRequestRedirect() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const scope = type === 'tindouf' || type === 'international' ? undefined : undefined;
  const qs =
    type === 'tindouf'
      ? '?scope=local&origin=tindouf&dest=rabouni'
      : type === 'international'
        ? '?scope=international'
        : scope
          ? `?scope=${scope}`
          : '';
  return <Redirect href={`/transport${qs}` as `/transport`} />;
}
