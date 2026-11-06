import { Colors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const initialStyles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: Colors.rosePale
    },
    title: {
        fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' 
    },
    cardTitle: {
        fontSize: 20, fontWeight: '700', color: Colors.textPrimary 
    },
    sub: { 
        fontSize: 14, color: Colors.textGray, textAlign: 'center' 
    },
    divider: { 
        height: 1, backgroundColor: Colors.roseLight 
    },
    footer: { 
        textAlign: 'center', fontSize: 13, color: Colors.textGray, lineHeight: 20 
    },
    featureIcon: { 
        padding: 8, borderRadius: 8, backgroundColor: Colors.rosePale 
    },
    logo: { 
        width: 500, height: 70, alignSelf: 'center' 
    }
});