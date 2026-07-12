import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchApi } from '@/lib/api';
import { theme, radii } from '@/lib/theme';

type TrustData = {
  reputationScore: number;
  badges: { badge: string }[];
};

export function SellerTrustBadge({ userId }: { userId?: string }) {
  const [data, setData] = useState<TrustData | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchApi<TrustData>(`/reviews/trust/${userId}`)
      .then(setData)
      .catch(() => setData(null));
  }, [userId]);

  if (!data) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>★ {Math.round(data.reputationScore)}/100</Text>
      {data.badges.length > 0 ? (
        <Text style={styles.badges}> · {data.badges.length} badges</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45,138,98,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: 12,
  },
  text: { fontSize: 13, fontWeight: '800', color: theme.oasisDeep },
  badges: { fontSize: 13, fontWeight: '600', color: theme.oasisDeep },
});
