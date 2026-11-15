import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const ONGLETS = [
  { name: 'index', label: "Aujourd'hui", icon: require('@/assets/images/tabIcons/home.png') },
  { name: 'repas', label: 'Repas', icon: require('@/assets/images/tabIcons/explore.png') },
  { name: 'sport', label: 'Sport', icon: require('@/assets/images/tabIcons/explore.png') },
  { name: 'profil', label: 'Profil', icon: require('@/assets/images/tabIcons/home.png') },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      {ONGLETS.map((o) => (
        <NativeTabs.Trigger key={o.name} name={o.name}>
          <NativeTabs.Trigger.Label>{o.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon src={o.icon} renderingMode="template" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
