import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

const C = Colors.dark;

const ONGLETS = [
  { name: 'index', label: "Aujourd'hui", icon: require('@/assets/images/tabIcons/flamme.png') },
  { name: 'repas', label: 'Repas', icon: require('@/assets/images/tabIcons/repas.png') },
  { name: 'coach', label: 'Coach', icon: require('@/assets/images/tabIcons/coach.png') },
  { name: 'sport', label: 'Sport', icon: require('@/assets/images/tabIcons/sport.png') },
  { name: 'profil', label: 'Profil', icon: require('@/assets/images/tabIcons/profil.png') },
];

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={C.background}
      indicatorColor={C.backgroundSelected}
      iconColor={{ default: C.textSecondary, selected: C.accent }}
      labelStyle={{ default: { color: C.textSecondary }, selected: { color: C.accent } }}>
      {ONGLETS.map((o) => (
        <NativeTabs.Trigger key={o.name} name={o.name}>
          <NativeTabs.Trigger.Label>{o.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon src={o.icon} renderingMode="template" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
