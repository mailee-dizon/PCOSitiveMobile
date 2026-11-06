import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image'
import { initialStyles as styles } from '@/assets/styles/initial.styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function InitialScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <SafeAreaView>
        <Image style={styles.logo} source={require('@/assets/images/brand/PCOSitiveLogo.png')} contentFit="contain"/>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={styles.title}>Welcome To Chloe!</Text>
          <Text style={styles.sub}>
            Track your PCOS journey, connect with Chloe, and take control of your health.
          </Text>
          <View>
            <Text>
              <MaterialIcons name="security" size={20}/>
              Secure & Private
            </Text>
            <Text>
              Your data is encrypted and never shared
            </Text>
          </View>
          <View>
            <Text>
              <MaterialIcons name="lock" size={20}/>
              Protected Health Info
            </Text>
            <Text>
              We follow strict privacy guidelines to protect your information
            </Text>
          </View>
        </View>
        <View>
          <TouchableOpacity
            onPress={() => {
              router.push('/login')
            }}
          >
            <Text>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              router.push({ pathname: '/login', params: { signup: 'true' } })
            }}
          >
            <Text>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

