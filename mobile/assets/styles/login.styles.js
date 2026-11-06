import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export const loginStyles = StyleSheet.create({
    title: {  
        fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' 
    },
    sub: { 
        fontSize: 14, color: Colors.textGray, textAlign: 'center' 
    },
    footer: { 
        marginTop: 6, textAlign: 'center', fontSize: 13, color: Colors.textGray 
    },
});